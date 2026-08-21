#!/usr/bin/env node
// Deterministic fixture validation for the canonical composite onboarding flow.
// Usage: node scripts/validate-fixtures.mjs [repo-root]
// Exit 0 only when every positive fixture validates, every negative fixture is
// rejected FOR ITS OWN NAMED REASON, and the skill text still carries the
// canonical flow and hard rules.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "..");

// The canonical sixteen steps, in order. Each marker must appear verbatim in
// SKILL.md so the fixture contract stays bound to the shipped text.
const CANONICAL_STEPS = [
  { id: "inspect_local_business_files", marker: "Inspect local business files only" },
  { id: "install_verify_cli", marker: "Install/verify the current CLI" },
  { id: "obtain_implementation_access", marker: "Obtain implementation access" },
  { id: "discover_schemas_references_capabilities", marker: "Discover schemas/references/capabilities" },
  { id: "read_onboarding_resume_state", marker: "Read onboarding resume state" },
  { id: "prepare_runner_setup", marker: "Prepare the runner setup" },
  { id: "source_ingest", marker: "retain only the returned opaque descriptors/digests" },
  { id: "construct_validate_setup_plan", marker: "missing, forged, cross-run, or outside-workspace source reference fails" },
  { id: "stage_setup_one_url", marker: "Stage setup and give the human one URL" },
  { id: "verify_setup_receipt", marker: "Wait and verify the setup receipt" },
  { id: "rehearse_read_terminal_evidence", marker: "complete immutable terminal evidence" },
  { id: "activate_once_one_url", marker: "exact unique-agent-ID evidence arrays" },
  { id: "verify_activation", marker: "Wait and verify the launch" },
  { id: "bounded_manual_acceptance", marker: "bounded manual acceptance where authorized" },
  { id: "report_evidence_costs_warnings", marker: "evidence, costs, assumptions, warnings, unresolved source connections, and later-launch actions" },
  { id: "complete_or_abandon_access", marker: "Complete/abandon implementation access" },
];

// The optional pair. Under a `schema_version: 2` setup, the setup approval alone
// produces a complete operating company; launching the agents a plan leaves in
// draft is a second, optional composite decision. The pair is all-or-nothing:
// launching without verifying is the remembered-status claim the flow forbids,
// so a fixture may omit BOTH and may never omit exactly one.
const OPTIONAL_STEP_IDS = ["activate_once_one_url", "verify_activation"];

// Hard-rule sentences that must survive in SKILL.md.
const PROHIBITION_MARKERS = [
  "Do not invite teammates",
  "Do not send external communications",
  "Do not read outside the supplied workspace",
  "Do not claim Full Operator unless discovered active",
  "Do not claim runner execution unless readiness proves a runner",
  "Do not hide a lane fallback",
  "Do not submit a Signal as live",
  "Do not enable a governance posture on the owner's behalf",
  "never submit mutable slugs alone",
  "Do not claim useful source-backed output when source systems are absent",
];

// Copy the merged platform made FALSE. A fixture run is the only mechanical
// guard this repository has against it creeping back, so the retired claims are
// pinned as forbidden text rather than left to review. Each entry is a regex,
// with the reason it is retired, so a reviewer reading a failure learns why
// rather than only that.
//
// WHAT THIS SCAN COVERS, stated because the gap is deliberate and would
// otherwise read as an oversight: the seven AGENT-LOADED files — `SKILL.md` and
// the six `references/`. Those are what an implementing agent reads and acts on,
// so a retired claim surviving there is a claim that gets FOLLOWED. It does NOT
// cover the other shipped files. `README.md` and `CHANGELOG.md` are excluded on
// purpose and permanently: both have to QUOTE the retired wording in order to
// document that it was retired, and a scan that forbade the quotation would make
// the retirement undocumentable. `scripts/` is excluded for the same reason —
// this file holds the patterns themselves. `fixtures/` and `LICENSE` carry no
// prose an agent reads as doctrine. If a future reference file is added, add it
// to REFERENCE_FILES below or it is silently outside this guard.
const RETIRED_CLAIMS = [
  {
    pattern: /exactly two (?:composite )?(?:human )?approvals/i,
    why: "the setup approval alone completes onboarding; the launch is optional",
  },
  {
    pattern: /stages both composite (?:human )?decisions/i,
    why: "the launch decision is optional, so 'both' is not what a run promises",
  },
  {
    pattern: /two composite decisions/i,
    why: "same: one required decision, one optional",
  },
  {
    pattern: /there is no cloud fallback/i,
    why: "the canonical AI Chief of Staff falls back to Cloud visibly, with a typed reason",
  },
  {
    pattern: /marks onboarding complete/i,
    why: "the setup records onboarding as finished; the launch does not",
  },
];

// Steps that can never appear in a valid implementation flow.
const FORBIDDEN_STEP_PATTERNS = [
  /invite/, /external/, /email/, /slack/, /credential/, /secret/, /oauth/,
  /per_seat/, /per_charter/, /per_agent/, /_loop/, /go_live/, /mutable_slug/,
  // DER-3460: the governance posture is the owner's own act. An agent step that
  // enables or disables it is rejected by name, not left to prose.
  /trusted_beta_enable/, /trusted_beta_disable/, /enable_trusted/,
];

// The only truthful Signal postures a setup plan may carry. `live_verified` is
// refused server-side before the approval card exists, because the connection
// that would prove a Signal live has to feed a Signal that already exists.
const ALLOWED_SIGNAL_POSTURES = ["manual", "imported_history", "not_connected"];

// The three typed reasons a receipt may give for the AI Chief of Staff landing
// on the Cloud lane under a Runner preference.
const TYPED_FALLBACK_REASONS = ["runner_setup_absent", "runner_setup_incomplete", "runner_not_ready"];

const LANES = ["runner", "cloud"];

function validateSteps(fixture, errors) {
  if (!Array.isArray(fixture.steps) || fixture.steps.some((s) => typeof s !== "string")) {
    errors.push("shape:steps");
    return null;
  }

  const canonicalIds = CANONICAL_STEPS.map((s) => s.id);
  const canonicalSet = new Set(canonicalIds);

  for (const step of fixture.steps) {
    for (const pattern of FORBIDDEN_STEP_PATTERNS) {
      if (pattern.test(step)) {
        errors.push(`forbidden_step:${step}`);
        break;
      }
    }
    if (!canonicalSet.has(step)) errors.push(`unknown_step:${step}`);
  }

  // Which optional steps this fixture claims. Read before the ordering check so
  // an all-or-nothing violation is reported as itself rather than as a count.
  const present = new Set(fixture.steps);
  const optionalPresent = OPTIONAL_STEP_IDS.filter((id) => present.has(id));
  const launched = optionalPresent.length === OPTIONAL_STEP_IDS.length;
  if (optionalPresent.length !== 0 && !launched) {
    errors.push(`partial_launch:${optionalPresent.join(",")}`);
  }

  // The required steps are every canonical step this fixture is not entitled to
  // omit. Derived from the canonical list rather than hand-listed, so adding a
  // step to the flow cannot leave a fixture silently under-covered.
  const expected = canonicalIds.filter((id) => launched || !OPTIONAL_STEP_IDS.includes(id));
  if (fixture.steps.length !== expected.length) {
    errors.push(`step_count:${fixture.steps.length}!=${expected.length}`);
  } else {
    for (let i = 0; i < expected.length; i++) {
      if (fixture.steps[i] !== expected[i]) {
        errors.push(`step_order:position ${i + 1} expected ${expected[i]} got ${fixture.steps[i]}`);
        break;
      }
    }
  }
  return { launched };
}

function validateApprovals(fixture, launched, errors) {
  const approvals = fixture.approvals;
  if (approvals === null || typeof approvals !== "object" || Array.isArray(approvals)) {
    errors.push("approval_shape:missing");
    return;
  }
  const keys = Object.keys(approvals).sort();
  if (keys.join(",") !== "activation,setup") {
    errors.push(`approval_shape:${keys.join(",") || "empty"}`);
    return;
  }
  // Always exactly one setup decision. Zero is the "agents decided it" failure;
  // more than one is the multi-gate recipe wearing a composite costume.
  if (approvals.setup !== 1) errors.push(`approval_count:setup=${approvals.setup}`);

  // The launch count is not free: it must AGREE with the steps. A fixture that
  // claims a launch approval without the launch steps (or the reverse) is
  // describing a run that did not happen, which is the whole class of dishonesty
  // this file exists to catch.
  const expectedActivation = launched === true ? 1 : 0;
  if (approvals.activation !== expectedActivation) {
    errors.push(`approval_count:activation=${approvals.activation} but steps say ${expectedActivation}`);
  }
}

function validateSignals(fixture, errors) {
  if (fixture.signals === undefined) return;
  if (!Array.isArray(fixture.signals)) {
    errors.push("signal_shape");
    return;
  }
  for (const signal of fixture.signals) {
    const name = typeof signal?.name === "string" && signal.name.length > 0 ? signal.name : "(unnamed)";
    const posture = signal?.posture;
    if (posture === "live_verified") {
      errors.push(`live_posture_at_setup:${name}`);
      continue;
    }
    if (typeof posture !== "string" || !ALLOWED_SIGNAL_POSTURES.includes(posture)) {
      errors.push(`unknown_signal_posture:${name}=${String(posture)}`);
    }
  }
}

function validateLane(fixture, errors) {
  // REQUIRED, not optional. "Do not hide a lane fallback" is the strongest rule
  // in this corpus, and an optional field makes it evadable by the cheapest
  // possible move: omit the block and the check never runs. A fixture that
  // declines to say which lane the chief of staff reached is exactly the silence
  // the rule exists against, so the absent case is a failure, not a skip.
  if (fixture.aicos_lane === undefined) {
    errors.push("missing_lane");
    return;
  }
  const lane = fixture.aicos_lane;
  if (lane === null || typeof lane !== "object" || Array.isArray(lane)) {
    errors.push("lane_shape");
    return;
  }
  if (!LANES.includes(lane.requested)) errors.push(`lane_requested:${String(lane.requested)}`);
  if (!LANES.includes(lane.effective)) errors.push(`lane_effective:${String(lane.effective)}`);

  const fellBack = LANES.includes(lane.requested) && LANES.includes(lane.effective) && lane.requested !== lane.effective;
  if (!fellBack) {
    // No fallback happened, so there is nothing to report and nothing to hide.
    if (lane.fallback_reason != null) errors.push(`unexpected_fallback_reason:${String(lane.fallback_reason)}`);
    return;
  }
  // A fallback DID happen. Two independent obligations, and dropping either one
  // is what "silent fallback" means: the reason must be one of the three typed
  // ones the receipt carries, and the report must actually say so.
  if (!TYPED_FALLBACK_REASONS.includes(lane.fallback_reason)) {
    errors.push(`untyped_fallback_reason:${String(lane.fallback_reason)}`);
  }
  if (lane.reported_to_owner !== true) {
    errors.push(`silent_fallback:${lane.requested}->${lane.effective}`);
  }
}

function validateFlow(fixture) {
  const errors = [];
  if (typeof fixture.name !== "string" || fixture.name.length === 0) errors.push("shape:name");
  if (fixture.expect !== "valid" && fixture.expect !== "invalid") errors.push("shape:expect");

  const steps = validateSteps(fixture, errors);
  if (steps === null) return errors;

  validateApprovals(fixture, steps.launched, errors);
  validateSignals(fixture, errors);
  validateLane(fixture, errors);

  if (fixture.skill_references !== undefined) {
    if (!Array.isArray(fixture.skill_references)) {
      errors.push("skill_reference_shape");
    } else {
      for (const ref of fixture.skill_references) {
        const slug = typeof ref?.slug === "string" && ref.slug.length > 0 ? ref.slug : "(unnamed)";
        const pinnedVersion = typeof ref?.version_id === "string" && ref.version_id.length > 0;
        const pinnedHash = typeof ref?.content_hash === "string" && /^[0-9a-f]{64}$/.test(ref.content_hash);
        if (!pinnedVersion || !pinnedHash) errors.push(`unpinned_skill_reference:${slug}`);
      }
    }
  }

  return errors;
}

function listFixtures(dir) {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => join(dir, f));
}

let failures = 0;
let positives = 0;
let negatives = 0;

for (const rel of [...listFixtures("fixtures/positive"), ...listFixtures("fixtures/negative")]) {
  const fixture = JSON.parse(readFileSync(join(root, rel), "utf8"));
  const errors = validateFlow(fixture);
  const isValid = errors.length === 0;
  const expected = fixture.expect === "valid";
  if (expected) positives++;
  else negatives++;
  if (isValid !== expected) {
    failures++;
    const detail = isValid ? "validated but expected rejection" : `rejected but expected valid (${errors.join("; ")})`;
    console.error(`FAIL: ${rel} — ${detail}`);
    continue;
  }
  if (!expected) {
    // A negative that is rejected for the WRONG reason is not evidence: it looks
    // green while the rule it names goes unpinned. Every negative therefore
    // declares the error prefix it exists to produce, and must produce it.
    const because = fixture.rejected_because;
    if (typeof because !== "string" || because.length === 0) {
      failures++;
      console.error(`FAIL: ${rel} — a negative fixture must declare "rejected_because"`);
      continue;
    }
    if (!errors.some((error) => error.startsWith(because))) {
      failures++;
      console.error(`FAIL: ${rel} — rejected, but not for "${because}" (got: ${errors.join("; ")})`);
      continue;
    }
    console.log(`PASS: ${rel} — rejected for ${because} as expected (${errors.join("; ")})`);
    continue;
  }
  console.log(`PASS: ${rel} — validated as expected`);
}

if (positives === 0 || negatives === 0) {
  failures++;
  console.error(`FAIL: fixture set must contain both positive and negative fixtures (positive=${positives}, negative=${negatives})`);
}

// Bind the fixture contract to the shipped skill text.
const skillMd = readFileSync(join(root, "SKILL.md"), "utf8");
let markerChecks = 0;

for (const step of CANONICAL_STEPS) {
  markerChecks++;
  if (!skillMd.includes(step.marker)) {
    failures++;
    console.error(`FAIL: SKILL.md missing canonical step marker for ${step.id}: "${step.marker}"`);
  }
}
for (const marker of PROHIBITION_MARKERS) {
  markerChecks++;
  if (!skillMd.includes(marker)) {
    failures++;
    console.error(`FAIL: SKILL.md missing hard-rule marker: "${marker}"`);
  }
}
markerChecks++;
if (!(skillMd.includes("multi-gate") && skillMd.includes("not a supported implementation path"))) {
  failures++;
  console.error("FAIL: SKILL.md missing the multi-gate recipe rejection");
}

const REFERENCE_FILES = [
  "references/execution-loop.md",
  "references/final-report.md",
  "references/mode-behavior.md",
  "references/oauth-handoff.md",
  "references/runner-setup.md",
  "references/conversation-grant-handoff.md",
];
const corpus = [
  ["SKILL.md", skillMd],
  ...REFERENCE_FILES.map((rel) => [rel, readFileSync(join(root, rel), "utf8")]),
];

for (const claim of RETIRED_CLAIMS) {
  for (const [rel, text] of corpus) {
    markerChecks++;
    if (claim.pattern.test(text)) {
      failures++;
      console.error(`FAIL: ${rel} still carries a retired claim (${claim.pattern}) — ${claim.why}`);
    }
  }
}

const executionLoop = corpus.find(([rel]) => rel === "references/execution-loop.md")[1];
for (const command of ["onboarding.source_ingest", "onboarding.setup", "onboarding.rehearse", "onboarding.activate"]) {
  markerChecks++;
  if (!executionLoop.includes(command)) {
    failures++;
    console.error(`FAIL: references/execution-loop.md missing composite command ${command}`);
  }
}

const runnerSetup = corpus.find(([rel]) => rel === "references/runner-setup.md")[1];
for (const marker of [
  "runner_setup.start",
  "runner_setup.status",
  "runner_setup.resume",
  "runner_setup_id",
  "--agent",
  ...TYPED_FALLBACK_REASONS,
]) {
  markerChecks++;
  if (!runnerSetup.includes(marker)) {
    failures++;
    console.error(`FAIL: references/runner-setup.md missing marker: "${marker}"`);
  }
}

const finalReport = corpus.find(([rel]) => rel === "references/final-report.md")[1];
for (const marker of [
  "mandatory for every implementation run",
  "costs",
  "unresolved source connections",
  "Later launch actions",
  "aicos.trusted_beta.enable",
]) {
  markerChecks++;
  if (!finalReport.includes(marker)) {
    failures++;
    console.error(`FAIL: references/final-report.md missing marker: "${marker}"`);
  }
}

console.log(`Fixtures: ${positives} positive, ${negatives} negative. Content-binding checks: ${markerChecks}.`);
if (failures > 0) {
  console.error(`FAIL: ${failures} validation failure(s)`);
  process.exit(1);
}
console.log("PASS: all fixtures and content bindings validated");
