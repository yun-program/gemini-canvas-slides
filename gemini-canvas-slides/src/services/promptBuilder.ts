import type { PromptInput, GeneratedPrompt, SlideOutline, SlideCountRecommendation } from '../types';

/**
 * 情報量からスライド枚数を推奨
 */
export function recommendSlideCount(userInput: { theme: string; details: string; additionalNotes?: string }): SlideCountRecommendation {
  const { details, additionalNotes } = userInput;

  // 文字数をカウント
  const totalChars = (details || '').length + (additionalNotes || '').length;

  // 箇条書き項目の数をカウント（簡易的に「-」「•」「*」「1.」などで始まる行）
  const detailsLines = (details || '').split('\n');
  const bulletPoints = detailsLines.filter(line =>
    /^\s*[-•*]\s/.test(line) || /^\s*\d+\.\s/.test(line)
  ).length;

  // セクション見出しの数をカウント（**で囲まれたテキストや##で始まる行）
  const sections = detailsLines.filter(line =>
    /^\s*##/.test(line) || /\*\*.+\*\*/.test(line)
  ).length;

  let recommended = 5; // デフォルト
  let reason = '';

  // 文字数ベースの推奨
  if (totalChars < 500) {
    recommended = 3;
    reason = '情報量が少ないため、3枚で十分です';
  } else if (totalChars < 1500) {
    recommended = 5;
    reason = '標準的な情報量のため、5枚が適切です';
  } else if (totalChars < 3000) {
    recommended = 8;
    reason = '情報量が多いため、8枚を推奨します';
  } else if (totalChars < 5000) {
    recommended = 10;
    reason = '情報量がかなり多いため、10枚を推奨します';
  } else {
    recommended = 12;
    reason = '情報量が非常に多いため、12枚以上または段階的生成を推奨します';
  }

  // セクション数による調整
  if (sections > 0 && sections > recommended - 2) {
    recommended = Math.max(recommended, sections + 2); // セクション数+タイトル・まとめ
    reason = `${sections}個のセクションがあるため、${recommended}枚を推奨します`;
  }

  // 箇条書き項目数による調整
  if (bulletPoints > 15) {
    const estimatedFromBullets = Math.ceil(bulletPoints / 3) + 2; // 1スライド3項目+タイトル・まとめ
    if (estimatedFromBullets > recommended) {
      recommended = estimatedFromBullets;
      reason = `${bulletPoints}個の箇条書き項目があるため、${recommended}枚を推奨します`;
    }
  }

  return {
    recommended,
    reason,
    minSuggested: Math.max(3, recommended - 2),
    maxSuggested: recommended + 3,
  };
}

/**
 * 情報量をスライド枚数に応じて再構成
 * 多くの枚数が選ばれた場合は情報をそのまま使い、
 * 少ない枚数が選ばれた場合は要約版の指示を追加
 */
function restructureContentBySlideCount(
  userInput: { theme: string; details: string; additionalNotes?: string },
  slideCount: number,
  recommendedCount: number
): string {
  const details = userInput.details;
  const additionalNotes = userInput.additionalNotes || '';

  // スライド枚数が推奨より少ない場合、要約の指示を追加
  if (slideCount < recommendedCount) {
    const reductionRatio = Math.round((1 - slideCount / recommendedCount) * 100);
    return `${details}${additionalNotes ? `\n\n${additionalNotes}` : ''}

【重要】情報量の調整について：
- 上記の情報を${slideCount}枚のスライドに収める必要があります
- 推奨枚数は${recommendedCount}枚ですが、${slideCount}枚に絞り込みます（約${reductionRatio}%削減）
- **最も重要なポイントのみを選択し、詳細は大幅に省略してください**
- **各スライドは簡潔に、キーメッセージのみを含めてください**
- **箇条書きは3-5項目程度に抑え、各項目は50文字以内にしてください**
- **コンテンツがスライドからはみ出すことは絶対に避けてください**`;
  } else if (slideCount > recommendedCount) {
    const expansionRatio = Math.round((slideCount / recommendedCount - 1) * 100);
    return `${details}${additionalNotes ? `\n\n${additionalNotes}` : ''}

【重要】情報量の調整について：
- 上記の情報を${slideCount}枚のスライドに展開します
- 推奨枚数は${recommendedCount}枚ですが、${slideCount}枚に拡張します（約${expansionRatio}%増量）
- 各ポイントをより詳細に展開してください
- 具体例や補足説明を追加してください
- **ただし、各スライドは1ページに収まるようにしてください。はみ出しは絶対に避けてください**`;
  }

  // 推奨枚数と同じ場合でも、はみ出し防止の注意を追加
  return `${details}${additionalNotes ? `\n\n${additionalNotes}` : ''}

【重要】コンテンツのはみ出し防止について：
- **各スライドは必ず1ページに収めてください**
- **情報量が多い場合は、箇条書きの項目数を減らす、または文字数を削減してください**
- **コンテンツがスライドからはみ出すことは絶対に避けてください**`;
}

/**
 * テンプレートから骨子を生成
 */
export function generateOutline(input: PromptInput): SlideOutline[] {
  const { template, userInput, customSlides } = input;

  // カスタムスライドが提供されている場合はそれを使用
  if (customSlides && customSlides.length > 0) {
    return customSlides;
  }

  // スライド枚数の決定（ユーザー指定 > 推奨 > デフォルト）
  const slideCount = userInput.slideCount ||
                     recommendSlideCount(userInput).recommended ||
                     template.defaultSlideCount;

  // スライド枚数に応じて骨子を調整
  if (slideCount === template.structure.length) {
    // テンプレート通り
    return template.structure.map((slide, index) => ({
      slideNumber: index + 1,
      title: slide.title,
      keyPoints: [slide.guidance],
      notes: `テーマ: ${userInput.theme}\n${userInput.details ? `詳細: ${userInput.details}` : ''}`
    }));
  } else if (slideCount < template.structure.length) {
    // スライド枚数を減らす場合は重要なものだけ選択
    const selectedSlides = template.structure.slice(0, slideCount);
    return selectedSlides.map((slide, index) => ({
      slideNumber: index + 1,
      title: slide.title,
      keyPoints: [slide.guidance],
      notes: `テーマ: ${userInput.theme}\n${userInput.details ? `詳細: ${userInput.details}` : ''}`
    }));
  } else {
    // スライド枚数を増やす場合は、テンプレートを拡張
    const baseSlides = template.structure.map((slide, index) => ({
      slideNumber: index + 1,
      title: slide.title,
      keyPoints: [slide.guidance],
      notes: `テーマ: ${userInput.theme}\n${userInput.details ? `詳細: ${userInput.details}` : ''}`
    }));

    // 追加スライドを生成（主にコンテンツスライド）
    const additionalCount = slideCount - template.structure.length;
    for (let i = 0; i < additionalCount; i++) {
      const slideNum = template.structure.length + i;
      baseSlides.splice(slideNum, 0, {
        slideNumber: slideNum + 1,
        title: `詳細 ${i + 1}`,
        keyPoints: ['詳細な内容を展開'],
        notes: `テーマ: ${userInput.theme}\n${userInput.details ? `詳細: ${userInput.details}` : ''}`
      });
    }

    // スライド番号を再割り当て
    return baseSlides.map((slide, index) => ({
      ...slide,
      slideNumber: index + 1
    }));
  }
}

/**
 * Gemini Canvas用のプロンプトを生成
 */
export function buildPrompt(input: PromptInput): GeneratedPrompt {
  const { template, style, layoutRules, userInput } = input;

  // ティースリーモードの単体生成の場合
  if (userInput.mode === 't3' && userInput.t3SubMode === 'single' && userInput.selectedPattern) {
    return buildSingleSlidePrompt(input, style, layoutRules, userInput.selectedPattern);
  }

  const outline = generateOutline(input);
  const recommendation = recommendSlideCount(userInput);

  // 段階的生成モードの場合（汎用モードのみ）
  if (userInput.mode === 'general' && userInput.useStepByStep) {
    return buildStepByStepPrompts(input, outline, style, layoutRules, recommendation);
  }

  // 通常モード（一括生成）
  // 情報量を再構成
  const restructuredInput = {
    ...userInput,
    details: restructureContentBySlideCount(
      userInput,
      userInput.slideCount || recommendation.recommended,
      recommendation.recommended
    ),
  };

  // プロンプトの組み立て
  const promptParts = [
    buildThemeSection(restructuredInput),
    buildStyleSection(style, layoutRules, userInput.mode),
    buildStructureSection(outline),
    buildConstraintsSection(layoutRules),
    buildGeminiCanvasSection(userInput.mode),
    buildOutputExampleSection(),
    buildExecutionSection(outline.length),
  ];

  const prompt = promptParts.join('\n\n');

  return {
    prompt,
    outline,
    metadata: {
      templateId: template.id,
      styleId: style.id,
      generatedAt: new Date().toISOString(),
      recommendedSlideCount: recommendation.recommended,
      isStepByStep: false,
    },
  };
}

/**
 * ティースリーモードの単体生成用プロンプトを生成
 */
function buildSingleSlidePrompt(
  input: PromptInput,
  style: PromptInput['style'],
  layoutRules: PromptInput['layoutRules'],
  selectedPattern: string
): GeneratedPrompt {
  const { template, userInput } = input;

  // 選択されたパターンを取得
  const pattern = template.structure.find(s => s.type === selectedPattern);

  if (!pattern) {
    throw new Error(`パターンが見つかりません: ${selectedPattern}`);
  }

  const promptParts = [
    buildThemeSection(userInput),
    `【スライドタイプ】
タイプ: ${pattern.title}
用途: ${pattern.guidance}

このスライドタイプに最適なレイアウトと内容で、${userInput.slideCount || 1}枚のスライドを作成してください。`,
    `【重要】詳細情報の使用について：
- 上記の詳細情報には、テーマ「${userInput.theme}」から外れる内容も含まれている可能性があります
- **必ずテーマ「${userInput.theme}」に沿った内容だけを選択して使用してください**
- テーマと関連性が低い情報は使用しないでください
- **${userInput.slideCount || 1}枚のスライドに収まるよう、最も重要な情報のみを厳選してください**
- **各スライドは必ず1ページに収めてください。コンテンツがはみ出す場合は情報量を削減してください**
- **箇条書きは3-5項目程度に抑え、各項目は50文字以内にしてください**`,
    buildStyleSection(style, layoutRules, userInput.mode),
    buildConstraintsSection(layoutRules),
    buildGeminiCanvasSection(userInput.mode),
    `【実行指示】

**プレビューに適したHTML形式で、すべてのスライドを作成してください。**

**今すぐ「${pattern.title}」タイプの${userInput.slideCount || 1}枚のスライドを作成してください。**

❌ やってはいけないこと：
- 「このようなスライドを作成します」などの説明
- HTMLコードやCSSコード
- スライドの仕様や設計書
- **指定されたフォントサイズを変更すること**

✅ やるべきこと：
- スライドの実際の内容を直接出力する
- タイトル、本文を含める
- **指定されたフォントサイズを厳守する**

**重要**: 説明や前置きなしで、今すぐスライドそのものを出力してください。
**【絶対禁止】フォントサイズを変更しないでください。必ず指定されたサイズを使用してください。**`,
  ];

  const prompt = promptParts.join('\n\n');

  // 単体生成用のアウトライン（指定枚数分生成）
  const slideCount = userInput.slideCount || 1;
  const outline: SlideOutline[] = Array.from({ length: slideCount }, (_, i) => ({
    slideNumber: i + 1,
    title: slideCount === 1 ? pattern.title : `${pattern.title} ${i + 1}`,
    keyPoints: [pattern.guidance],
    notes: `テーマ: ${userInput.theme}\n${userInput.details}`
  }));

  return {
    prompt,
    outline,
    metadata: {
      templateId: template.id,
      styleId: style.id,
      generatedAt: new Date().toISOString(),
      isStepByStep: false,
    },
  };
}

/**
 * 段階的生成モード用のプロンプトを生成
 */
function buildStepByStepPrompts(
  input: PromptInput,
  outline: SlideOutline[],
  style: PromptInput['style'],
  layoutRules: PromptInput['layoutRules'],
  recommendation: SlideCountRecommendation
): GeneratedPrompt {
  const { userInput } = input;
  const stepByStepPrompts: string[] = [];

  // ステップ1: 骨子（アウトライン）生成のプロンプト
  const step1Parts = [
    buildThemeSection(userInput),
    `【出力形式】
以下の形式で、${outline.length}枚分の骨子を出力してください：

\`\`\`
スライド 1: [タイトル]
- [主要ポイント1]
- [主要ポイント2]
- [主要ポイント3]

スライド 2: [タイトル]
- [主要ポイント1]
- [主要ポイント2]
...
\`\`\`

【重要】
- 各スライドのタイトルと主要ポイント（3-5項目）のみを記載
- 実際のスライドコンテンツ（本文や図表）は作成しない
- 全体で${outline.length}枚のスライド構成を提案`,
  ];

  stepByStepPrompts.push(step1Parts.join('\n\n'));

  // ステップ2以降: 各スライドグループの詳細生成
  // スライドを3-4枚ずつのグループに分割
  const groupSize = 3;
  const groups = Math.ceil(outline.length / groupSize);

  for (let i = 0; i < groups; i++) {
    const startIdx = i * groupSize;
    const endIdx = Math.min(startIdx + groupSize, outline.length);
    const groupSlides = outline.slice(startIdx, endIdx);

    const step2Parts = [
      buildThemeSection(userInput),
      buildStyleSection(style, layoutRules, userInput.mode),
      `【対象スライド】
${groupSlides.map(s => `スライド${s.slideNumber}: ${s.title}`).join('\n')}

【骨子（参照用）】
先ほど作成した骨子をもとに、詳細なスライドコンテンツを作成してください。`,
      buildConstraintsSection(layoutRules),
      buildGeminiCanvasSection(userInput.mode),
      `【出力形式】
各スライドを以下の形式で出力してください：

\`\`\`
---
スライド ${startIdx + 1}/${outline.length}

## [スライドタイトル]

[本文内容：箇条書き、表、図解など]
---
\`\`\`

【実行指示】
スライド${startIdx + 1}〜${endIdx}の詳細なコンテンツを、上記のスタイル規定に従って作成してください。`,
    ];

    stepByStepPrompts.push(step2Parts.join('\n\n'));
  }

  // 最初のプロンプト（骨子生成）を主プロンプトとして返す
  return {
    prompt: stepByStepPrompts[0],
    outline,
    metadata: {
      templateId: input.template.id,
      styleId: input.style.id,
      generatedAt: new Date().toISOString(),
      recommendedSlideCount: recommendation.recommended,
      isStepByStep: true,
    },
    stepByStepPrompts,
  };
}

/**
 * 役割定義セクション
 */
function buildRoleSection(slideCount: number, mode?: string): string {
  const blueColorWarning = mode === 't3' ? '\n- **本文テキストに青色を使用せず、必ずデフォルトテキスト色（グレー系）を使用してください**' : '';

  return `Canvas機能をつかってスライドを作成してください。

あなたはプレゼンテーションスライド作成の専門家です。

以下に示すテーマと詳細情報をもとに、${slideCount}枚のプレゼンテーションスライドの内容を考えて、実際のスライドをCanvas機能で今すぐ作成してください。

**【最重要】プロンプト文を出力するのではなく、実際のスライドそのものを${slideCount}枚作成してください。**

【絶対に守ること】
❌ コードやドキュメントを書かないでください
❌ スライドの作り方や仕様を説明しないでください
❌ 「以下のようなスライドを作成します」などの前置きは不要です
✅ 実際のスライドの内容そのものを、今すぐ出力してください

【重要な制約】
- HTML/CSS/JavaScriptコードは一切書かないでください
- ナビゲーション要素（次へ/前へボタン、ページ送り）は含めないでください
- インタラクティブな要素（ボタン、フォーム）は使用しないでください
- **【最重要】各スライドは必ず1ページに収めてください**（ページをまたぐことは絶対に避けてください）
- **【最重要】指定されたフォントサイズを絶対に変更しないでください**（タイトル、小タイトル、本文すべて）
- **【最重要】コンテンツがはみ出しそうな場合は、フォントサイズを小さくするのではなく、情報量を削減してください**
- **【最重要】情報を詰め込みすぎず、余白を確保してください。読みやすさが最優先です**${blueColorWarning}
- 各スライドは独立したページとして作成してください
- Googleスライドにエクスポート可能な形式で作成してください`;
}

/**
 * テーマ・内容セクション
 */
function buildThemeSection(userInput: { theme: string; details: string; targetAudience?: string; additionalNotes?: string }): string {
  let section = `「${userInput.theme}」について、スライドを作成してください。`;

  if (userInput.details) {
    section += `\n\n【詳細情報】\n${userInput.details}`;
  }

  if (userInput.targetAudience) {
    section += `\n\n【参考情報】対象者について:\n${userInput.targetAudience}\n※この対象者情報は、スライドの内容や表現レベルを調整するための参考情報です。\n※スライド上に「対象者: ○○」と直接表示しないでください。\n※この情報を踏まえて、適切な専門性レベルと表現方法でコンテンツを作成してください。`;
  }

  if (userInput.additionalNotes) {
    section += `\n\n【補足事項】\n${userInput.additionalNotes}`;
  }

  return section;
}

/**
 * スタイル規定セクション
 */
function buildStyleSection(style: PromptInput['style'], layoutRules: PromptInput['layoutRules'], mode?: string): string {
  const sizes = style.sizes as any;
  const colors = style.colors as any;

  // フォントサイズセクション
  let fontSizeSection = `【フォントサイズ】（重要：必ずpxで指定してください）
**【最重要】以下のフォントサイズは厳守してください。絶対に変更しないでください**

- **大見出し（タイトルスライドのタイトル）: ${sizes.titleSlide || style.sizes.titleSlide}**（厳守）
- **スライドタイトル（各ページのタイトル）: ${sizes.slideTitle || style.sizes.slideTitle}**（厳守）`;

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

  fontSizeSection += `\n\n**【絶対禁止】フォントサイズの変更について：**
- **タイトルスライドのタイトルフォントサイズを変更しないでください**
- **各スライドのタイトルフォントサイズを変更しないでください**
- **コンテンツがはみ出す場合は、フォントサイズを小さくするのではなく、情報量を削減してください**
- **指定されたフォントサイズは、Googleスライドへのエクスポート用に最適化されています**
- **フォントサイズを変更すると、エクスポート後のレイアウトが崩れます**`;

  // カラーセクション
  let colorSection = `- カラースキーム: ${style.name}
  - **デフォルトテキスト色: ${style.colors.text}（通常の白背景上のテキスト）**
  - **タイトル色: ${colors.titleColor || '#000000'}（タイトルスライドおよびページタイトルは黒色、濃い背景の場合は白色）**
  - **白色テキスト: #FFFFFF（濃い背景上のテキスト用）**
  - 背景: ${style.colors.background}
  - メインカラー: ${style.colors.primary}（装飾に使用、タイトルには使用しない）
  - サブカラー: ${style.colors.secondary}（アクセントに使用）`;

  if (colors.pointRed) {
    colorSection += `\n  - ポイント（赤）: ${colors.pointRed}（強調時に使用、#f00ではなく落ち着いた赤）`;
  }
  if (colors.sectionDividerGray) {
    colorSection += `\n  - セクション区切り（背景）: ${colors.sectionDividerGray}（章タイトルの背景色）`;
  }

  const blueColorRules = mode === 't3'
    ? `\n  - **青色（${style.colors.primary}）は装飾のみに使用し、タイトルや本文には絶対に使用しないでください**
  - **本文テキストに青色を使わないでください。必ずデフォルトテキスト色（${style.colors.text}）を使用してください**`
    : '';

  colorSection += `\n\n【色使用の原則】
  - **【最重要】タイトルスライドおよびページタイトル: 必ず黒色（${colors.titleColor || '#000000'}）を使用してください（濃い背景の場合のみ白色）**
  - **【最重要】通常スライド（白背景）の本文: 必ず「デフォルトテキスト色（${style.colors.text}）」を使用してください**
  - 濃い背景（セクション区切りなど）の上のテキスト: 必ず「白色（#FFFFFF）」を使用
  - 強調箇所のみ: ポイント（赤）を使用${blueColorRules}
  - **背景色とテキスト色のコントラストを必ず確保する**（見本スライド参照）`;

  return `【スタイル規定】
- スライドサイズ: ${layoutRules.aspectRatio}
- フォント: ${style.font.family} (代替: ${style.font.fallback})
${colorSection}

${fontSizeSection}

【レイアウト・配置ルール】
- **【最重要】タイトルスライド: タイトルのみを左寄せ・縦方向中央揃えで配置。サブタイトル、ロゴ、担当者名などは含めない**
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
- **【最重要】各スライドは必ず1ページに収めてください。ページをまたぐことは絶対に避けてください**
- **【最重要】コンテンツがはみ出す場合は、必ず以下の対策を実施してください：**
  1. **箇条書きの項目数を減らす（最大${layoutRules.bulletPoints.max}項目）**
  2. **各項目の文字数を削減する（${layoutRules.bulletPoints.characterLimit}文字以内厳守）**
  3. **【絶対禁止】フォントサイズを小さくすることは絶対にしないでください。必ず情報量を削減してください**
  4. **詳細な説明は省略し、キーワードやポイントのみ記載する**
  5. **余白を確保し、読みやすさを優先する**
- **【絶対禁止】フォントサイズの変更について：**
  - **タイトルスライドのタイトルフォントサイズを変更することは絶対に禁止です**
  - **各スライドのタイトルフォントサイズを変更することは絶対に禁止です**
  - **本文のフォントサイズを変更することは絶対に禁止です**
  - **指定されたフォントサイズを厳守してください**
- 1スライドあたりの文字数: ${layoutRules.textLimits.bodyPerSlide}文字以内（厳守）
- スライドタイトル: ${layoutRules.textLimits.slideTitle}文字以内
- 専門用語を使う場合は必ず説明を添える
- 視覚的に読みやすいレイアウトを心がける
- **情報を詰め込みすぎず、1スライド1メッセージを原則とする（最重要）**
- **箇条書きは簡潔に、各項目は${layoutRules.bulletPoints.characterLimit}文字以内（厳守）**
- **内容が多い場合は、文字数を大幅に削減するか、次のスライドに分割してください**
- **文字がスライドからはみ出すことは絶対に許されません。はみ出しそうな場合は必ず情報を削減してください**`;
}

/**
 * Gemini Canvas → Googleスライド エクスポート対応セクション
 */
function buildGeminiCanvasSection(mode?: string): string {
  const blueColorRules = mode === 't3'
    ? `\n- 青色は装飾のみに使用し、タイトルや本文には絶対に使用しないでください
- 本文は必ずデフォルトテキスト色（グレー系）を使用してください`
    : '';

  const titleDecorationRules = mode === 't3'
    ? `\n- **【ティースリーモード限定】ページタイトル行に対して、線や図形で装飾を入れないでください。具体的には以下を禁止:**
  - **図形機能を使った装飾（縦線、横線、矩形、図形要素など）**
  - **タイトル文字の左側に配置される縦線（テキスト記号: | ┃ ▌ や、図形で描画される線）**
  - **タイトルを囲む枠線やボーダー（テキストまたは図形）**
  - **タイトルの上下に配置される横線やバー（テキストまたは図形）**
  - **タイトル前後の記号装飾（●、■、◆など）**
  - **タイトル行は純粋なテキストのみで構成してください**`
    : '';

  return `【重要：Gemini Canvas → Googleスライドエクスポートの注意事項】

▼ スライドの作成方法（最重要）
- **シンプルなプレゼンテーションスライドとして作成**してください
- **HTML、CSS、JavaScriptコードを書かないでください**
- **ナビゲーション要素（次へ/前へボタン、ページ送り、インデックスなど）は含めないでください**
- **インタラクティブな要素（ボタン、フォーム、アニメーションなど）は使用しないでください**
- 各スライドは独立したページとして作成してください
- **【最重要】各スライドは必ず1ページに収めてください**（ページをまたぐことは絶対に避けてください）
- **【最重要】コンテンツがはみ出しそうな場合は、フォントを小さくするのではなく、必ず情報量を削減してください**
- **【最重要】情報を詰め込みすぎず、余白を確保してください。読みやすさが最優先です**
- Googleスライドにエクスポート可能なシンプルなレイアウトを使用してください${titleDecorationRules}

▼ テキスト色について（重要）
- **【最重要】タイトルスライドおよびページタイトル: 必ず黒色（#000000）を使用してください（濃い背景の場合のみ白色）**
- **【最重要】白背景のスライドの本文では「デフォルトテキスト色」を使用してください**${mode === 't3' ? '\n- **【最重要】本文テキストに青色を絶対に使用しないでください**' : ''}
- **濃い背景（セクション区切りなど）では白色（#FFFFFF）を使用**してください${blueColorRules}
- 背景色に応じて適切なテキスト色を選択し、十分なコントラストを確保してください

▼ フォントサイズについて（最重要）
- 上記で指定したフォントサイズは「px（ピクセル）」単位です
- pt（ポイント）ではなく、必ずpx単位で指定してください
- この数値は、Googleスライドへのエクスポート後に正しいサイズになるよう調整済みです
- **【絶対禁止】フォントサイズの変更について：**
  - **タイトルスライドのタイトルフォントサイズを絶対に変更しないでください**
  - **各スライドのタイトル（小タイトル）のフォントサイズを絶対に変更しないでください**
  - **本文のフォントサイズを絶対に変更しないでください**
  - **コンテンツがはみ出す場合でも、フォントサイズを小さくせず、必ず情報量を削減してください**
  - **指定されたフォントサイズを厳守してください。変更するとエクスポート後のレイアウトが崩れます**

▼ レイアウトの原則
- **【最重要】タイトルスライド: タイトルのみを左寄せ・縦方向中央揃えで配置。サブタイトル、ロゴ、担当者名などは含めない**
- シンプルなレイアウトを使用（複雑な図形配置は避ける）
- アニメーション効果は使用しない
- 画像を使う場合は説明テキストも必ず添える
- テーブルは3列×5行以内に収める
- 表が複数ページにわたる場合、位置を揃える

▼ テキスト配置の徹底
- **【最重要】タイトルスライド: タイトルのみを左寄せ・縦方向中央揃えで配置**
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
- ナビゲーション要素が含まれていないか
- 白背景のテキストがデフォルトテキスト色（#434343）になっているか
- 濃い背景のテキストが白色（#FFFFFF）になっているか
- 背景とテキストのコントラストが十分に確保されているか
- フォントサイズが意図通りか
- 表の位置がズレていないか
- テキストの配置（左揃え）が保たれているか`;
}

/**
 * 出力例セクション
 */
function buildOutputExampleSection(): string {
  return `【出力形式の例】

各スライドを以下のような形式で出力してください：

\`\`\`
---
スライド 1/${'{スライド総数}'}

# [スライドタイトル]

[副題や発表者情報など]
---

---
スライド 2/${'{スライド総数}'}

## [スライドタイトル]

- [箇条書き項目1]
- [箇条書き項目2]
- [箇条書き項目3]
---
\`\`\``;
}

/**
 * 実行指示セクション
 */
function buildExecutionSection(slideCount: number): string {
  return `【実行指示】

**プレビューに適したHTML形式で、すべてのスライドを作成してください。**

**今すぐ${slideCount}枚のスライドコンテンツを作成してください。**

❌ やってはいけないこと：
- 「このようなスライドを作成します」などの説明
- HTMLコードやCSSコード
- スライドの仕様や設計書
- メタ情報やドキュメント
- **指定されたフォントサイズを変更すること**

✅ やるべきこと：
- 各スライドの実際の内容を直接出力する
- スライド番号、タイトル、本文（箇条書き、表など）を含める
- 必要に応じてスピーカーノートを含める
- **指定されたフォントサイズを厳守する**

**重要**: 説明や前置きなしで、今すぐスライドそのものを出力してください。
**【絶対禁止】フォントサイズを変更しないでください。必ず指定されたサイズを使用してください。**`;
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
