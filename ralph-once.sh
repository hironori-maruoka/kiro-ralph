#!/bin/bash

SPEC_DIR=".kiro/specs/spreadsheet-sample"

kiro-cli chat --no-interactive --trust-all-tools \
"【要件定義】
$(cat ${SPEC_DIR}/requirements.md)

【設計】
$(cat ${SPEC_DIR}/design.md)

【タスク一覧】
$(cat ${SPEC_DIR}/tasks.md)

【進捗】
$(cat progress.txt 2>/dev/null || echo 'まだ進捗なし')

1. 要件と設計を理解する
2. タスク一覧と進捗を確認し、次の未完了タスクを見つける
3. そのタスクを実装する
4. 変更をコミットする
5. progress.txtに完了した内容を追記する
1回の実行で1タスクのみ実装すること"