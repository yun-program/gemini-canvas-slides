import type { PromptInput, GeneratedPrompt, SlideOutline, SlideCountRecommendation, SlidePattern, Template } from '../types';

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
 * テンプレートから構成を生成
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

  // スライド枚数に応じて構成を調整
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

  // subModeまたはt3SubModeを取得（後方互換性のため）
  const subMode = userInput.subMode || userInput.t3SubMode;

  // ティースリーモードのセット生成の場合（新形式）
  if (userInput.mode === 't3' && subMode === 'set') {
    return buildT3SetGenerationPrompt(input, style, layoutRules);
  }

  // ティースリーモードの単体生成の場合
  if (userInput.mode === 't3' && subMode === 'single' && userInput.selectedPattern) {
    return buildSingleSlidePrompt(input, style, layoutRules, userInput.selectedPattern);
  }

  // 汎用モードの単体生成の場合
  if (userInput.mode === 'general' && subMode === 'single') {
    return buildGeneralSingleSlidePrompt(input, style, layoutRules);
  }

  const outline = generateOutline(input);
  const recommendation = recommendSlideCount(userInput);

  // 段階的生成モードの場合（汎用モードのセット生成時のみ）
  if (userInput.mode === 'general' && subMode === 'set' && userInput.useStepByStep) {
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
    `スライドを作成して。

---

## 【役割】

あなたは「分かりやすく整理されたスライド原稿」を作成する専門家です。

---`,
    buildThemeSection(restructuredInput),
    `## 【必要なスライド枚数】

**${outline.length}枚**

---

## 【はみ出し防止ルール】

* 1スライド最大 **${layoutRules.textLimits.bodyPerSlide}文字**
* 箇条書き：**${layoutRules.bulletPoints.min}〜${layoutRules.bulletPoints.max}項目／1項目${layoutRules.bulletPoints.characterLimit}文字以内**
* タイトル：**${layoutRules.textLimits.slideTitle}文字以内**
* フォントサイズは変えない
* 長文の場合は要点のみ抽出して圧縮

---`,
    buildStyleSection(style, layoutRules, userInput.mode, userInput.customAccentColors),
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
 * カスタムスライドパターンのセクションを生成
 */
function buildCustomPatternsSection(customPatterns: SlidePattern[], template: Template): string {
  // テンプレートから全パターン情報を取得
  const patternDetails = template.structure;

  // パターン番号とタイトルのマッピング（全15種類）
  const patternMap: { [key: string]: { number: number; title: string; guidance: string } } = {};
  patternDetails.forEach((p, index) => {
    patternMap[p.type] = {
      number: index + 1,
      title: p.title,
      guidance: p.guidance
    };
  });

  // 各スライドのパターンをリストアップ
  const slideList = customPatterns.map(cp => {
    const pattern = patternMap[cp.patternType];
    const contentNote = cp.contentGuidance ? `\n  → 内容: ${cp.contentGuidance}` : '';
    return `* ${cp.slideNumber}枚目：**${pattern.number}. ${pattern.title}**${contentNote}`;
  }).join('\n');

  return `## 【スライド構成（ユーザー指定）】

以下の順序で、指定されたパターンと内容でスライドを作成してください：

${slideList}

---

## 【利用パターンの詳細】

以下のパターンを使用します：

${customPatterns.map(cp => {
  const pattern = patternMap[cp.patternType];
  const contentGuidance = cp.contentGuidance
    ? `\n\n**【このスライドに含める内容】**\n${cp.contentGuidance}\n\n上記の内容を元資料から抽出・展開して、このパターンに沿ったスライドを作成してください。`
    : '';
  return `### スライド${cp.slideNumber}: ${pattern.number}. **${pattern.title}**

${pattern.guidance}${contentGuidance}`;
}).join('\n\n')}

---`;
}

/**
 * 汎用モードの単体生成用プロンプトを生成
 */
function buildGeneralSingleSlidePrompt(
  input: PromptInput,
  style: PromptInput['style'],
  layoutRules: PromptInput['layoutRules']
): GeneratedPrompt {
  const { template, userInput } = input;

  const promptParts = [
    `スライドを作成して。

---

## 【役割】

あなたは「分かりやすく整理されたスライド原稿」を作成する専門家です。

---`,
    buildThemeSection(userInput),
    `## 【必要なスライド枚数】

**1枚**

---

## 【はみ出し防止ルール】

* 1スライド最大 **${layoutRules.textLimits.bodyPerSlide}文字**
* 箇条書き：**${layoutRules.bulletPoints.min}〜${layoutRules.bulletPoints.max}項目／1項目${layoutRules.bulletPoints.characterLimit}文字以内**
* タイトル：**${layoutRules.textLimits.slideTitle}文字以内**
* フォントサイズは変えない
* 長文の場合は要点のみ抽出して圧縮

---`,
    buildStyleSection(style, layoutRules, userInput.mode, userInput.customAccentColors),
    buildConstraintsSection(layoutRules),
    buildGeminiCanvasSection(userInput.mode),
    `## 【出力形式】

各スライドは次の形式で出力：

1. スライド番号とタイトル
2. 本文（箇条書き・表など）
3. 必要に応じてスピーカーノート

---

## 【禁止事項】

* 説明文・前置き
* HTML／CSSコードの出力
* 設計書の説明

---

**1枚のスライドを作成してください。**`,
  ];

  const prompt = promptParts.join('\n\n');

  // 汎用モードの単体生成用のアウトライン
  const outline: SlideOutline[] = [{
    slideNumber: 1,
    title: userInput.theme,
    keyPoints: ['単体スライド'],
    notes: `テーマ: ${userInput.theme}\n${userInput.details}`
  }];

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
 * ティースリーモードのセット生成用プロンプトを生成（新形式）
 */
function buildT3SetGenerationPrompt(
  input: PromptInput,
  style: PromptInput['style'],
  layoutRules: PromptInput['layoutRules']
): GeneratedPrompt {
  const { template, userInput } = input;
  const slideCount = userInput.slideCount || template.defaultSlideCount;
  const sizes = style.sizes as any;
  const colors = { ...style.colors } as any;

  // カスタムアクセントカラーが指定されている場合は上書き（ティースリーモード専用）
  if (userInput.customAccentColors) {
    colors.primary = userInput.customAccentColors.main;
    colors.secondary = userInput.customAccentColors.sub;
  }

  // カスタムスライドパターンが指定されている場合
  const hasCustomPatterns = userInput.customSlidePatterns && userInput.customSlidePatterns.length > 0;

  // 全15パターンの説明
  const allPatterns = `### 1. **表紙（タイトルスライド）**

* タイトルだけを左寄せ・縦方向中央に１行で配置
* サブタイトル・ロゴ・担当者名は入れない
* **タイトル行は純粋なテキストのみ（図形などでの装飾禁止）**

### 2. **アジェンダ（目次・流れ）**

* タイトル：アジェンダ
* 3〜6項目でプレゼン全体の流れ
* **背景色：${colors.sectionDividerGray}（濃いグレー）**
* **文字色：#FFFFFF（白）・太字**
* **装飾は禁止（線・縦棒・枠線・帯すべて不可）**

### 3. **章タイトル（セクション区切り）**

* **スライド全体の背景を ${colors.sectionDividerGray} に設定（全画面背景）**
* **タイトル文字は背景に直接載せる（図形・帯・ボックスを置かない）**
* **タイトル装飾は禁止（線・縦棒・枠線・帯すべて不可）**
* タイトル文字色は **#FFFFFF**
* ページ番号非表示

### 4. **見出し＋本文（解説）**

* 見出し＋箇条書きや短い段落で構成

### 5. **Before / After（比較）**

* 左：Before（薄色）
* 右：After（強色）

### 6. **実績紹介（ケーススタディ）**

* 写真（文章で指示）＋成果・結果の箇条書き

### 7. **図解（アイコン＋説明）**

* 3〜6ブロックで要点整理

### 8. **Q&A（問いかけ）**

* 大きな質問＋選択肢

### 9. **投票・アンケート型**

* 質問＋選択肢（チェックボックス風）

### 10. **グラフ・数値インフォグラフィック**

* 重要数値の強調（グラフは文章で指示）

### 11. **ステップ説明（工程）**

* 3〜5段階ステップで流れを説明

### 12. **プログラム（表形式）**

* 表は最大3列×5行以内

### 13. **注意事項（ガイドライン）**

* 注意ラベル＋箇条書き

### 14. **連絡先（お問い合わせ）**

* 会社名・担当・メール・URLなどをシンプルに記載

### 15. **画像中心スライド**

* 画像（文章で指示）＋短い説明`;

  const promptParts = [
    `スライドを作成して。

---

## 【役割】

あなたは「分かりやすく整理されたスライド原稿」を作成する専門家です。

---

## 【テーマ】

**${userInput.theme}**`,

    userInput.targetAudience ? `## 【対象者】

**${userInput.targetAudience}**` : '',

    userInput.additionalNotes ? `## 【プレゼンの目的】

**${userInput.additionalNotes}**` : '',

    `## 【必要なスライド枚数】

**${slideCount}枚**

---`,

    userInput.details ? `## 【元となる資料・レポート本文】

以下のテキストを元にスライドを作成してください。

=====================
${userInput.details}
=====================

---` : '',

    // カスタムパターンが指定されている場合とそうでない場合で切り替え
    hasCustomPatterns
      ? buildCustomPatternsSection(userInput.customSlidePatterns!, template)
      : `## 【利用可能なスライドパターン（15種類）】

${allPatterns}

---

## 【スライド構成ルール】

* 1枚目：必ず「表紙」
* 2枚目：可能なら「アジェンダ」
* 最終スライド：**8「Q&A」 または 14「連絡先」**
* 中間スライドは元資料の流れに沿い最適なパターンを選択

---`,

    `## 【はみ出し防止ルール】

* 1スライド最大 **${layoutRules.textLimits.bodyPerSlide}文字**
* 箇条書き：**${layoutRules.bulletPoints.min}〜${layoutRules.bulletPoints.max}項目／1項目${layoutRules.bulletPoints.characterLimit}文字以内**
* タイトル：**${layoutRules.textLimits.slideTitle}文字以内**
* フォントサイズは変えない
* 長文の場合は要点のみ抽出して圧縮

---

## 【スタイル規定】

### ●背景色

* 通常：**#FFFFFF**
* 章タイトル・アジェンダ：**${colors.sectionDividerGray}**

### ●テキスト色（3種のみ）

1. タイトル：${colors.titleColor}（濃色背景では #FFFFFF）
2. 本文：${colors.text}
3. 強調：${colors.pointRed}

### ●アクセントカラー（装飾のみ）

* ${colors.primary}（青）
* ${colors.secondary}（淡青）
  ※本文・タイトルには使わない

### ●フォントサイズ（px｜変更不可）

* タイトル：${sizes.titleSlide}
* 見出し：${sizes.heading}
* 本文：${sizes.body}
* 小本文：${sizes.bodySmall}
* 注釈：${sizes.citation}

---

## 【レイアウト規定】

* 基本は左揃え
* 余白：上下${layoutRules.margins.top}／左右${layoutRules.margins.left}
* テーブルは3列×5行以内
* 複雑な図形禁止

---

## 【出力形式】

各スライドは次の形式で出力：

1. スライド番号とタイトル
2. 本文（箇条書き・表など）
3. 必要に応じてスピーカーノート

---

## 【禁止事項】

* 説明文・前置き
* HTML／CSSコードの出力
* 設計書の説明`
  ];

  const prompt = promptParts.filter(p => p.trim() !== '').join('\n\n');

  // アウトラインは動的に生成されるため、プレースホルダーとして空配列を返す
  const outline: SlideOutline[] = Array.from({ length: slideCount }, (_, i) => ({
    slideNumber: i + 1,
    title: i === 0 ? '表紙' : i === 1 ? 'アジェンダ' : i === slideCount - 1 ? 'まとめ' : `スライド ${i + 1}`,
    keyPoints: ['AIが最適なパターンを選択'],
    notes: ''
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
    `スライドを作成して。

---

## 【役割】

あなたは「分かりやすく整理されたスライド原稿」を作成する専門家です。

---`,
    buildThemeSection(userInput),
    `## 【必要なスライド枚数】

**${userInput.slideCount || 1}枚**

---`,
    `## 【スライドタイプ】

**タイプ: ${pattern.title}**
**用途: ${pattern.guidance}**

このスライドタイプに最適なレイアウトと内容で、${userInput.slideCount || 1}枚のスライドを作成してください。

---`,
    `## 【はみ出し防止ルール】

* 1スライド最大 **${layoutRules.textLimits.bodyPerSlide}文字**
* 箇条書き：**${layoutRules.bulletPoints.min}〜${layoutRules.bulletPoints.max}項目／1項目${layoutRules.bulletPoints.characterLimit}文字以内**
* タイトル：**${layoutRules.textLimits.slideTitle}文字以内**
* フォントサイズは変えない
* 長文の場合は要点のみ抽出して圧縮

---`,
    buildStyleSection(style, layoutRules, userInput.mode, userInput.customAccentColors),
    buildConstraintsSection(layoutRules),
    `## 【出力形式】

各スライドは次の形式で出力：

1. スライド番号とタイトル
2. 本文（箇条書き・表など）
3. 必要に応じてスピーカーノート

---

## 【禁止事項】

* 説明文・前置き
* HTML／CSSコードの出力
* 設計書の説明`,
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

  // ステップ1: 構成（アウトライン）生成のプロンプト
  const outlinePromptParts = [
    `構成を作成して。

---

## 【役割】

あなたは「分かりやすく整理されたスライド原稿」を作成する専門家です。

---`,
    buildThemeSection(userInput),
    `## 【必要なスライド枚数】

**${outline.length}枚**

---

## 【出力形式】

以下の形式で、${outline.length}枚分の構成を出力してください：

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

---

## 【重要】

- 各スライドのタイトルと主要ポイント（3-5項目）のみを記載
- これは構成案です。実際のスライドコンテンツ（詳細な本文や図表）は次のステップで作成します
- 全体で${outline.length}枚のスライド構成を提案

---

## 【禁止事項】

* 説明文・前置き
* HTML／CSSコードの出力
* 設計書の説明`,
  ];

  const outlinePrompt = outlinePromptParts.join('\n\n');

  // ステップ2: スライド生成プロンプト（構成貼り付け用プレースホルダー付き）
  const detailPromptParts = [
    `スライドを作成して。

---

## 【役割】

あなたは「分かりやすく整理されたスライド原稿」を作成する専門家です。

**【最重要】これは段階的生成モードのステップ2です。構成案ではなく、実際のスライドそのものをCanvas機能で作成してください。**

---`,
    buildThemeSection(userInput),
    `## 【必要なスライド枚数】

**${outline.length}枚**

---

## 【スライド構成（確認済み）】

以下の構成に基づいて、**詳細な内容を含む完成版のスライド**をCanvas機能で作成してください。

=====================
【ここに生成された構成を貼り付けてください】

例：
スライド 1: タイトルスライド
- 主要ポイント1
- 主要ポイント2

スライド 2: ○○について
- 主要ポイント1
- 主要ポイント2
...
=====================

**【重要】上記は構成案です。この構成に基づいて、詳細な本文・箇条書き・図表などを含む完成版のスライドを作成してください。構成をそのまま出力するのではなく、各ポイントを展開して詳細なスライドコンテンツにしてください。**

---

## 【はみ出し防止ルール】

* 1スライド最大 **${layoutRules.textLimits.bodyPerSlide}文字**
* 箇条書き：**${layoutRules.bulletPoints.min}〜${layoutRules.bulletPoints.max}項目／1項目${layoutRules.bulletPoints.characterLimit}文字以内**
* タイトル：**${layoutRules.textLimits.slideTitle}文字以内**
* フォントサイズは変えない
* 長文の場合は要点のみ抽出して圧縮

---`,
    buildConstraintsSection(layoutRules),
    buildGeminiCanvasSection(userInput.mode),
    buildOutputExampleSection(),
    buildExecutionSection(outline.length),
  ];

  const detailPrompt = detailPromptParts.join('\n\n');

  // 構成生成プロンプトを主プロンプトとして返す
  return {
    prompt: outlinePrompt,
    outline,
    metadata: {
      templateId: input.template.id,
      styleId: input.style.id,
      generatedAt: new Date().toISOString(),
      recommendedSlideCount: recommendation.recommended,
      isStepByStep: true,
    },
    stepByStepPrompts: {
      outlinePrompt,
      detailPrompt,
    },
  };
}

/**
 * 役割定義セクション
 */
function buildRoleSection(slideCount: number, mode?: string): string {
  return `Canvas機能をつかってスライドを作成してください。

あなたはプレゼンテーションスライド作成の専門家です。

以下に示すテーマと詳細情報をもとに、${slideCount}枚のプレゼンテーションスライドの内容を考えて、実際のスライドをCanvas機能で今すぐ作成してください。

**【最重要】プロンプト文を出力するのではなく、実際のスライドそのものを${slideCount}枚作成してください。**

【絶対に守ること】
❌ コードやドキュメントを書かないでください
❌ スライドの作り方や仕様を説明しないでください
❌ 「以下のようなスライドを作成します」などの前置きは不要です
✅ 実際のスライドの内容そのものを、今すぐ出力してください`;
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
function buildStyleSection(style: PromptInput['style'], layoutRules: PromptInput['layoutRules'], mode?: string, customAccentColors?: { main: string; sub: string }): string {
  const sizes = style.sizes as any;
  const colors = { ...style.colors } as any;

  // カスタムアクセントカラーが指定されている場合は上書き（ティースリーモードのみ）
  if (mode === 't3' && customAccentColors) {
    colors.primary = customAccentColors.main;
    colors.secondary = customAccentColors.sub;
  }

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

  fontSizeSection += `\n\n**【重要】上記のフォントサイズは厳守してください。Googleスライドへのエクスポート用に最適化されています。**`;

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
  - タイトル（タイトルスライド・各ページ）: 黒色（${colors.titleColor || '#000000'}）、濃い背景では白色
  - 白背景の本文: デフォルトテキスト色（${style.colors.text}）
  - 濃い背景の本文: 白色（#FFFFFF）
  - 強調箇所: ポイント（赤）${blueColorRules}
  - 背景色とテキスト色のコントラストを必ず確保する`;

  return `【スタイル規定】
- スライドサイズ: ${layoutRules.aspectRatio}
- フォント: ${style.font.family} (代替: ${style.font.fallback})
${colorSection}

${fontSizeSection}

【レイアウト・配置ルール】
- タイトルスライド: タイトルのみを左寄せ・縦方向中央揃えで配置
- 余白: 上下${layoutRules.margins.top}/${layoutRules.margins.bottom}、左右${layoutRules.margins.left}/${layoutRules.margins.right}
- テキスト配置: 基本は左揃え、テキスト左上の開始位置を揃える
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
- **【最重要】各スライドは必ず1ページに収めてください**
- **【最重要】コンテンツがはみ出す場合の対策：**
  1. 箇条書きの項目数を減らす（最大${layoutRules.bulletPoints.max}項目）
  2. 各項目の文字数を削減する（${layoutRules.bulletPoints.characterLimit}文字以内）
  3. **フォントサイズは変更せず、情報量を削減してください**
  4. 詳細な説明は省略し、キーワードやポイントのみ記載
  5. 余白を確保し、読みやすさを優先
- 1スライドあたりの文字数: ${layoutRules.textLimits.bodyPerSlide}文字以内
- スライドタイトル: ${layoutRules.textLimits.slideTitle}文字以内
- 専門用語を使う場合は説明を添える
- 1スライド1メッセージを原則とする`;
}

/**
 * Gemini Canvas → Googleスライド エクスポート対応セクション
 */
function buildGeminiCanvasSection(mode?: string): string {
  const titleDecorationRules = mode === 't3'
    ? `\n- **【ティースリーモード限定】ページタイトル行に線や図形で装飾を入れないでください**
  - タイトル行は純粋なテキストのみで構成（縦線、枠線、記号装飾などは禁止）`
    : '';

  return `【Gemini Canvas → Googleスライドエクスポート対応】

▼ 作成形式
- HTML、CSS、JavaScriptコードを書かない
- ナビゲーション要素（次へ/前へボタン、ページ送り）を含めない
- インタラクティブな要素（ボタン、フォーム、アニメーション）を使用しない
- 各スライドは独立したページとして作成
- Googleスライドにエクスポート可能なシンプルなレイアウト${titleDecorationRules}

▼ フォントサイズ単位
- 指定したフォントサイズは「px（ピクセル）」単位です
- pt（ポイント）ではなく、px単位で指定してください
- Googleスライドへのエクスポート後に正しいサイズになるよう調整済みです

▼ レイアウト
- シンプルなレイアウトを使用（複雑な図形配置は避ける）
- アニメーション効果は使用しない
- 画像を使う場合は説明テキストも添える
- テーブルは3列×5行以内に収める

▼ 出力形式
各スライドを以下の形式で出力してください：
1. スライド番号とタイトル
2. 本文内容（箇条書き、表、図解など）
3. （必要に応じて）スピーカーノート`;
}

/**
 * 出力例セクション（削除 - buildGeminiCanvasSectionに統合済み）
 */
function buildOutputExampleSection(): string {
  return '';
}

/**
 * 実行指示セクション（汎用）
 */
function buildExecutionSection(slideCount: number): string {
  return `## 【出力形式】

各スライドは次の形式で出力：

1. スライド番号とタイトル
2. 本文（箇条書き・表など）
3. 必要に応じてスピーカーノート

---

## 【禁止事項】

* 説明文・前置き
* HTML／CSSコードの出力
* 設計書の説明

---

**今すぐ${slideCount}枚のスライドを作成してください。**`;
}

/**
 * プロンプトをコピー用テキストとして整形
 */
export function formatPromptForCopy(prompt: string): string {
  return prompt.trim();
}

/**
 * 構成をMarkdown形式で出力
 */
export function formatOutlineAsMarkdown(outline: SlideOutline[]): string {
  const lines = [
    '# スライド構成',
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
