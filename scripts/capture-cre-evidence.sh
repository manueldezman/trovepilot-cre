#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow_dir="$repo_root/workflows/trovepilot-rebalance"
env_file="${1:-$repo_root/.env}"
mode="${2:-dry-run}"
cre_bin="${CRE_BIN:-/home/manueldezman/.cre/bin/cre}"
export CRE_ETHEREUM_RPC_URL="${CRE_ETHEREUM_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
run_dir="$repo_root/evidence/runs/$timestamp-$mode"

if [[ ! -f "$env_file" ]]; then
  echo "Missing environment file: $env_file" >&2
  exit 1
fi
env_file="$(cd "$(dirname "$env_file")" && pwd)/$(basename "$env_file")"
if [[ "$mode" != "dry-run" && "$mode" != "broadcast" ]]; then
  echo "Mode must be dry-run or broadcast" >&2
  exit 1
fi
if [[ "$mode" == "broadcast" && "${CONFIRM_BROADCAST:-}" != "YES" ]]; then
  echo "Set CONFIRM_BROADCAST=YES to acknowledge a real Sepolia transaction." >&2
  exit 1
fi

mkdir -p "$run_dir"
git -C "$repo_root" rev-parse HEAD > "$run_dir/git-commit.txt"
git -C "$repo_root" status --short -- . ':(exclude)evidence/runs' > "$run_dir/git-status.txt"
"$cre_bin" version > "$run_dir/cre-version.txt"

owner="$(sed -n 's/^EXPECTED_WORKFLOW_OWNER=//p' "$env_file" | tail -n 1 | tr -d '\r\"')"
if [[ -z "$owner" ]]; then
  echo "EXPECTED_WORKFLOW_OWNER is missing from $env_file" >&2
  exit 1
fi

cre_private_key="$(sed -n 's/^CRE_ETH_PRIVATE_KEY=//p' "$env_file" | tail -n 1 | tr -d '\r\"')"
if [[ -n "$cre_private_key" ]]; then
  case "$cre_private_key" in
    0x*) ;;
    *) cre_private_key="0x$cre_private_key" ;;
  esac
  export CRE_ETH_PRIVATE_KEY="$cre_private_key"
fi

(
  cd "$workflow_dir"
  env PATH="/home/manueldezman/.bun/bin:/home/manueldezman/.cre/bin:$PATH" \
    "$cre_bin" workflow hash . --target staging-settings \
    --env "$env_file" --public_key "$owner"
) | tee "$run_dir/workflow-hashes.txt"

broadcast_flag=()
if [[ "$mode" == "broadcast" ]]; then
  broadcast_flag=(--broadcast)
fi

command=(env "PATH=/home/manueldezman/.bun/bin:/home/manueldezman/.cre/bin:$PATH"
  "$cre_bin" workflow simulate . --target staging-settings
  --trigger-index 0 --env "$env_file" --non-interactive "${broadcast_flag[@]}")

(cd "$workflow_dir" && script -q -e -c "$(printf '%q ' "${command[@]}")" "$run_dir/cre-transcript.txt")
sha256sum "$run_dir"/*.txt > "$run_dir/checksums.sha256"

echo "Evidence captured in: $run_dir"
