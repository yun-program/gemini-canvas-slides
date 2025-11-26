// スライド構造の型定義
export interface SlideStructure {
  title: string;
  type: string;
  guidance: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  defaultSlideCount: number;
  structure: SlideStructure[];
}

export interface TemplateConfig {
  templates: Template[];
}

// スタイル定義の型
export interface FontConfig {
  family: string;
  fallback: string;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  text: string;
  textLight: string;
  background: string;
  accent: string;
  // 追加のカラープロパティ（オプション）
  sectionDividerGray?: string;
  titleColor?: string;
  pointRed?: string;
}

export interface SizeConfig {
  titleSlide: string;
  slideTitle: string;
  body: string;
  caption: string;
  // 追加のサイズプロパティ（オプション）
  heading?: string;
  bodySmall?: string;
  citation?: string;
}

export interface Style {
  id: string;
  name: string;
  description: string;
  font: FontConfig;
  colors: ColorConfig;
  sizes: SizeConfig;
  isCustom?: boolean; // カスタムスタイルかどうか
  createdAt?: string; // 作成日時（ISO 8601形式）
}

export interface LayoutRules {
  aspectRatio: string;
  margins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  bulletPoints: {
    min: number;
    max: number;
    characterLimit: number;
  };
  textLimits: {
    slideTitle: number;
    bodyPerSlide: number;
  };
}

export interface StyleConfig {
  styles: Style[];
  layoutRules: LayoutRules;
}

// モード定義
export type AppMode = 'general' | 't3'; // 汎用モード | パターン指定モード
export type SubMode = 'set' | 'single'; // セット生成 | 単体生成（両モード共通）
export type T3SubMode = SubMode; // 後方互換性のため

// アクセントカラー（装飾用）の設定
export interface AccentColors {
  main: string; // メインカラー（例: #2563EB）
  sub: string;  // サブカラー（例: #60A5FA）
}

// スライドパターンの指定（セット生成時のカスタム構成用）
export interface SlidePattern {
  slideNumber: number; // スライド番号（1から始まる）
  patternType: string; // パターンタイプ（例: "title-cover", "agenda"）
  patternTitle: string; // パターン名（例: "表紙（タイトルスライド）"）
  contentGuidance?: string; // このスライドに書いてほしい内容の指定（オプション）
}

// ユーザー入力の型
export interface UserInput {
  theme: string;
  details: string;
  targetAudience?: string;
  additionalNotes?: string;
  slideCount?: number; // カスタムスライド枚数
  useStepByStep?: boolean; // 段階的生成モードを使用するか（汎用モードのセット生成時のみ）
  mode?: AppMode; // 使用するモード
  subMode?: SubMode; // サブモード（セット生成 | 単体生成）両モード共通
  t3SubMode?: T3SubMode; // 後方互換性のため（subModeと同じ）
  selectedPattern?: string; // パターン指定モードの単体生成時に選択されたパターン
  customAccentColors?: AccentColors; // カスタムアクセントカラー
  customSlidePatterns?: SlidePattern[]; // パターン指定モードのセット生成時のカスタムスライドパターン
}

// 構成（アウトライン）の型
export interface SlideOutline {
  slideNumber: number;
  title: string;
  keyPoints: string[];
  notes?: string;
}

// プロンプト生成の入力
export interface PromptInput {
  template: Template;
  style: Style;
  layoutRules: LayoutRules;
  userInput: UserInput;
  customSlides?: SlideOutline[];
}

// 生成されたプロンプト
export interface GeneratedPrompt {
  prompt: string;
  outline: SlideOutline[];
  metadata: {
    templateId: string;
    styleId: string;
    generatedAt: string;
    recommendedSlideCount?: number; // 推奨スライド枚数
    isStepByStep?: boolean; // 段階的生成モードか
  };
  stepByStepPrompts?: {
    outlinePrompt: string; // 構成生成プロンプト
    detailPrompt: string;  // スライド生成プロンプト（構成貼り付け用プレースホルダー付き）
  };
}

// スライド枚数の推奨情報
export interface SlideCountRecommendation {
  recommended: number;
  reason: string;
  minSuggested: number;
  maxSuggested: number;
}
