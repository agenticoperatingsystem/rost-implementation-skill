# Conversation-grant handoff

This capability is not yet available.

Full Operator external-effect handoff — the bounded capture of owner intent for external actions such as email or Slack — ships in a future ROST release. Until then:

- Do not attempt external sends.
- Do not forward or self-attest an owner's words.
- Do not guess speculative endpoints.

## How the capability will be selected

When that capability is deployed, the agent selects it only through live capability discovery:

- `rost command list` to enumerate commands.
- `rost docs` to read current how-to guidance.

There is currently no endpoint to call.

## What to do today

If the owner asks the agent to send email, post to Slack, or perform another external effect on their behalf:

1. State honestly that the conversation-grant handoff capability is not yet available.
2. Identify the prerequisite: the CLI implementation surface must support the bounded capture and integration fixture, which is not yet part of any release.
3. Offer the regular-mode alternative: prepare the draft or rationale and pause for the owner to send it themselves.
4. Do not improvise a workaround or call an undocumented endpoint.
