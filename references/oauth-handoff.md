# OAuth and external-provider handoff

Provider OAuth is a human action in every mode. The agent never completes an OAuth consent flow on the owner's behalf.

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
4. Resume from the checkpoint when the connection becomes available.

For example, if Google Sheets is unavailable, document that Signal bindings from Sheets will be created later, continue with the Responsibility Graph and Charters, and return to the Sheets binding step when the owner completes OAuth.
