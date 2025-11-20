import { useState } from 'react';
import InputForm from './components/InputForm';
import StyleSettings from './components/StyleSettings';
import PromptDisplay from './components/PromptDisplay';
import { buildPrompt } from './services/promptBuilder';
import type { UserInput, GeneratedPrompt, TemplateConfig, StyleConfig, AppMode, SubMode, AccentColors } from './types';

// 設定ファイルのインポート
import templatesData from '../config/templates.json';
import stylesData from '../config/styles.json';
import templatesCorporateData from '../config/templates_corporate.json';
import stylesCorporateData from '../config/styles_corporate.json';

function App() {
  // モード管理
  const [appMode, setAppMode] = useState<AppMode>('general');
  const [subMode, setSubMode] = useState<SubMode>('set'); // 両モード共通のサブモード

  // アクセントカラーの管理（デフォルトは青系）
  const [customAccentColors, setCustomAccentColors] = useState<AccentColors>({
    main: '#2563EB',
    sub: '#60A5FA',
  });

  // 汎用モード用のテンプレート
  const generalTemplates = (templatesData as TemplateConfig).templates;
  const generalStyles = (stylesData as StyleConfig).styles;
  const generalLayoutRules = (stylesData as StyleConfig).layoutRules;

  // ティースリーモード用のテンプレート
  const t3Templates = (templatesCorporateData as TemplateConfig).templates;
  const t3Styles = (stylesCorporateData as StyleConfig).styles;
  const t3LayoutRules = (stylesCorporateData as StyleConfig).layoutRules;

  // 現在のモードに応じたテンプレートとスタイルを取得
  const currentTemplates = appMode === 'general' ? generalTemplates : t3Templates;
  const currentStyles = appMode === 'general' ? generalStyles : t3Styles;
  const currentLayoutRules = appMode === 'general' ? generalLayoutRules : t3LayoutRules;

  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplates[0].id);
  const [selectedStyleId, setSelectedStyleId] = useState(currentStyles[0].id);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // モード変更時にテンプレートとスタイルをリセット
  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
    const newTemplates = mode === 'general' ? generalTemplates : t3Templates;
    const newStyles = mode === 'general' ? generalStyles : t3Styles;
    setSelectedTemplateId(newTemplates[0].id);
    setSelectedStyleId(newStyles[0].id);
    setGeneratedPrompt(null);
  };

  const handleSubmit = async (userInput: UserInput) => {
    const template = currentTemplates.find(t => t.id === selectedTemplateId);
    const style = currentStyles.find(s => s.id === selectedStyleId);

    if (!template || !style) {
      console.error('テンプレートまたはスタイルが見つかりません');
      return;
    }

    // ローディング開始
    setIsGenerating(true);
    setGeneratedPrompt(null);

    // 少し遅延を入れてローディングを表示
    await new Promise(resolve => setTimeout(resolve, 500));

    // モード情報とアクセントカラーをuserInputに追加
    const inputWithMode = {
      ...userInput,
      mode: appMode,
      subMode: subMode,
      t3SubMode: subMode, // 後方互換性のため
      customAccentColors,
    };

    const result = buildPrompt({
      template,
      style,
      layoutRules: currentLayoutRules,
      userInput: inputWithMode,
    });

    setGeneratedPrompt(result);
    setIsGenerating(false);

    // 結果セクションまでスクロール
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Gemini Canvas Slide Prompt Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Gemini用のスライド作成プロンプトを自動生成
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            APIキー不要 • 完全無料 • カスタマイズ可能
          </div>
        </header>

        {/* モード選択タブ */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2 bg-white rounded-lg shadow p-2 max-w-md mx-auto">
            <button
              onClick={() => handleModeChange('general')}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-colors ${
                appMode === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              汎用モード
            </button>
            <button
              onClick={() => handleModeChange('t3')}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-colors ${
                appMode === 't3'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ティースリーモード
            </button>
          </div>

          {/* サブモード選択（両モード共通） */}
          <div className="flex justify-center space-x-2 mt-4 max-w-md mx-auto">
            <button
              onClick={() => setSubMode('set')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                subMode === 'set'
                  ? appMode === 'general'
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                    : 'bg-purple-100 text-purple-800 border-2 border-purple-600'
                  : 'bg-white text-gray-600 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              セット生成
            </button>
            <button
              onClick={() => setSubMode('single')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                subMode === 'single'
                  ? appMode === 'general'
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                    : 'bg-purple-100 text-purple-800 border-2 border-purple-600'
                  : 'bg-white text-gray-600 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              単体生成
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム: 設定 */}
          <div className="lg:col-span-1">
            <StyleSettings
              templates={currentTemplates}
              styles={currentStyles}
              selectedTemplateId={selectedTemplateId}
              selectedStyleId={selectedStyleId}
              onTemplateChange={setSelectedTemplateId}
              onStyleChange={setSelectedStyleId}
              mode={appMode}
              customAccentColors={customAccentColors}
              onAccentColorsChange={setCustomAccentColors}
            />
          </div>

          {/* 右カラム: 入力フォーム */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                スライド情報を入力
              </h2>
              <InputForm
                onSubmit={handleSubmit}
                mode={appMode}
                subMode={subMode}
                templates={currentTemplates}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>

        {/* ローディング表示 */}
        {isGenerating && (
          <div id="result-section" className="mt-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    プロンプトを生成中...
                  </h3>
                  <p className="text-gray-600 text-sm">
                    情報量を分析し、スライド枚数に応じた最適なプロンプトを作成しています
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 結果セクション */}
        {generatedPrompt && !isGenerating && (
          <div id="result-section" className="mt-12">
            <PromptDisplay result={generatedPrompt} />
          </div>
        )}

        {/* フッター */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>
            設定ファイル（config/templates.json, config/styles.json）を編集することで、
            テンプレートやスタイルをカスタマイズできます。
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
