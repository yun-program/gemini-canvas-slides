import { useState } from 'react';
import { SlidePreview } from './components/SlidePreview';
import { SpeakerNotes } from './components/SpeakerNotes';
import { generateSlide } from './services/slideGenerator';
import type { Slide } from './types';

function App() {
  const [content, setContent] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [slide, setSlide] = useState<Slide | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('記事やノートの内容を入力してください');
      return;
    }

    if (!apiKey.trim()) {
      setError('Claude API Keyを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generatedSlide = await generateSlide({ content, apiKey });
      setSlide(generatedSlide);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スライドの生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            研修スライド自動生成ツール
          </h1>
          <p className="text-gray-600">
            記事やノートを入力すると、研修用スライドを自動生成します
          </p>
        </header>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            {/* API Key Input */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700 mb-2">
                Claude API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                API Keyは <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a> で取得できます
              </p>
            </div>

            {/* Content Input */}
            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                記事・ノートの内容
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="研修で扱いたい記事やノートの内容をここに貼り付けてください..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                'スライドを生成'
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {slide && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                スライドプレビュー
              </h2>
              <SlidePreview slide={slide} />
            </div>

            <div>
              <SpeakerNotes notes={slide.speakerNotes} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
