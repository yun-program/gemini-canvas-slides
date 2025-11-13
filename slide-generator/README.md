# 研修スライド自動生成ツール

記事やノートの内容から、研修用のスライドを自動生成するWebアプリケーションです。Claude APIを使用して、入力されたコンテンツを分析し、プレゼンテーション資料として適切な形式に整理します。

## 機能

- 📝 複数の記事やノートを入力
- 🤖 Claude APIによる自動要約と構造化
- 🎨 プレゼンテーション資料らしいデザイン
- 📊 スライド形式でのプレビュー
- 📋 発表者向けメモの自動生成

## セットアップ

### 前提条件

- Node.js 18以降
- Claude API Key（[Anthropic Console](https://console.anthropic.com/)で取得）

### インストール手順

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定

`.env.example`をコピーして`.env`ファイルを作成し、Claude API Keyを設定してください。

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
VITE_CLAUDE_API_KEY=your-actual-api-key-here
```

API Keyは[Anthropic Console](https://console.anthropic.com/)で取得できます。

3. 開発サーバーを起動

```bash
npm run dev
```

4. ブラウザで `http://localhost:5173` を開く

## 使い方

1. **記事・ノートの内容を入力**
   - 研修で扱いたい記事やノートの内容をテキストエリアに貼り付け
   - 複数の記事を入力する場合は、改行やセクション分けをして入力

2. **スライドを生成**
   - 「スライドを生成」ボタンをクリック
   - Claude APIが内容を分析し、スライドを生成

3. **生成結果を確認**
   - スライドプレビュー：タイトル、概要、箇条書きを表示
   - 発表者向けメモ：発表時に役立つ詳細情報を表示

## 出力形式

生成されるスライドには以下の要素が含まれます：

- **タイトル**: 簡潔で魅力的なスライドタイトル
- **概要**: 2-3文でスライドの要点を説明
- **箇条書き**: 3〜5個の重要なポイント
- **発表者向けメモ**: 発表時に役立つ詳細情報や補足説明

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **AI**: Claude API (Anthropic)

## 開発

### ビルド

```bash
npm run build
```

### プレビュー

```bash
npm run preview
```

## 注意事項

- **セキュリティ**: `.env`ファイルは`.gitignore`に含まれており、Gitにコミットされません。API Keyは絶対に公開リポジトリにプッシュしないでください
- **本番環境**: 現在はブラウザから直接Claude APIを呼び出していますが、本番環境ではバックエンドサーバー経由での実装を推奨します
- **料金**: API利用料金が発生します。Haiku 4.5は$1/M input tokens、$5/M output tokensです
- **モデル**: デフォルトは`claude-haiku-4-5`（コスト効率重視）。より高性能なモデルが必要な場合は`slideGenerator.ts`で`claude-sonnet-4-5-20250929`に変更できます

## ライセンス

MIT
