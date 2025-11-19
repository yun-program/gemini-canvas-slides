import type { PromptInput, GeneratedPrompt, SlideOutline } from '../types';

/**
 * テンプレートから骨子を生成
 */
export function generateOutline(input: PromptInput): SlideOutline[] {
  const { template, userInput, customSlides } = input;

  // カスタムスライドが提供されている場合はそれを使用
  if (customSlides && customSlides.length > 0) {
    return customSlides;
  }

  // テンプレートから基本的な骨子を生成
  return template.structure.map((slide, index) => ({
    slideNumber: index + 1,
    title: slide.title,
    keyPoints: [slide.guidance],
    notes: `テーマ: ${userInput.theme}\n${userInput.details ? `詳細: ${userInput.details}` : ''}`
  }));
}

/**
 * Gemini Canvas用のプロンプトを生成
 */
export function buildPrompt(input: PromptInput): GeneratedPrompt {
  const { template, style, layoutRules, userInput } = input;
  const outline = generateOutline(input);

  // プロンプトの組み立て
  const promptParts = [
    buildRoleSection(),
    buildThemeSection(userInput),
    buildStyleSection(style, layoutRules),
    buildStructureSection(outline),
    buildConstraintsSection(layoutRules),
    buildGeminiCanvasSection(),
  ];

  const prompt = promptParts.join('\n\n');

  return {
    prompt,
    outline,
    metadata: {
      templateId: template.id,
      styleId: style.id,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * 役割定義セクション
 */
function buildRoleSection(): string {
  return `あなたはプレゼンテーションスライド作成の専門家です。
以下の指示に従って、Googleスライドにエクスポートしても崩れない形式でスライドを作成してください。`;
}

/**
 * テーマ・内容セクション
 */
function buildThemeSection(userInput: { theme: string; details: string; targetAudience?: string; additionalNotes?: string }): string {
  let section = `【テーマ・内容】\nテーマ: ${userInput.theme}`;

  if (userInput.details) {
    section += `\n\n詳細情報:\n${userInput.details}`;
  }

  if (userInput.targetAudience) {
    section += `\n\n対象者: ${userInput.targetAudience}`;
  }

  if (userInput.additionalNotes) {
    section += `\n\n補足事項:\n${userInput.additionalNotes}`;
  }

  return section;
}

/**
 * スタイル規定セクション
 */
function buildStyleSection(style: PromptInput['style'], layoutRules: PromptInput['layoutRules']): string {
  const sizes = style.sizes as any;
  const colors = style.colors as any;

  // フォントサイズセクション
  let fontSizeSection = `【フォントサイズ】（重要：必ずpxで指定してください）
- 大見出し（タイトル）: ${sizes.titleSlide || style.sizes.titleSlide}
- スライドタイトル: ${sizes.slideTitle || style.sizes.slideTitle}`;

  if (sizes.heading) {
    fontSizeSection += `\n- 見出し: ${sizes.heading}`;
  }
  fontSizeSection += `\n- 本文: ${sizes.body || style.sizes.body}`;

  if (sizes.bodySmall) {
    fontSizeSection += `\n- 本文（小）: ${sizes.bodySmall}`;
  }
  if (sizes.citation) {
    fontSizeSection += `\n- 引用・注釈: ${sizes.citation}`;
  }

  // カラーセクション
  let colorSection = `- カラースキーム: ${style.name}
  - メインカラー: ${style.colors.primary}
  - サブカラー: ${style.colors.secondary}
  - テキスト: ${style.colors.text}
  - 背景: ${style.colors.background}`;

  if (colors.pointRed) {
    colorSection += `\n  - ポイント（赤）: ${colors.pointRed}（強調時に使用、#f00ではなく落ち着いた赤）`;
  }
  if (colors.sectionDividerGray) {
    colorSection += `\n  - セクション区切り（背景）: ${colors.sectionDividerGray}（章タイトルの背景色）`;
  }

  return `【スタイル規定】
- スライドサイズ: ${layoutRules.aspectRatio}
- フォント: ${style.font.family} (代替: ${style.font.fallback})
${colorSection}

${fontSizeSection}

【レイアウト・配置ルール】
- 余白: 上下${layoutRules.margins.top}/${layoutRules.margins.bottom}、左右${layoutRules.margins.left}/${layoutRules.margins.right}
- テキスト配置: 基本は左揃え（表のタイトルや元資料で中央揃えのものは中央揃えに）
- テキスト左上の開始位置を揃える（下に余白ができるのは可）
- 表が連続するページは位置を揃える（スライド移動でズレないように）
- 箇条書き: ${layoutRules.bulletPoints.min}〜${layoutRules.bulletPoints.max}項目（1項目あたり${layoutRules.bulletPoints.characterLimit}文字以内）`;
}

/**
 * スライド構成セクション
 */
function buildStructureSection(outline: SlideOutline[]): string {
  const slideDetails = outline.map((slide) => {
    const keyPointsText = slide.keyPoints.length > 0
      ? `\n  主要ポイント:\n${slide.keyPoints.map(p => `  - ${p}`).join('\n')}`
      : '';

    return `スライド${slide.slideNumber}: ${slide.title}${keyPointsText}`;
  }).join('\n\n');

  return `【スライド構成】\n合計${outline.length}枚のスライドを作成してください。\n\n${slideDetails}`;
}

/**
 * 制約事項セクション
 */
function buildConstraintsSection(layoutRules: PromptInput['layoutRules']): string {
  return `【制約事項】
- 1スライドあたりの文字数: ${layoutRules.textLimits.bodyPerSlide}文字以内
- スライドタイトル: ${layoutRules.textLimits.slideTitle}文字以内
- 専門用語を使う場合は必ず説明を添える
- 視覚的に読みやすいレイアウトを心がける
- 情報を詰め込みすぎず、1スライド1メッセージを原則とする
- 箇条書きは簡潔に、各項目は${layoutRules.bulletPoints.characterLimit}文字以内`;
}

/**
 * Gemini Canvas → Googleスライド エクスポート対応セクション
 */
function buildGeminiCanvasSection(): string {
  return `【重要：Gemini Canvas → Googleスライドエクスポートの注意事項】

▼ フォントサイズについて
- 上記で指定したフォントサイズは「px（ピクセル）」単位です
- pt（ポイント）ではなく、必ずpx単位で指定してください
- この数値は、Googleスライドへのエクスポート後に正しいサイズになるよう調整済みです
- 指定された数値を厳密に守ってください

▼ レイアウトの原則
- シンプルなレイアウトを使用（複雑な図形配置は避ける）
- アニメーション効果は使用しない
- 画像を使う場合は説明テキストも必ず添える
- テーブルは3列×5行以内に収める
- 表が複数ページにわたる場合、位置を揃える

▼ テキスト配置の徹底
- 文字は左揃えで統一（中央揃えは表のタイトルなど特定の場合のみ）
- テキストの左上開始位置を各スライドで揃える
- 下側に余白ができるのは問題なし

▼ 色の使用
- ポイント強調には指定された「ポイント（赤）」を使用
- 鮮やかすぎる赤（#f00など）は避け、落ち着いた赤を使用
- 章タイトル（セクション区切り）の背景色には指定された「セクション区切り（背景）」を使用
- 各スライドタイプに応じて、指定された色を厳密に守ってください

【出力形式】
各スライドを明確に区切って出力してください。
各スライドには以下を含めてください：
1. スライド番号とタイトル
2. 本文内容（箇条書き、表、図解など）
3. （必要に応じて）スピーカーノート

【エクスポート後の確認事項】
Googleスライドにエクスポート後、以下を確認してください：
- フォントサイズが意図通りか
- 表の位置がズレていないか
- テキストの配置（左揃え）が保たれているか`;
}

/**
 * プロンプトをコピー用テキストとして整形
 */
export function formatPromptForCopy(prompt: string): string {
  return prompt.trim();
}

/**
 * 骨子をMarkdown形式で出力
 */
export function formatOutlineAsMarkdown(outline: SlideOutline[]): string {
  const lines = [
    '# スライド骨子',
    '',
    ...outline.map((slide) => {
      const keyPoints = slide.keyPoints.length > 0
        ? `\n${slide.keyPoints.map(p => `  - ${p}`).join('\n')}`
        : '';
      return `## ${slide.slideNumber}. ${slide.title}${keyPoints}`;
    }),
  ];

  return lines.join('\n');
}
