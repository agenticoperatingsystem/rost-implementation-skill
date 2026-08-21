# Changelog

## v0.3.0

The V2 setup flow: one required approval, a prepared runner, and a fallback that is never silent.

### The flow changed shape

- **The canonical flow is now sixteen steps**, with **step 6 — prepare the runner setup** inserted after the resume read. It has its own reference, [references/runner-setup.md](references/runner-setup.md).
- **One required approval, not two.** The composite setup approval creates the company, configures the AI Chief of Staff on its lane, and records onboarding as finished. Launching the agents a plan leaves in draft is a **second, OPTIONAL** composite decision. A run that stops after setup delivered a complete operating company — steps 12 and 13 are now the optional pair, taken together or not at all.
- **The final report gained two sections**: the lane the AI Chief of Staff actually reached, and the **later launch actions** — the concrete next steps for everything the run deliberately left for later.

### Retired claims

Both were made false by the shipped platform, and the validator now rejects either one if it reappears anywhere in the corpus:

- *"A complete implementation asks the owner for exactly two composite decisions."*
- *"There is no cloud fallback."*

### New hard rules

- **Do not hide a lane fallback.** The AI Chief of Staff falls back from a preferred Runner lane to Cloud with one of three typed reasons — `runner_setup_absent`, `runner_setup_incomplete`, `runner_not_ready` — and the requested lane, the effective lane, and the reason are always reported.
- **Do not submit a Signal as live.** `live_verified` is refused before the approval card exists; submit `manual`, `imported_history`, or `not_connected` and connect the source afterwards.
- **Do not enable a governance posture on the owner's behalf.** The Trusted-posture commands are owner-only and human-only: prepare the review, hand it over, return control.
- Runner **preferred** is not runner **active**. The lane is decided from readiness at approval time; the honest statement is "runner preferred; the receipt names the lane it reached".

### Fixtures and validator

- New positives: `cloud-fallback` (a visible fallback is a valid outcome) and `aicos-only` (setup approval alone). `canonical-flow` is now the Runner-ready canonical fixture.
- New negatives: `silent-cloud-fallback`, `oauth-gated-live-signal`, and `agent-enables-trusted-posture`.
- **`aicos_lane` is required on every fixture** — the strongest rule in the corpus must not be evadable by omitting the field it reads.
- **Every negative declares `rejected_because`** and must be rejected for that reason — a negative rejected for the wrong reason looks green while the rule it names goes unpinned.
- The validator cross-checks the launch approval count against the launch steps, so "activation optional" is mechanical rather than prose.

### Compatibility

`protocol.minCli` is unchanged at `0.7.124`. The implementation-credential route for `rost runner setup start|status|resume` ships in a later CLI; discover it by running the command, not by comparing version strings, and continue with `runner_setup_id: null` if it is unavailable. The minimum is raised in a follow-up release once the carrying CLI is published.
