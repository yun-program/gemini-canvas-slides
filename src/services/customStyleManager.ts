import type { Style } from '../types';

const STORAGE_KEY = 'gemini-canvas-slides-custom-styles';

// デフォルトのフォントサイズ（固定）
const DEFAULT_SIZES = {
  titleSlide: '40pt',
  slideTitle: '32pt',
  body: '24pt',
  caption: '18pt',
};

/**
 * LocalStorageからカスタムスタイルを読み込む
 */
export function loadCustomStyles(): Style[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const styles = JSON.parse(stored) as Style[];
    return styles.filter(s => s.isCustom); // カスタムスタイルのみ
  } catch (error) {
    console.error('カスタムスタイルの読み込みに失敗しました:', error);
    return [];
  }
}

/**
 * カスタムスタイルをLocalStorageに保存
 */
export function saveCustomStyles(styles: Style[]): void {
  try {
    const customStyles = styles.filter(s => s.isCustom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customStyles));
  } catch (error) {
    console.error('カスタムスタイルの保存に失敗しました:', error);
  }
}

/**
 * 新しいカスタムスタイルを作成
 */
export function createCustomStyle(params: {
  name: string;
  description: string;
  fontFamily: string;
  fontFallback: string;
  primary: string;
  secondary: string;
  text: string;
  textLight: string;
  background: string;
  accent: string;
}): Style {
  const id = `custom-${Date.now()}`;

  return {
    id,
    name: params.name,
    description: params.description,
    font: {
      family: params.fontFamily,
      fallback: params.fontFallback,
    },
    colors: {
      primary: params.primary,
      secondary: params.secondary,
      text: params.text,
      textLight: params.textLight,
      background: params.background,
      accent: params.accent,
    },
    sizes: DEFAULT_SIZES, // サイズは固定
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * カスタムスタイルを更新
 */
export function updateCustomStyle(
  currentStyles: Style[],
  styleId: string,
  updates: Partial<Style>
): Style[] {
  return currentStyles.map(style =>
    style.id === styleId
      ? { ...style, ...updates, sizes: DEFAULT_SIZES, isCustom: true }
      : style
  );
}

/**
 * カスタムスタイルを削除
 */
export function deleteCustomStyle(currentStyles: Style[], styleId: string): Style[] {
  return currentStyles.filter(style => style.id !== styleId);
}

/**
 * カスタムスタイル追加
 */
export function addCustomStyle(currentStyles: Style[], newStyle: Style): Style[] {
  // 既存の同じIDのスタイルがあれば上書き、なければ追加
  const existingIndex = currentStyles.findIndex(s => s.id === newStyle.id);
  if (existingIndex >= 0) {
    const updated = [...currentStyles];
    updated[existingIndex] = newStyle;
    return updated;
  }
  return [...currentStyles, newStyle];
}
