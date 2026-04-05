"""Agent runner — orchestrates the full agent pipeline.

Pipeline: router → extractor → planner → review → action → memory

Each step receives the output of the previous step.  The runner is the
single entry-point that API routes call for AI processing.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.agents.action_agent import ActionAgent
from app.agents.extractor_agent import ExtractorAgent
from app.agents.memory_agent import MemoryAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.review_agent import ReviewAgent
from app.agents.router_agent import RouterAgent
from app.services.firestore_service import FirestoreService
from app.services.vertex_service import VertexService


class AgentRunner:
    """Orchestrate the multi-agent pipeline."""

    def __init__(
        self,
        vertex: VertexService | None = None,
        firestore: FirestoreService | None = None,
    ) -> None:
        vertex = vertex or VertexService()
        firestore = firestore or FirestoreService()

        self.router = RouterAgent(vertex=vertex)
        self.extractor = ExtractorAgent(vertex=vertex)
        self.planner = PlannerAgent(vertex=vertex)
        self.review = ReviewAgent()
        self.action = ActionAgent()
        self.memory = MemoryAgent(firestore=firestore)

    def process(self, content: str) -> dict[str, object]:
        """Run the full pipeline and return all intermediate results."""
        route = self.router.run(content)
        extracted = self.extractor.run(content=content, domain=route["domain"])
        plan = self.planner.run(domain=route["domain"], extracted=extracted)
        review = self.review.run(plan=plan)
        action = self.action.run(domain=route["domain"], plan=plan)
        memory = self.memory.run(action_result=action)

        return {
            "route": route,
            "extracted": extracted,
            "plan": plan,
            "review": review,
            "result": action,
            "memory": memory,
        }

    def process_for_domain(self, content: str, forced_domain: str) -> dict[str, object]:
        """Run the pipeline with a pre-determined domain (skips router)."""
        extracted = self.extractor.run(content=content, domain=forced_domain)
        plan = self.planner.run(domain=forced_domain, extracted=extracted)
        review = self.review.run(plan=plan)
        action = self.action.run(domain=forced_domain, plan=plan)
        memory = self.memory.run(action_result=action)

        return {
            "route": {"domain": forced_domain},
            "extracted": extracted,
            "plan": plan,
            "review": review,
            "result": action,
            "memory": memory,
        }

    def orchestrate_pipeline(
        self,
        content: str,
        file_id: str | None = None,
        source_module: str | None = None,
        metadata: dict | None = None,
    ) -> dict[str, object]:
        """Full orchestration: fetch file → route → extract → plan → action → review → persist.

        Steps:
          a) If file_id given, fetch extractedText from uploads collection and append.
          b) Classify domain via router (or use source_module if it is a known domain).
          c) Extract structured facts via extractor.
          d) Decide next actions via planner.
          e) Build action payload via action agent.
          f) Check confidence / approval requirement via review agent.
          g) Persist domain-specific records (budget_entries, calendar_events, drafts).
          h) Add entry to feed_items for today feed.
          i) If approval required, add to approvals collection.
        """
        process_id = str(uuid4())
        metadata = metadata or {}
        combined_content = content

        # --- a) fetch file content ---
        if file_id:
            upload = self.memory._fs.get("uploads", file_id)
            if upload:
                file_text = upload.get("extractedText", "")
                if file_text:
                    combined_content = f"{content}\n\n{file_text}".strip() if content else file_text

        # --- b) classify domain ---
        if source_module and source_module in RouterAgent.DOMAINS:
            route: dict[str, object] = {"domain": source_module}
        else:
            route = self.router.run(combined_content)
        domain: str = str(route["domain"])

        # --- c) extract structured facts ---
        extracted = self.extractor.run(content=combined_content, domain=domain)

        # --- d) plan next actions ---
        plan = self.planner.run(domain=domain, extracted=extracted)

        # --- e) generate action outputs ---
        action = self.action.run(domain=domain, plan=plan)

        # --- f) review confidence and approval flag ---
        review = self.review.run(plan=plan)
        approval_required: bool = bool(review.get("requiresApproval", False))

        now = datetime.now(timezone.utc).isoformat()
        fields: dict = extracted.get("fields", {})  # type: ignore[assignment]

        # --- g) domain-specific persistence ---
        if domain == "budget":
            amount = fields.get("amount")
            if amount is not None:
                self.memory._fs.create("budget_entries", {
                    "id": str(uuid4()),
                    "process_id": process_id,
                    "amount": float(amount),
                    "category": fields.get("category", "general"),
                    "description": str(fields.get("summary", ""))[:200],
                    "entry_type": "expense",
                    "date": now[:10],
                    "source": "agent",
                    **{k: v for k, v in metadata.items() if k not in ("id", "process_id")},
                })

        elif domain == "calendar":
            for date_str in fields.get("dates", []):
                self.memory._fs.create("calendar_events", {
                    "id": str(uuid4()),
                    "process_id": process_id,
                    "title": str(fields.get("title", "Extracted event"))[:120],
                    "date": date_str,
                    "source": "agent",
                    "created_at": now,
                })

        elif domain == "inbox":
            self.memory._fs.create("drafts", {
                "id": str(uuid4()),
                "process_id": process_id,
                "draft_reply": action.get("draftReply", ""),
                "sender": fields.get("sender", ""),
                "summary": str(fields.get("summary", ""))[:300],
                "status": "pending_approval",
                "created_at": now,
            })

        # --- h) feed_items entry ---
        feed_item: dict[str, object] = {
            "id": str(uuid4()),
            "process_id": process_id,
            "domain": domain,
            "title": action.get("title", f"{domain.title()} processed"),
            "detail": action.get("detail", ""),
            "date": now[:10],
            "timestamp": now,
            "source_module": source_module or domain,
            "metadata": metadata,
        }
        self.memory._fs.create("feed_items", feed_item)

        # --- i) approvals entry ---
        if approval_required:
            self.memory._fs.create("approvals", {
                "id": str(uuid4()),
                "process_id": process_id,
                "domain": domain,
                "title": action.get("title", "Pending approval"),
                "detail": action.get("detail", ""),
                "review_note": review.get("reviewNote", ""),
                "status": "pending",
                "created_at": now,
                "action_payload": action,
            })

        # Persist full snapshot via memory agent
        self.memory.run(action_result=action)

        return {
            "process_id": process_id,
            "domain": domain,
            "extracted_data": extracted,
            "suggested_actions": plan.get("recommendedActions", []),
            "approval_required": approval_required,
            "results": {
                "route": route,
                "extracted": extracted,
                "plan": plan,
                "review": review,
                "action": action,
                "feed_item": feed_item,
            },
        }
