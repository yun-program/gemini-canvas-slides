import { useState } from 'react';
import type { GeneratedPrompt } from '../types';
import { formatOutlineAsMarkdown } from '../services/promptBuilder';

interface PromptDisplayProps {
  result: GeneratedPrompt;
}

export default function PromptDisplay({ result }: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [pastedOutline, setPastedOutline] = useState('');

  const isStepByStep = result.metadata.isStepByStep && result.stepByStepPrompts;
  const prompts = isStepByStep
    ? [result.stepByStepPrompts!.outlinePrompt, result.stepByStepPrompts!.detailPrompt]
    : [result.prompt];

  // 骨子が入力されている場合は、プレースホルダーを置き換え
  let currentPrompt = prompts[currentStep];
  if (isStepByStep && currentStep === 1 && pastedOutline.trim()) {
    // プレースホルダー部分を検出して置き換え
    const placeholderPattern = /={5,}\n【ここに生成された骨子を貼り付けてください】[\s\S]*?={5,}/;
    currentPrompt = currentPrompt.replace(placeholderPattern, `=====================\n${pastedOutline.trim()}\n=====================`);
  }

  const handleCopy = async (text?: string) => {
    try {
      await navigator.clipboard.writeText(text || currentPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const handleCopyOutline = async () => {
    try {
      const markdown = formatOutlineAsMarkdown(result.outline);
      await navigator.clipboard.writeText(markdown);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 情報バナー */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">プロンプト生成完了</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <p>📊 スライド枚数: <strong>{result.outline.length}枚</strong></p>
              {result.metadata.recommendedSlideCount && (
                <p>💡 推奨枚数: {result.metadata.recommendedSlideCount}枚</p>
              )}
              {isStepByStep && (
                <p className="text-amber-700">
                  🔄 段階的生成モード: 骨子確認後にスライド生成
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 骨子セクション */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              スライド骨子
            </h3>
            <button
              onClick={() => setShowOutline(!showOutline)}
              className="text-white hover:text-blue-100 transition-colors"
            >
              {showOutline ? '折りたたむ' : '展開する'}
            </button>
          </div>
        </div>

        {showOutline && (
          <div className="p-6">
            <div className="space-y-4">
              {result.outline.map((slide) => (
                <div key={slide.slideNumber} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800">
                    {slide.slideNumber}. {slide.title}
                  </h4>
                  {slide.keyPoints.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      {slide.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleCopyOutline}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              骨子をMarkdown形式でコピー
            </button>
          </div>
        )}
      </div>

      {/* プロンプトセクション */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Gemini用プロンプト
              {isStepByStep && (
                <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                  段階的生成
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="p-6">
          {/* ステップ選択タブ（段階的生成モードの場合） */}
          {isStepByStep && (
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setCurrentStep(0)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    currentStep === 0
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📝 骨子生成プロンプト
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    currentStep === 1
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✏️ スライド生成プロンプト
                </button>
              </div>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  {currentStep === 0 ? (
                    <>
                      <strong>📝 骨子生成プロンプト：</strong> このプロンプトでスライドの骨子（各スライドのタイトルと主要ポイント）を生成します。
                      生成された骨子を確認・編集してから、次のステップに進んでください。
                    </>
                  ) : (
                    <>
                      <strong>✏️ スライド生成プロンプト：</strong> 下のテキストエリアにGeminiで生成された骨子を貼り付けてください。
                      自動的にプロンプトに組み込まれます。全スライドを一括生成することでデザインが統一されます。
                    </>
                  )}
                </p>
              </div>

              {/* 骨子入力エリア（スライド生成プロンプトタブの場合） */}
              {currentStep === 1 && (
                <div className="mt-3">
                  <label htmlFor="outline-input" className="block text-sm font-semibold text-gray-800 mb-2">
                    生成された骨子を貼り付け
                  </label>
                  <textarea
                    id="outline-input"
                    value={pastedOutline}
                    onChange={(e) => setPastedOutline(e.target.value)}
                    placeholder="Geminiで生成された骨子をここに貼り付けてください&#10;&#10;例：&#10;スライド 1: タイトルスライド&#10;- 主要ポイント1&#10;- 主要ポイント2&#10;&#10;スライド 2: 概要&#10;- ポイント1&#10;- ポイント2"
                    className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-vertical"
                  />
                  {pastedOutline.trim() && (
                    <p className="mt-2 text-xs text-green-600 font-medium">
                      ✅ 骨子が入力されました。下のプロンプトに自動的に組み込まれています。
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {currentPrompt}
            </pre>
          </div>

          <button
            onClick={() => handleCopy()}
            className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'コピーしました!' : 'このプロンプトをコピー'}
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              次のステップ
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              {isStepByStep ? (
                <>
                  <li>「📝 骨子生成プロンプト」タブでプロンプトをコピーして Gemini で実行</li>
                  <li>生成された骨子を確認・必要に応じて編集</li>
                  <li>「✏️ スライド生成プロンプト」タブに切り替え</li>
                  <li>生成された骨子を上のテキストエリアに貼り付け（自動的にプロンプトに組み込まれます）</li>
                  <li>完成したプロンプトをコピーして Gemini で実行（全スライド一括生成でデザイン統一！）</li>
                  <li>生成されたスライドをGoogleスライドにエクスポート</li>
                </>
              ) : (
                <>
                  <li>上記のプロンプトをコピーする</li>
                  <li>Gemini (gemini.google.com) を開く</li>
                  <li>コピーしたプロンプトを貼り付けて実行</li>
                  <li>生成されたスライドをGoogleスライドにエクスポート</li>
                </>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
