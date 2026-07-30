#!/usr/bin/env node
// Deterministic fixture validation for the canonical composite onboarding flow.
// Usage: node scripts/validate-fixtures.mjs [repo-root]
// Exit 0 only when every positive fixture validates, every negative fixture is
// rejected, and the skill text still carries the canonical flow and hard rules.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "..");

// The canonical fifteen steps, in order. Each marker must appear verbatim in
// SKILL.md so the fixture contract stays bound to the shipped text.
const CANONICAL_STEPS = [
  { id: "inspect_local_business_files", marker: "Inspect local business files only" },
  { id: "install_verify_cli", marker: "Install/verify the current CLI" },
  { id: "obtain_implementation_access", marker: "Obtain implementation access" },
  { id: "discover_schemas_references_capabilities", marker: "Discover schemas/references/capabilities" },
  { id: "read_onboarding_resume_state", marker: "Read onboarding resume state" },
  { id: "source_ingest", marker: "retain only the returned opaque descriptors/digests" },
  { id: "construct_validate_setup_plan", marker: "missing, forged, cross-run, or outside-workspace source reference fails" },
  { id: "stage_setup_one_url", marker: "Stage setup and give the human one URL" },
  { id: "verify_setup_receipt", marker: "Wait and verify the setup receipt" },
  { id: "rehearse_read_terminal_evidence", marker: "complete immutable terminal evidence" },
  { id: "activate_once_one_url", marker: "exact unique-agent-ID evidence arrays" },
  { id: "verify_activation", marker: "Wait and verify activation" },
  { id: "bounded_manual_acceptance", marker: "bounded manual acceptance where authorized" },
  { id: "report_evidence_costs_warnings", marker: "evidence, costs, assumptions, warnings, and unresolved source connections" },
  { id: "complete_or_abandon_access", marker: "Complete/abandon implementation access" },
];

// Hard-rule sentences that must survive in SKILL.md.
const PROHIBITION_MARKERS = [
  "Do not invite teammates",
  "Do not send external communications",
  "Do not read outside the supplied workspace",
  "Do not claim Full Operator unless discovered active",
  "Do not claim runner execution unless readiness proves a runner",
  "never submit mutable slugs alone",
  "Do not claim useful source-backed output when source systems are absent",
];

// Steps that can never appear in a valid implementation flow.
const FORBIDDEN_STEP_PATTERNS = [
  /invite/, /external/, /email/, /slack/, /credential/, /secret/, /oauth/,
  /per_seat/, /per_charter/, /per_agent/, /_loop/, /go_live/, /mutable_slug/,
];

function validateFlow(fixture) {
  const errors = [];
  if (typeof fixture.name !== "string" || fixture.name.length === 0) errors.push("shape:name");
  if (fixture.expect !== "valid" && fixture.expect !== "invalid") errors.push("shape:expect");
  if (!Array.isArray(fixture.steps) || fixture.steps.some((s) => typeof s !== "string")) {
    errors.push("shape:steps");
    return errors;
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

  if (fixture.steps.length !== canonicalIds.length) {
    errors.push(`step_count:${fixture.steps.length}!=${canonicalIds.length}`);
  } else {
    for (let i = 0; i < canonicalIds.length; i++) {
      if (fixture.steps[i] !== canonicalIds[i]) {
        errors.push(`step_order:position ${i + 1} expected ${canonicalIds[i]} got ${fixture.steps[i]}`);
        break;
      }
    }
  }

  const approvals = fixture.approvals;
  if (approvals === null || typeof approvals !== "object" || Array.isArray(approvals)) {
    errors.push("approval_shape:missing");
  } else {
    const keys = Object.keys(approvals).sort();
    if (keys.join(",") !== "activation,setup") {
      errors.push(`approval_shape:${keys.join(",") || "empty"}`);
    } else {
      if (approvals.setup !== 1) errors.push(`approval_count:setup=${approvals.setup}`);
      if (approvals.activation !== 1) errors.push(`approval_count:activation=${approvals.activation}`);
    }
  }

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
  if (isValid === expected) {
    const detail = isValid ? "validated" : `rejected (${errors.join("; ")})`;
    console.log(`PASS: ${rel} — ${detail} as expected`);
  } else {
    failures++;
    const detail = isValid ? "validated but expected rejection" : `rejected but expected valid (${errors.join("; ")})`;
    console.error(`FAIL: ${rel} — ${detail}`);
  }
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

const executionLoop = readFileSync(join(root, "references/execution-loop.md"), "utf8");
for (const command of ["onboarding.source_ingest", "onboarding.setup", "onboarding.rehearse", "onboarding.activate"]) {
  markerChecks++;
  if (!executionLoop.includes(command)) {
    failures++;
    console.error(`FAIL: references/execution-loop.md missing composite command ${command}`);
  }
}

const finalReport = readFileSync(join(root, "references/final-report.md"), "utf8");
for (const marker of ["mandatory for every implementation run", "costs", "unresolved source connections"]) {
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
