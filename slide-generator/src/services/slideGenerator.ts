import Anthropic from '@anthropic-ai/sdk';
import type { Slide, GenerateSlideRequest } from '../types';

export async function generateSlide(request: GenerateSlideRequest): Promise<Slide> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_CLAUDE_API_KEY is not set in .env file');
  }

  const anthropic = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Note: In production, API calls should be made from a backend
  });

  const prompt = `あなたは中小企業の経営者や初心者向けに、わかりやすい研修資料を作成するスライド構成作家です。
以下の記事やノートの内容を分析して、研修用のスライド1枚分の情報にまとめてください。

# 入力内容
${request.content}

# 出力形式
以下のJSON形式で出力してください：
{
  "title": "スライドのタイトル（簡潔で魅力的に）",
  "summary": "スライドの概要（1〜2行、40〜60文字程度で要点を説明）",
  "bulletPoints": ["要点1", "要点2", "要点3", "要点4"],
  "speakerNotes": "発表者向けのメモ（話す内容の詳細、補足説明、質問への回答案など）"
}

# 重要な制約（CLAUDE.mdスライド作成基準ガイドに準拠）

## ターゲット
- 中小企業・個人事業主・初心者
- IT知識がなくても理解できる内容

## 文字量の基準（厳守）
- summary（リード文）: 40〜60文字程度（1〜2行）
- bulletPoints: **3〜4項目のみ**
- 各箇条書き項目: 40〜60文字程度（最大2行）
- **合計文字数: 300〜400文字以内を目安**
- 文字サイズ24pt〜32ptで視認性を確保するため、情報は厳選して要約すること

## デザイン原則
1. **余白の確保**: 詰め込みすぎず、読みやすさを重視
2. **階層構造**: 見出し→説明→補足の流れを明確に
3. **簡潔性**: 各箇条書きは見出しと説明を「:」で区切り、情報は厳選

## 禁止事項
- 専門用語の多用（必要な場合は簡単な説明を添える）
- 1スライドに情報を詰め込みすぎる
- 複雑な図表や長い文章

## フィードバック学習ルール
ユーザーから生成されたスライドに対して、文体・構成・表現に関するフィードバックや修正指示があった場合:
1. **成果物の修正**: 指摘に基づいて該当箇所を適切に修正する
2. **教訓の抽出**: 個別の修正内容から一般化できる執筆ルールを導き出す
3. **CLAUDE.md の更新**: 抽出した教訓を CLAUDE.md の適切なセクションに追加する
   - 追加時は追加日時と元となったフィードバック内容を記録する
4. **報告**: 修正内容、抽出したルール、CLAUDE.md への追加内容を報告する

このプロセスはフィードバックがあれば自動的に実行すること。

# 要件
- bulletPointsは**必ず3〜4個**にする（5個以上は禁止）
- 各箇条書きは「**見出し**: 説明」の形式で、40〜60文字程度に収める
- スライドとして見やすく、理解しやすい内容にする
- 初心者にも分かりやすい言葉を使う
- speakerNotesには発表時に役立つ詳細情報を含める
- JSONのみを出力し、他の説明は含めない`;

  const message = await anthropic.messages.create({
    // Available Claude 4 models (2025):
    // - 'claude-haiku-4-5' (recommended: fast, cost-effective at $1/M tokens)
    // - 'claude-sonnet-4-5-20250929' (high performance, best for coding)
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse response from Claude API');
  }

  const slide: Slide = JSON.parse(jsonMatch[0]);

  // Validate the response
  if (!slide.title || !slide.summary || !slide.bulletPoints || !slide.speakerNotes) {
    throw new Error('Invalid response structure from Claude API');
  }

  return slide;
}
