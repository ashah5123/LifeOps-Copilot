"""Agent runner — orchestrates the full agent pipeline.

Pipeline: router → extractor → planner → review → action → memory

Each step receives the output of the previous step.  The runner is the
single entry-point that API routes call for AI processing.
"""

from __future__ import annotations

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
