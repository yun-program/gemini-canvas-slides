# Gemini Canvas Slide Prompt Generator

Gemini用のスライド作成プロンプトを自動生成するツールです。

> ⚠️ **注意事項**
> 本ソフトは作者の学習目的で作成したものであり、動作保証・サポート等は一切行っておりません。
> **ご利用はすべて自己責任** でお願いいたします。

## 特徴

- ✅ **APIキー不要**: 完全にブラウザ上で動作
- ✅ **完全無料**: コスト0円で使用可能
- ✅ **カスタマイズ可能**: テンプレートとスタイルを自由に編集
- ✅ **簡単配布**: 静的ファイルとして簡単にデプロイ可能

## 使い方

### 1. セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

### 2. プロンプト生成の流れ

1. **テンプレートとスタイルを選択**
   - 左側のパネルで用途に応じたテンプレートを選択
   - カラースキームを選択

2. **スライド情報を入力**
   - テーマ: スライドのメインテーマ
   - 詳細情報: スライドに含めたい内容
   - 対象者（オプション）
   - 補足事項（オプション）

3. **プロンプトを生成**
   - 「プロンプトを生成」ボタンをクリック
   - 骨子とプロンプトが表示されます

4. **Geminiで使用**
   - 生成されたプロンプトをコピー
   - [Gemini](https://gemini.google.com) を開く
   - プロンプトを貼り付けて実行
   - Googleスライドにエクスポート

## カスタマイズ方法

### テンプレートの追加・編集

`config/templates.json` を編集してください。

```json
{
  "templates": [
    {
      "id": "custom",
      "name": "カスタムテンプレート",
      "description": "独自の用途向け",
      "defaultSlideCount": 5,
      "structure": [
        {
          "title": "スライドタイトル",
          "type": "custom_type",
          "guidance": "このスライドで伝えたいこと"
        }
      ]
    }
  ]
}
```

### スタイルの追加・編集

`config/styles.json` を編集してください。

```json
{
  "styles": [
    {
      "id": "custom-color",
      "name": "カスタムカラー",
      "description": "企業ブランドカラー",
      "font": {
        "family": "Noto Sans JP",
        "fallback": "Yu Gothic, sans-serif"
      },
      "colors": {
        "primary": "#FF6B6B",
        "secondary": "#4ECDC4",
        "text": "#1F2937",
        "textLight": "#6B7280",
        "background": "#FFFFFF",
        "accent": "#FFE66D"
      },
      "sizes": {
        "titleSlide": "40pt",
        "slideTitle": "32pt",
        "body": "24pt",
        "caption": "18pt"
      }
    }
  ]
}
```

### レイアウトルールの調整

`config/styles.json` の `layoutRules` セクションを編集してください。

```json
{
  "layoutRules": {
    "aspectRatio": "16:9",
    "margins": {
      "top": "60px",
      "bottom": "60px",
      "left": "80px",
      "right": "80px"
    },
    "bulletPoints": {
      "min": 3,
      "max": 5,
      "characterLimit": 60
    },
    "textLimits": {
      "slideTitle": 40,
      "bodyPerSlide": 300
    }
  }
}
```

## デプロイ方法

### GitHub Pages

```bash
# ビルド
npm run build

# dist/ フォルダをGitHub Pagesにデプロイ
# リポジトリ設定 > Pages > Source: dist フォルダ
```

### Vercel

1. [Vercel](https://vercel.com) にログイン
2. リポジトリをインポート
3. 自動デプロイが開始されます

### Netlify

1. [Netlify](https://netlify.com) にログイン
2. "Add new site" > "Import an existing project"
3. リポジトリを選択
4. Build command: `npm run build`
5. Publish directory: `dist`

### ローカル配布（ZIPファイル）

```bash
# ビルド
npm run build

# dist/ フォルダをZIP圧縮
# 配布先でWebサーバーで公開
```

## プロジェクト構造

```
gemini-canvas-slides/
├── config/
│   ├── templates.json      # スライドテンプレート（編集可能）
│   └── styles.json         # スタイル設定（編集可能）
├── src/
│   ├── components/
│   │   ├── InputForm.tsx
│   │   ├── StyleSettings.tsx
│   │   └── PromptDisplay.tsx
│   ├── services/
│   │   └── promptBuilder.ts
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## 技術スタック

- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Vite**: ビルドツール
- **Tailwind CSS**: スタイリング

## トラブルシューティング

### ビルドエラーが出る

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### JSONファイルの編集後にエラー

- JSONの構文が正しいか確認してください
- カンマの位置、引用符、括弧の対応をチェック
- [JSONLint](https://jsonlint.com/) で検証できます

### スタイルが適用されない

- ブラウザのキャッシュをクリア
- `npm run dev` を再起動

## ライセンス

MIT License

## 貢献

プルリクエスト歓迎です！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## サポート

問題や質問がある場合は、Issueを作成してください。

**注意**: ご連絡いただいても、対応を保証するものではありません。本ソフトは学習目的で作成されており、サポートはベストエフォートベースとなります。

## 作者

- **作者**: yun
- **GitHub**: [https://github.com/yun-program](https://github.com/yun-program)
