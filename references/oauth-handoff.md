# OAuth and external-provider handoff

Provider OAuth is a human action in every mode. The agent never completes an OAuth consent flow on the owner's behalf, and completing OAuth or source-system login is out of scope during onboarding setup: implementation proceeds without live source connections, and each missing connection becomes a typed readiness warning plus an unresolved-source-connection entry in the final report — never fabricated data.

## Signals are never submitted as live

The rule above has a sharp consequence at setup time. A `live_verified` Signal posture claims a source connection has been proven, and during onboarding no such proof can exist — OAuth has not happened, and the Signal the connection would feed does not exist yet. The setup command refuses a `live_verified` posture before the approval card is created, naming each offending Signal and saying why.

So: submit every Signal as `manual`, `imported_history`, or `not_connected`, whichever is true. Owner-accepted history stays `imported_history` — acceptance is not authorship. Then, once the company exists, connect each Signal's integration from that Signal's own page, which is the order the platform is built for. Record every one of those as a later action in the final report.

## What to prepare

Before handing the owner a consent link, gather and present:

1. Exact provider (for example, Google Workspace, Slack, GitHub).
2. Exact scopes requested.
3. Rationale for each scope and what ROST will do with the granted access.
4. The consent link.
5. Which workflow the connection unblocks.
6. The post-consent continuation state: what the agent will do after the owner reports success.

## During the handoff

- Present the prepared information in one place.
- Ask the owner to complete the consent flow.
- Do not ask the owner to paste tokens or secrets into the chat.
- After the owner confirms completion, verify the connection through the appropriate ROST read command before continuing.

## Unavailable-connection pattern

If a provider connection is unavailable or the owner declines it:

1. Present the action pack: what the connection would have enabled and the manual fallback.
2. Pause the dependent step.
3. Keep the rest of implementation moving.
4. Record the connection as unresolved in the final report, with what it blocks.
5. Resume from the checkpoint when the connection becomes available.

An absent source system never produces fabricated output. A Charter must not claim an absent source is usable; a draft/report-only agent may carry the missing connection as a warning, but its outputs must state that useful operation is partial until the connection exists.

For example, if Google Sheets is unavailable, document that Signal bindings from Sheets will be created later, continue with the Responsibility Graph and Charters, list the Sheets connection as unresolved in the final report, and return to the binding step when the owner completes OAuth.
