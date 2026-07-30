#!/bin/sh
set -eu

usage() {
  echo "Usage: $0 <claude-code|codex|cursor>"
  exit 1
}

client="${1:-}"
if [ -z "$client" ] || [ "$client" = "-h" ] || [ "$client" = "--help" ]; then
  usage
fi

case "$client" in
  claude-code|codex|cursor) ;;
  *) usage ;;
esac

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
manifest="$script_dir/../skill-manifest.json"

version_ge() {
  awk -v a="$1" -v b="$2" 'BEGIN {
    split(a, ax, ".")
    split(b, bx, ".")
    for (i = 1; i <= 3; i++) {
      if (ax[i] + 0 > bx[i] + 0) exit 0
      if (ax[i] + 0 < bx[i] + 0) exit 1
    }
    exit 0
  }'
}

# 1. Node >= 22
if ! command -v node >/dev/null 2>&1; then
  echo "FAIL: node is not installed"
  exit 1
fi

node_version=$(node --version | sed 's/^v//')
node_major=$(echo "$node_version" | cut -d. -f1)
if [ "$node_major" -lt 22 ]; then
  echo "FAIL: node version is $node_version; Node >= 22 is required"
  exit 1
fi
echo "PASS: node version $node_version"

# 2. rost binary resolvable
rost_cmd=""
if command -v rost >/dev/null 2>&1; then
  rost_cmd="rost"
  echo "PASS: rost binary found"
else
  if command -v npx >/dev/null 2>&1; then
    rost_cmd="npx --yes @rosthq/cli@latest"
    echo "PASS: rost binary not found; will use npx @rosthq/cli@latest"
  else
    echo "FAIL: rost is not installed and npx is not available"
    exit 1
  fi
fi

# 3. CLI version >= protocol.minCli from skill-manifest.json (the single
#    authoritative minimum-CLI location for this package)
if [ ! -f "$manifest" ]; then
  echo "FAIL: skill-manifest.json not found at $manifest; run from a full checkout"
  exit 1
fi
min_version=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).protocol.minCli)' "$manifest")
if [ -z "$min_version" ]; then
  echo "FAIL: could not read protocol.minCli from $manifest"
  exit 1
fi

cli_version=$($rost_cmd --version | head -n1 | awk '{print $NF}')
if [ -z "$cli_version" ]; then
  echo "FAIL: could not determine CLI version"
  exit 1
fi

if ! version_ge "$cli_version" "$min_version"; then
  echo "FAIL: CLI version is $cli_version; minimum required is $min_version"
  echo "      Upgrade with: npx @rosthq/cli@latest --version"
  exit 1
fi
echo "PASS: CLI version $cli_version >= $min_version"

# 4. Run installer
echo "Running: $rost_cmd skills install-implementation --client $client"
$rost_cmd skills install-implementation --client "$client"
echo "PASS: installer completed"

# 5. Confirm installed SKILL.md
case "$client" in
  claude-code)
    skill_dir="${CLAUDE_HOME:-$HOME/.claude}/skills/rost-implementation"
    ;;
  codex)
    skill_dir="${CODEX_HOME:-$HOME/.codex}/skills/rost-implementation"
    ;;
  cursor)
    skill_dir="$HOME/.cursor/skills/rost-implementation"
    ;;
esac

skill_file="$skill_dir/SKILL.md"
if [ ! -f "$skill_file" ]; then
  echo "FAIL: installed skill not found at $skill_file"
  exit 1
fi
echo "PASS: installed skill found at $skill_file"

release_marker="$skill_dir/.rost-skill-release.json"
if [ -f "$release_marker" ]; then
  echo "Provenance marker:"
  cat "$release_marker"
else
  echo "WARN: provenance marker .rost-skill-release.json not found"
fi
