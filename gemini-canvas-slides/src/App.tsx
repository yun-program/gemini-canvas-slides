import { useState } from 'react';
import InputForm from './components/InputForm';
import StyleSettings from './components/StyleSettings';
import PromptDisplay from './components/PromptDisplay';
import { buildPrompt } from './services/promptBuilder';
import type { UserInput, GeneratedPrompt, TemplateConfig, StyleConfig } from './types';

// 設定ファイルのインポート
import templatesData from '../config/templates.json';
import stylesData from '../config/styles.json';

function App() {
  const templates = (templatesData as TemplateConfig).templates;
  const styles = (stylesData as StyleConfig).styles;
  const layoutRules = (stylesData as StyleConfig).layoutRules;

  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id);
  const [selectedStyleId, setSelectedStyleId] = useState(styles[0].id);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);

  const handleSubmit = (userInput: UserInput) => {
    const template = templates.find(t => t.id === selectedTemplateId);
    const style = styles.find(s => s.id === selectedStyleId);

    if (!template || !style) {
      console.error('テンプレートまたはスタイルが見つかりません');
      return;
    }

    const result = buildPrompt({
      template,
      style,
      layoutRules,
      userInput,
    });

    setGeneratedPrompt(result);

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
        <header className="text-center mb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム: 設定 */}
          <div className="lg:col-span-1">
            <StyleSettings
              templates={templates}
              styles={styles}
              selectedTemplateId={selectedTemplateId}
              selectedStyleId={selectedStyleId}
              onTemplateChange={setSelectedTemplateId}
              onStyleChange={setSelectedStyleId}
            />
          </div>

          {/* 右カラム: 入力フォーム */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                スライド情報を入力
              </h2>
              <InputForm onSubmit={handleSubmit} />
            </div>
          </div>
        </div>

        {/* 結果セクション */}
        {generatedPrompt && (
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
