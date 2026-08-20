# Runner setup

Step 6 of the canonical flow. The goal is one thing: give the setup plan a `runner_setup_id` it can prefer, so the owner's AI Chief of Staff can run on their own machine and their own Claude or Codex subscription instead of managed cloud inference.

This step is a preference, not a gate. If it does not reach ready, the run continues and the setup falls back to the Cloud lane visibly.

## What it is

Runner setup is ONE resumable server-side lifecycle per owner. It advances through stages — pairing, provider consent, service install, runtime validation, heartbeat wait, ready — and records a checkpoint at each. A blocked setup carries a typed blocker code. Resuming revalidates every recorded checkpoint against live local facts and rewinds to the earliest unproven stage under the same setup id; it never creates a second record.

The commands are `runner_setup.start`, `runner_setup.status`, `runner_setup.resume`, and `runner_setup.cancel`. Confirm their exact shapes with `rost command schema <id>` — never guess.

## Driving it

The ergonomic orchestrator runs the lifecycle over the local host primitives for you, and it accepts the implementation credential:

```bash
rost runner setup start --runtime claude --agent --json
rost runner setup status --setup-id <id> --json
rost runner setup resume --setup-id <id> --json
```

- `--runtime claude|codex` binds the runtime selection to the session before any pairing code is consumed. A `--runtime` passed on resume must match the bound selection; it is never silently dropped or replaced.
- `--agent` is mandatory for this skill. It declares that no human is at this terminal: the orchestrator then surfaces the server's human `action_required` and polls instead of prompting, and it refuses to claim a pairing code itself.
- `--json` emits one envelope on stdout; every line of human copy stays on stderr. The envelope never carries secrets or user codes. Parse the envelope; never scrape the prose.
- `--timeout-ms <ms>` bounds the poll. A timeout is a report, not a failure — say what stage it stopped at.

Read `rost reference get runner-guide` for the full surface, including the service-install behaviour on the owner's platform.

**If the installed CLI is too old for this route**, `rost runner setup` answers `CLI session required for runner setup` even though an implementation credential is present. That is a version prerequisite, not an authority problem: upgrade `@rosthq/cli` and retry. Discover the capability by running the command, never by comparing version strings — the authoritative minimum is `protocol.minCli` in this package's `skill-manifest.json` and the installer already enforces it. If the route is still refused after an upgrade, report the prerequisite exactly and continue without a runner setup: the plan can carry `runner_setup_id: null`, and the setup falls back to the Cloud lane with the typed reason `runner_setup_absent`.

## What this credential may and may not do

- `start`, `status`, and `resume` run on the implementation credential. A present implementation credential takes precedence over any co-resident owner login, and an expired one is refused outright rather than swapped for the owner's session — so a runner can never be paired under the wrong principal.
- `cancel` is an owner action. It is refused to this credential, with a typed envelope. If a setup must be cancelled, hand that to the owner and say why.
- The tenant every claimed runner is checked against comes from the credential itself, not from an identity read.
- One further command reaches the server on this route, and it is named here so the list above is complete rather than merely reassuring: the orchestrator calls **`runner.status`** while waiting for the service to come up and again on a `status` read, to report the runner's health. It is a read-class command, it returns no secret, and its result is explicitly labelled unattributed (see below) — but it is a fourth id travelling under this credential, and a reader entitled to know what the credential does should not have to discover it from a network trace.

## Human actions — surface them, never attempt them

Two stages are human by construction. When the envelope reports one, present it exactly and wait.

1. **Device pairing.** The owner opens Settings → Connections → Connected machines and reads back a pairing code. The agent must never claim a code: `--agent` refuses to, and doing it any other way would spend a single-use code on the wrong principal.
2. **Provider consent.** The owner authenticates their own Claude or Codex installation into the runner's dedicated credential cell.

## Credentials: prove, never read

The point of this stage is to establish that the owner's local Claude or Codex authentication exists and works — **without the agent ever reading, copying, exporting, printing, or relaying it.** The runner holds its own per-runner credential cell; the setup lifecycle reports readiness derived from it. There is no supported path by which this skill obtains subscription credential material, and asking the owner to paste one into the conversation is a hard rule violation, not a shortcut.

## Readiness, reported honestly

The envelope distinguishes facts that are easy to blur:

- `service_ready` asserts that the background service this setup installed is loaded, running, and pinned to this setup's own state file. That is a local fact about the machine.
- The heartbeat note is explicitly **unattributed**: ROST cannot tell this service's heartbeat from a foreground `rost runner serve` on the same runner. Report it as information, never as proof that ROST observed the service.
- A `ready` setup with no compatible paired runner online is still not a servable lane. Readiness of the SETUP and servability of the LANE are different facts and are reported separately.

Never upgrade any of these into "the runner is executing". Only a real turn on the runner lane proves that.

## What the plan submits

The plan's AICOS block carries exactly four things: the preferred lane, the runner brain, the `runner_setup_id`, and whether Cloud fallback is authorized. Nothing else about the runner belongs in a plan.

The server proves the rest and does not take the agent's word for any of it:

- the setup belongs to this tenant;
- the setup belongs to this implementation run;
- the setup is still live — an expired or cancelled setup is refused, not quietly ignored;
- the setup is the one the authenticated run actually owns; a reference that does not match resolves to no Runner setup at all.

A reference the server cannot prove is refused, and the whole application is refused with it. Nothing durable is written. Correct the reference and restage — never retry with a different id hoping one is accepted.

## When it does not reach ready

This is an ordinary, expected outcome, and honesty about it is the whole point of the stage.

Report the stage it stopped at, its typed blocker code, and the human action it is waiting on. Then continue the run. The plan may still name `preferred_lane: "runner"` with `cloud_fallback_authorized: true`: the setup approval will configure the Cloud lane and say which of three typed reasons applied — `runner_setup_absent`, `runner_setup_incomplete`, or `runner_not_ready` — while preserving the Runner preference and the setup id on the receipt so the owner can finish the runner later and move the lane over.

Two things must never happen here:

- Describing a Cloud-lane chief of staff as running on the owner's runner. The requested lane and the effective lane are reported separately, always.
- Promising that a successful runner setup means the chief of staff is live on the runner lane at setup. It does not: the lane the setup configures is decided from readiness at approval time, and the honest statement is "runner preferred; the receipt will name the lane it actually reached."
