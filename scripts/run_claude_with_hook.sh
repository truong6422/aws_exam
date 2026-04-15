#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/run_claude_with_hook.sh "human-readable task description" "claude --permission-mode bypassPermissions --print '...prompt...'"
#
# Example:
#   scripts/run_claude_with_hook.sh \
#     "Plan Phase 2 backend" \
#     "claude --permission-mode bypassPermissions --print '...prompt...'"
#
# This script will:
#   1) Run the Claude CLI command passed in as second argument.
#   2) When it finishes, emit a short marker to stdout so OpenClaw can see
#      that the task is done.
#   3) Fire an OpenClaw system event so the main chat session gets a
#      notification.

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <human-description> <claude command...>" >&2
  exit 1
fi

HUMAN_DESC="$1"
shift

CLAUDE_CMD="$*"

START_TS=$(date -Iseconds || date)

# Run Claude command
bash -lc "$CLAUDE_CMD"
CODE=$?

END_TS=$(date -Iseconds || date)

MARKER="CLAUDE_TASK_DONE: ${HUMAN_DESC} (exit=${CODE})"

# 1) Print marker to stdout (visible in exec log)
echo "$MARKER"

# 2) Fire OpenClaw system event (best-effort; ignore failure)
if command -v openclaw >/dev/null 2>&1; then
  openclaw system event --text "$MARKER" --mode now || true
fi

exit "$CODE"
