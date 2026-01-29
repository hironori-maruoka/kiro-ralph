#!/bin/bash
set -euo pipefail
echo "START afk-ralph.sh"

SPEC_DIR=".kiro/specs/excel-lite"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

build_prompt() {
  cat <<'PROMPT'
【要件】
__REQ__

【設計】
__DES__

【タスク一覧】
__TASKS__

【進捗】
__PROGRESS__

1. 要件と設計を理解する
2. タスク一覧と進捗を確認し、次の未完了タスクを見つける
3. そのタスクを実行する
4. 変更をコミットする
5. 完了後、タスク一覧のチェック[ ]をつける
6. progress.txtに完了した内容を追記する
1回の実行で1タスクのみ実装すること
npm run test は禁止。必ず npm run test:unit または npm run test -- --run を使う
npm run dev / vite / vitest 単体実行など 常駐プロセスは禁止
必ず 一回で終了するコマンドのみ実行すること
npx を使う場合は必ず --yes を付けること
対話確認が出るコマンドは禁止
全タスク完了時は <promise>COMPLETE</promise> を出力すること
PROMPT
}

for ((i=1; i<=${1}; i++)); do
  echo "loop iteration $i"

  req="$(cat "${SPEC_DIR}/requirements.md")"
  des="$(cat "${SPEC_DIR}/design.md")"
  tasks="$(cat "${SPEC_DIR}/tasks.md")"
  progress="$(cat progress.txt 2>/dev/null || echo 'まだ進捗なし')"

  prompt="$(build_prompt)"
  prompt="${prompt/__REQ__/$req}"
  prompt="${prompt/__DES__/$des}"
  prompt="${prompt/__TASKS__/$tasks}"
  prompt="${prompt/__PROGRESS__/$progress}"

  logfile="/tmp/kiro-iteration-${i}.log"

  kiro-cli chat --no-interactive --trust-all-tools "$prompt" 2>&1 | tee "$logfile"

  if grep -q "<promise>COMPLETE</promise>" "$logfile"; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done
