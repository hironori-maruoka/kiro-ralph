# 設計書: Spreadsheet Sample

## 概要

Spreadsheet Sampleは、Webブラウザ上で動作する軽量なスプレッドシートアプリケーションです。本システムは、計算ロジック（Spreadsheet Engine）とUIコンポーネントを明確に分離したアーキテクチャを採用します。エンジン層はUIに依存せず、純粋なTypeScriptで実装され、徹底的なテストカバレッジを実現します。

主要機能：
- 10列×20行のグリッド表示
- セル選択とナビゲーション（マウス・キーボード）
- データ入力と編集
- 数式パーサー（四則演算、セル参照、範囲関数）
- 依存関係管理と自動再計算
- 循環参照検知
- エラー処理

## アーキテクチャ

システムは3層のアーキテクチャで構成されます：

```
┌─────────────────────────────────────┐
│         UI Layer (React)            │
│  - Grid Component                   │
│  - Cell Component                   │
│  - Input Handler                    │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      Application Layer              │
│  - State Management                 │
│  - Event Coordination               │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│    Engine Layer (Pure TypeScript)   │
│  - Formula Parser                   │
│  - Cell Evaluator                   │
│  - Dependency Graph                 │
│  - Cycle Detector                   │
└─────────────────────────────────────┘
```

### レイヤー責務

**UI Layer:**
- グリッドとセルの視覚的レンダリング
- ユーザー入力の受付（クリック、キーボード）
- 編集モードと表示モードの切り替え
- エラー表示

**Application Layer:**
- UIとエンジン間の調整
- 状態管理（選択中のセル、編集モード）
- 再計算トリガー

**Engine Layer:**
- 数式の解析と評価
- セル間の依存関係管理
- 循環参照検出
- エラー処理

## コンポーネントとインターフェース

### Engine Layer

#### 1. FormulaParser

数式文字列を抽象構文木（AST）に変換します。

```typescript
interface FormulaParser {
  parse(formula: string): ParseResult;
}

type ParseResult = 
  | { success: true; ast: ASTNode }
  | { success: false; error: string };

type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'cellRef'; cell: CellAddress }
  | { type: 'range'; start: CellAddress; end: CellAddress }
  | { type: 'binaryOp'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { type: 'function'; name: 'SUM' | 'AVG'; args: ASTNode[] };

interface CellAddress {
  col: number;  // 0-9 (A-J)
  row: number;  // 0-19 (1-20)
}
```

**主要メソッド:**
- `parse(formula: string)`: 数式文字列をASTに変換
- 文法: `formula = "=" expression`
- サポート演算子: `+`, `-`, `*`, `/`
- サポート関数: `SUM(range)`, `AVG(range)`
- セル参照: `A1` 形式
- 範囲: `A1:B5` 形式

#### 2. CellEvaluator

ASTを評価して計算結果を返します。

```typescript
interface CellEvaluator {
  evaluate(ast: ASTNode, context: EvaluationContext): EvaluationResult;
}

interface EvaluationContext {
  getCellValue(address: CellAddress): CellValue;
  getRangeValues(start: CellAddress, end: CellAddress): CellValue[];
}

type CellValue = number | string | CellError;

type CellError = 
  | { type: 'ERR'; message: string }
  | { type: 'CYC'; message: string };

type EvaluationResult =
  | { success: true; value: CellValue }
  | { success: false; error: CellError };
```

**評価ルール:**
- 数値リテラル: そのまま返す
- セル参照: コンテキストから値を取得
- 空セル: 0として扱う
- エラーセル: エラーを伝播
- 二項演算: 左右を評価して演算
- 関数: 引数を評価して関数を適用

#### 3. DependencyGraph

セル間の依存関係を管理します。

```typescript
interface DependencyGraph {
  addDependency(from: CellAddress, to: CellAddress): void;
  removeDependencies(cell: CellAddress): void;
  getDependents(cell: CellAddress): CellAddress[];
  getTopologicalOrder(cells: CellAddress[]): CellAddress[] | null;
}
```

**データ構造:**
- 有向グラフ（隣接リスト表現）
- `from` → `to`: `from`が`to`を参照している
- 依存先（dependents）: あるセルを参照しているセルの集合

**主要操作:**
- `addDependency`: 依存関係を追加
- `removeDependencies`: セルの全依存関係を削除
- `getDependents`: あるセルを参照しているセルを取得
- `getTopologicalOrder`: トポロジカルソート（サイクルがある場合はnull）

#### 4. CycleDetector

依存関係グラフ内の循環参照を検出します。

```typescript
interface CycleDetector {
  detectCycle(graph: DependencyGraph, startCell: CellAddress): CellAddress[] | null;
}
```

**アルゴリズム:**
- 深さ優先探索（DFS）
- 訪問済みマークと再帰スタックを使用
- サイクルが見つかった場合、サイクルに含まれるセルのリストを返す
- サイクルがない場合、nullを返す

#### 5. SpreadsheetEngine

エンジン全体を統合するファサードクラス。

```typescript
interface SpreadsheetEngine {
  setCellContent(address: CellAddress, content: string): void;
  getCellValue(address: CellAddress): CellValue;
  getCellDisplayValue(address: CellAddress): string;
  recalculate(changedCell: CellAddress): void;
}

interface CellData {
  rawContent: string;           // ユーザーが入力した生の文字列
  parsedFormula?: ASTNode;      // 解析済みAST（数式の場合）
  evaluatedValue: CellValue;    // 評価結果
  dependencies: CellAddress[];  // このセルが参照しているセル
}
```

**主要メソッド:**
- `setCellContent`: セルの内容を設定し、再計算をトリガー
- `getCellValue`: セルの評価済み値を取得
- `getCellDisplayValue`: セルの表示用文字列を取得
- `recalculate`: 変更されたセルとその依存先を再計算

**再計算フロー:**
1. 変更されたセルの内容を解析
2. 新しい依存関係を抽出
3. 古い依存関係を削除し、新しい依存関係を追加
4. 循環参照をチェック
5. 循環がある場合、関連セルに`#CYC`エラーを設定
6. 循環がない場合、トポロジカル順序で依存先を再計算

### UI Layer

#### 1. Grid Component

グリッド全体を表示するReactコンポーネント。

```typescript
interface GridProps {
  engine: SpreadsheetEngine;
  rows: number;
  cols: number;
}

function Grid({ engine, rows, cols }: GridProps): JSX.Element;
```

**責務:**
- 列ヘッダー（A-J）と行ヘッダー（1-20）の表示
- セルコンポーネントのレンダリング
- 選択状態の管理
- キーボードナビゲーション

#### 2. FormulaBar Component

数式バーを表示するReactコンポーネント。

```typescript
interface FormulaBarProps {
  selectedCell: CellAddress | null;
  cellContent: string;
  onContentChange: (newContent: string) => void;
}

function FormulaBar(props: FormulaBarProps): JSX.Element;
```

**責務:**
- 選択中のセル番地の表示（例: A1）
- セルの生の入力内容の表示（数式の場合は`=`を含む）
- 数式バーでの編集機能
- 編集内容のセルへの反映

#### 3. Cell Component

個別のセルを表示するReactコンポーネント。

```typescript
interface CellProps {
  address: CellAddress;
  value: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onCommit: (newValue: string) => void;
  onCancel: () => void;
}

function Cell(props: CellProps): JSX.Element;
```

**状態:**
- 表示モード: 計算結果を表示（空セルは空白、値0のセルは"0"を表示）
- 編集モード: 入力フィールドを表示

**イベント:**
- クリック: セル選択
- ダブルクリック: 編集モード開始
- Enter: 編集モード開始（選択時）/ コミット（編集時）
- Escape: 編集キャンセル
- 外側クリック: コミット

**表示ルール:**
- 空セル（値なし）: 空白を表示
- 数値0: "0"を表示
- エラー: "#ERR"または"#CYC"を表示

### Application Layer

#### State Management

```typescript
interface AppState {
  selectedCell: CellAddress | null;
  editingCell: CellAddress | null;
  editingContent: string;
}
```

**状態遷移:**
- セル選択: `selectedCell`を更新
- 編集開始: `editingCell`と`editingContent`を設定
- 編集コミット: エンジンに内容を送信、編集状態をクリア
- 編集キャンセル: 編集状態をクリア

## データモデル

### セルアドレス

```typescript
interface CellAddress {
  col: number;  // 0-9 (A-J)
  row: number;  // 0-19 (1-20)
}

// ユーティリティ関数
function parseAddress(str: string): CellAddress | null;
function formatAddress(addr: CellAddress): string;
```

**例:**
- `"A1"` → `{ col: 0, row: 0 }`
- `"J20"` → `{ col: 9, row: 19 }`

### セルデータ

```typescript
interface CellData {
  rawContent: string;           // "=A1+B2" or "42" or "Hello"
  parsedFormula?: ASTNode;      // 数式の場合のみ
  evaluatedValue: CellValue;    // 計算結果
  dependencies: CellAddress[];  // 参照しているセル
}
```

### グリッドデータ

```typescript
type Grid = Map<string, CellData>;  // key: "A1", "B2", etc.
```

## 正確性プロパティ

プロパティとは、システムのすべての有効な実行において真であるべき特性や振る舞いのことです。プロパティは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しをします。


### プロパティ1: キーボードナビゲーションの正確性

*任意の*有効なセル位置と方向（上下左右）に対して、矢印キーを押すと、選択が対応する方向の隣接セル（グリッド境界内）に移動する

**検証: 要件 2.2**

### プロパティ2: 単一セル選択の不変条件

*任意の*操作（セルクリック、キーボードナビゲーション、編集モード開始/終了）の後、システムは常に正確に1つの選択されたセルを維持する

**検証: 要件 2.4**

### プロパティ3: 編集モード遷移（ダブルクリック）

*任意の*セルに対して、ダブルクリックイベントを発行すると、そのセルが編集モードに入る

**検証: 要件 3.1**

### プロパティ4: 編集モード遷移（Enterキー）

*任意の*選択されたセルに対して、Enterキーを押すと、そのセルが編集モードに入る

**検証: 要件 3.2**

### プロパティ5: 入力受け入れ

*任意の*文字列入力に対して、編集モード中にその入力を受け入れる

**検証: 要件 3.4**

### プロパティ6: 編集コミットの永続化

*任意の*セルと入力値に対して、編集モードでEnterキーを押すかセルの外側をクリックすると、入力が保存され、セルの値が更新される

**検証: 要件 3.5**

### プロパティ7: 編集キャンセルの不変性

*任意の*セルと編集中の値に対して、Escapeキーを押すと、元の値が保持され、変更が破棄される

**検証: 要件 3.6**

### プロパティ8: 入力分類の正確性

*任意の*入力文字列に対して、`=`で始まる場合は数式として認識され、そうでない場合はリテラルテキストまたは数値として扱われる

**検証: 要件 4.1, 4.2**

### プロパティ9: 算術演算子のパース

*任意の*`+`, `-`, `*`, `/`を含む有効な数式に対して、パーサーは正しくASTを生成する

**検証: 要件 4.3**

### プロパティ10: 構文エラー検出

*任意の*無効な構文を持つ数式に対して、パーサーは`#ERR`エラーを返す

**検証: 要件 4.4**

### プロパティ11: セル参照の解決

*任意の*セル参照を含む数式に対して、エンジンは参照されたすべてのセルから値を取得し、正しく評価する

**検証: 要件 5.1, 5.2**

### プロパティ12: エラー伝播

*任意の*エラーを含むセルを参照する数式に対して、そのエラーは参照元のセルに伝播する

**検証: 要件 5.4**

### プロパティ13: 範囲表記のパース

*任意の*`A1:B5`形式の有効な範囲表記に対して、パーサーは正しく範囲を認識する

**検証: 要件 6.1**

### プロパティ14: SUM関数の正確性

*任意の*セル範囲に対して、`SUM(範囲)`は範囲内のすべての数値の合計を正しく計算する

**検証: 要件 6.2**

### プロパティ15: AVG関数の正確性

*任意の*セル範囲に対して、`AVG(範囲)`は範囲内のすべての数値の平均を正しく計算する

**検証: 要件 6.3**

### プロパティ16: 無効な範囲のエラー処理

*任意の*グリッド境界外の範囲（例: `Z99:AA100`）に対して、エンジンは`#ERR`エラーを返す

**検証: 要件 6.5**

### プロパティ17: 依存セルの識別

*任意の*セルの値が変更されたとき、エンジンは依存関係グラフを使用して、そのセルを参照するすべてのセルを正しく識別する

**検証: 要件 7.1**

### プロパティ18: トポロジカル順序での再計算

*任意の*セルの値が変更されたとき、エンジンはトポロジカル順序ですべての依存セルを再計算し、正しい最終値を生成する

**検証: 要件 7.2**

### プロパティ19: 依存関係グラフの一貫性

*任意の*操作（セル更新、数式変更）の後、依存関係グラフはすべてのセル参照関係を正確に反映する

**検証: 要件 7.4**

### プロパティ20: 循環参照の検出

*任意の*循環依存を作成する数式（例: A1→B1→A1）に対して、エンジンはサイクルを検出する

**検証: 要件 8.1**

### プロパティ21: 循環参照エラーの設定

*任意の*循環依存が検出されたとき、サイクル内のすべてのセルに`#CYC`エラーが設定される

**検証: 要件 8.2, 9.2**

### プロパティ22: 無限ループの防止

*任意の*循環依存に対して、エンジンは評価前にサイクルを検出し、無限ループを発生させない

**検証: 要件 8.3**

### プロパティ23: 構文エラーの処理

*任意の*構文エラーを含む数式に対して、エンジンは`#ERR`エラーを返す

**検証: 要件 9.1**

### プロパティ24: 無効なセル参照のエラー処理

*任意の*無効なセル参照（例: `Z99`）を含む数式に対して、エンジンは`#ERR`エラーを返す

**検証: 要件 9.3**

### プロパティ25: エラー時の堅牢性

*任意の*エラーが発生しても、システムは他の機能を中断せず、エラー値を表示して継続動作する

**検証: 要件 9.4**

## エラー処理

### エラータイプ

システムは以下のエラータイプを定義します：

```typescript
type CellError = 
  | { type: 'ERR'; message: string }
  | { type: 'CYC'; message: string };
```

**ERRエラー:**
- 構文エラー（無効な数式）
- 無効なセル参照（グリッド境界外）
- 無効な範囲
- ゼロ除算
- その他の評価エラー

**CYCエラー:**
- 循環参照検出時

### エラー処理戦略

1. **早期検出**: パース時に構文エラーを検出
2. **エラー伝播**: 参照先のエラーを参照元に伝播
3. **循環検出**: 評価前にサイクルを検出
4. **グレースフルデグラデーション**: エラーが発生しても他のセルは正常動作
5. **明確なエラーメッセージ**: ユーザーがエラーを理解できるメッセージ

### エラー表示

- セルにエラー値を表示: `#ERR`, `#CYC`
- エラーセルは赤色でハイライト（UI層）
- エラーメッセージはツールチップで表示（オプション）

## テスト戦略

### 二重テストアプローチ

システムは単体テストとプロパティベーステストの両方を使用します：

**単体テスト:**
- 特定の例とエッジケースの検証
- コンポーネント間の統合ポイント
- エラー条件の確認
- 例: 空セルは0として扱われる、非数値は関数で無視される

**プロパティベーステスト:**
- ランダム化による包括的な入力カバレッジ
- 普遍的なプロパティの検証
- 各プロパティテストは最低100回の反復を実行
- 各テストは設計書のプロパティを参照するタグを含む
- タグ形式: **Feature: spreadsheet-sample, Property {番号}: {プロパティテキスト}**

### テストライブラリ

- **テストフレームワーク**: Vitest（必須: `npm run test`で実行）
- **プロパティベーステスト**: fast-check（TypeScript用）
- **UIテスト**: React Testing Library

### テストカバレッジ

**Engine Layer（100%カバレッジ目標）:**
- FormulaParser: すべての演算子、関数、エラーケース
- CellEvaluator: すべての評価パス、エラー伝播
- DependencyGraph: 追加、削除、トポロジカルソート
- CycleDetector: 様々なサイクルパターン
- SpreadsheetEngine: 統合シナリオ、再計算チェーン

**Application Layer:**
- 状態遷移のテスト
- イベント処理のテスト

**UI Layer:**
- コンポーネントのレンダリングテスト
- ユーザー相互作用のテスト

### テスト実行

```bash
npm run test          # すべてのテストを実行
npm run test:unit     # 単体テストのみ
npm run test:property # プロパティテストのみ
npm run test:coverage # カバレッジレポート生成
```

### 重要なテストシナリオ

1. **基本的な数式評価**: `=1+2`, `=A1*B2`
2. **関数**: `=SUM(A1:A5)`, `=AVG(B1:B10)`
3. **エラー処理**: 構文エラー、無効な参照、ゼロ除算
4. **循環参照**: 単純なサイクル（A1→B1→A1）、複雑なサイクル
5. **連鎖再計算**: A1→B1→C1→D1の変更伝播
6. **エッジケース**: 空セル、非数値、境界外参照
7. **依存関係管理**: 数式変更時の依存関係更新

## 実装上の注意事項

### パフォーマンス考慮事項

- **依存関係グラフ**: 効率的な隣接リスト表現
- **トポロジカルソート**: Kahn's algorithmまたはDFSベース
- **メモ化**: 再計算時に不要な評価を避ける
- **差分更新**: 変更されたセルとその依存先のみ再計算

### 拡張性

将来の拡張に備えた設計：
- 新しい関数の追加（MIN, MAX, COUNT, etc.）
- より多くの演算子（%, ^, etc.）
- セル範囲の拡張（より大きなグリッド）
- 複数シートのサポート
- ファイル保存/読み込み

### セキュリティ

- **入力検証**: すべてのユーザー入力を検証
- **サンドボックス化**: 数式評価は安全な環境で実行
- **DoS防止**: 循環参照検出により無限ループを防止
- **XSS防止**: セル内容のエスケープ処理

## 技術スタック

- **言語**: TypeScript
- **UIフレームワーク**: React
- **状態管理**: React Hooks（useState, useReducer）またはZustand
- **スタイリング**: Tailwind CSS
- **テストフレームワーク**: Vitest（必須: `npm run test`で実行可能）
- **プロパティテスト**: fast-check
- **ビルドツール**: Vite
- **パッケージマネージャー**: npm

### Ralphループ戦略

本プロジェクトは、AIが自律的に開発できるよう、以下の戦略を採用します：

- **Engine Layer（Pure Logic）**: UIに依存しないTypeScriptクラス/関数群として実装
- **100%テストカバレッジ目標**: Engine層はVitestで徹底的に検証
- **UI層の単純化**: Engineの状態を画面に描画するだけで、複雑なロジックは持たせない
- **テスト駆動開発**: `npm run test`で全テストが実行可能であること

## 成功条件（Definition of Done）

1. `npm run test`を実行し、Engineの単体テストが全てパスすること
2. 特に「循環参照の検知」と「連鎖的な再計算」のテストケースが含まれていること
3. アプリケーションがビルド（`npm run build`）でき、エラーがないこと
4. Engine層のテストカバレッジが100%に達していること
5. すべての正確性プロパティがプロパティベーステストで検証されていること

## ディレクトリ構造

```
spreadsheet-sample/
├── src/
│   ├── engine/
│   │   ├── parser.ts           # FormulaParser
│   │   ├── evaluator.ts        # CellEvaluator
│   │   ├── dependency.ts       # DependencyGraph
│   │   ├── cycle.ts            # CycleDetector
│   │   ├── engine.ts           # SpreadsheetEngine
│   │   └── types.ts            # 共通型定義
│   ├── components/
│   │   ├── Grid.tsx            # Grid Component
│   │   ├── Cell.tsx            # Cell Component
│   │   └── types.ts            # UI型定義
│   ├── hooks/
│   │   └── useSpreadsheet.ts   # カスタムフック
│   ├── utils/
│   │   └── address.ts          # アドレス変換ユーティリティ
│   └── App.tsx                 # メインアプリケーション
├── tests/
│   ├── engine/
│   │   ├── parser.test.ts
│   │   ├── evaluator.test.ts
│   │   ├── dependency.test.ts
│   │   ├── cycle.test.ts
│   │   └── engine.test.ts
│   ├── properties/
│   │   ├── parser.property.test.ts
│   │   ├── evaluator.property.test.ts
│   │   └── engine.property.test.ts
│   └── components/
│       ├── Grid.test.tsx
│       └── Cell.test.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```
