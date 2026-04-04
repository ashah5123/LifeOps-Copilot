# Vidhi Work Pack

## Role
Frontend Developer

## Full Project Flowchart

```text
+----------------------+
| Student Opens App    |
+----------+-----------+
           |
           v
+----------------------+
| Dashboard + Upload   |
+----------+-----------+
           |
           v
+----------------------+
| Ingestion Layer      |
+----------+-----------+
           |
           v
+----------------------+
| Router Agent         |
+-----+----+----+------+
      |    |    |
      v    v    v
   Inbox Career Calendar Budget
      |    |    |
      +----+----+
           |
           v
+----------------------+
| Extractor Agent      |
+----------+-----------+
           |
           v
+----------------------+
| Planner Agent        |
+----------+-----------+
           |
           v
+----------------------+
| Review / Approval    |
+----------+-----------+
           |
           v
+----------------------+
| Action Agent         |
+----------+-----------+
           |
           v
+----------------------+
| Today Feed + Memory  |
+----------------------+
```

## Final Common Folder Structure

```text
SparkUp/
  README.md
  frontend/
    package.json
    src/
      app/
        layout.tsx
        page.tsx
        dashboard/
          page.tsx
        inbox/
          page.tsx
        career/
          page.tsx
        calendar/
          page.tsx
        budget/
          page.tsx
      components/
        common/
          Button.tsx
          Card.tsx
          Loader.tsx
        upload/
          UploadBox.tsx
        feed/
          TodayFeed.tsx
        approvals/
          ApprovalModal.tsx
        inbox/
          ConnectGmailButton.tsx
      lib/
        api.ts
      types/
        index.ts
  backend/
    requirements.txt
    app/
      main.py
      api/
        __init__.py
        health.py
        dashboard.py
        uploads.py
        auth.py
        inbox.py
        career.py
        calendar.py
        budget.py
        approvals.py
      agents/
        router_agent.py
        extractor_agent.py
        planner_agent.py
        review_agent.py
        action_agent.py
        memory_agent.py
      services/
        firestore_service.py
        storage_service.py
        auth_service.py
        reminder_service.py
        task_service.py
        vertex_service.py
        document_ai_service.py
        google_oauth_service.py
        gmail_service.py
        agent_runner.py
      models/
        application.py
        budget_entry.py
        reminder.py
      core/
        config.py
        dependencies.py
      prompts/
        router_prompt.md
        extractor_prompt.md
        planner_prompt.md
  docs/
    ui-ux/
    api/
    agents/
    team/
  infra/
    gcp-setup.md
  demo-data/
    uploads/
```

## Gmail MVP Update

Use Gmail in **Testing mode** only for hackathon and demo accounts.

### Final Gmail decision
- Use `gmail.readonly` + `gmail.send` for best demo value.
- Keep the app in `External + Testing` mode.
- Add only team or demo accounts as test users.
- Always keep email sending human-reviewed.
- Never auto-send an email without the user clicking `Confirm Send`.

### Simple Gmail flow
1. User clicks `Connect Gmail`.
2. Google login and consent screen opens.
3. Google redirects back with an authorization code.
4. Backend exchanges code for tokens.
5. Backend reads Gmail thread data when needed.
6. AI drafts reply inside SparkUp.
7. User reviews or edits the draft.
8. User clicks `Confirm Send`.
9. Backend sends through Gmail API.

### What this changes in project planning
- Inbox is no longer only manual paste mode.
- Gmail still needs OAuth.
- Production verification is not needed for hackathon demo accounts.
- Token handling and approval UI must be included in role planning.


## Gmail Impact On Your Role

- Add a `Connect Gmail` button that starts backend OAuth login.
- Add inbox states for connected and not connected users.
- Add UI for Gmail message list, selected message view, AI summary, draft editor, and confirm send button.
- Show testing-mode limitations only in setup/help text, not as a blocker in the main UI.
- Keep send action behind explicit user confirmation.

## Endpoints For Your Work

- `GET /api/dashboard/summary`
- `GET /api/feed/today`
- `POST /api/uploads`
- `GET /api/auth/google/login`
- `GET /api/inbox/gmail/messages`
- `POST /api/inbox/gmail/send`
- `POST /api/inbox/process`
- `POST /api/career/analyze-job`
- `POST /api/calendar/extract-schedule`
- `POST /api/budget/entries`
- `GET /api/budget/summary`
- `GET /api/approvals/pending`
- `PATCH /api/approvals/{approvalId}`

## Step By Step Working Order

1. Create the layout and route structure first.
2. Build the dashboard cards, upload box, and today feed.
3. Add inbox UI with Connect Gmail, message list, email detail, summary, and draft editor.
4. Connect shared API helpers in `api.ts` and then wire page-level flows.
5. Finish error, empty, and loading states after the main happy path works.

## Files You Must Create

- `frontend/package.json`
- `frontend/src/types/index.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/common/Button.tsx`
- `frontend/src/components/common/Card.tsx`
- `frontend/src/components/common/Loader.tsx`
- `frontend/src/components/upload/UploadBox.tsx`
- `frontend/src/components/feed/TodayFeed.tsx`
- `frontend/src/components/approvals/ApprovalModal.tsx`
- `frontend/src/components/inbox/ConnectGmailButton.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/inbox/page.tsx`
- `frontend/src/app/career/page.tsx`
- `frontend/src/app/calendar/page.tsx`
- `frontend/src/app/budget/page.tsx`