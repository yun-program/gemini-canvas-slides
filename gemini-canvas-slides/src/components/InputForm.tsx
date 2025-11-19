import { useState, useEffect } from 'react';
import FileUploader from './FileUploader';
import type { UserInput, AppMode, T3SubMode, Template } from '../types';
import { recommendSlideCount } from '../services/promptBuilder';

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  mode: AppMode;
  t3SubMode?: T3SubMode;
  templates: Template[];
}

export default function InputForm({ onSubmit, mode, t3SubMode, templates }: InputFormProps) {
  const [theme, setTheme] = useState('');
  const [details, setDetails] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [slideCount, setSlideCount] = useState<number | undefined>(undefined);
  const [useStepByStep, setUseStepByStep] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState('');

  const [recommendation, setRecommendation] = useState<{
    recommended: number;
    reason: string;
    minSuggested: number;
    maxSuggested: number;
  } | null>(null);

  // ティースリーモードの単体生成時のパターン一覧
  const t3Patterns = mode === 't3' && t3SubMode === 'single' && templates.length > 0
    ? templates.find(t => t.id === 'corporate-training-full')?.structure || []
    : [];

  // 詳細情報が変更されたら推奨スライド枚数を再計算
  useEffect(() => {
    if (details || additionalNotes) {
      const rec = recommendSlideCount({ theme, details, additionalNotes });
      setRecommendation(rec);
      // ユーザーがまだスライド枚数を設定していない場合は推奨値を設定
      if (slideCount === undefined) {
        setSlideCount(rec.recommended);
      }
    }
  }, [details, additionalNotes, theme, slideCount]);

  const handleFilesProcessed = (content: string) => {
    // ファイルの内容を詳細情報に追加
    setDetails(prev => {
      if (prev) {
        return `${prev}\n\n---\n\n${content}`;
      }
      return content;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: UserInput = {
      theme,
      details,
      targetAudience: targetAudience || undefined,
      additionalNotes: additionalNotes || undefined,
      slideCount: slideCount || recommendation?.recommended || 5,
      mode,
      t3SubMode,
    };

    // 汎用モードのみ段階的生成を使用可能
    if (mode === 'general') {
      input.useStepByStep = useStepByStep;
    }

    // ティースリーモードの単体生成時
    if (mode === 't3' && t3SubMode === 'single' && selectedPattern) {
      input.selectedPattern = selectedPattern;
      input.slideCount = 1; // 単体生成は1枚のみ
    }

    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ファイルアップロード */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ファイルアップロード（オプション）
        </label>
        <FileUploader onFilesProcessed={handleFilesProcessed} />
        <p className="mt-2 text-xs text-gray-500">
          PDF、Word、テキスト、画像ファイルから情報を取り込めます。内容は「詳細情報」に追加されます。
        </p>
      </div>

      <div>
        <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 mb-2">
          テーマ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="例: 中小企業向けDX推進"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-gray-700 mb-2">
          詳細情報 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="スライドに含めたい内容、伝えたいメッセージ、重要なポイントなどを記入してください。"
          required
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
        <p className="mt-1 text-xs text-gray-500">
          できるだけ具体的に記入してください。キーワードだけでなく、文脈や背景も含めると良いプロンプトが生成されます。
        </p>
      </div>

      <div>
        <label htmlFor="targetAudience" className="block text-sm font-semibold text-gray-700 mb-2">
          対象者（オプション）
        </label>
        <input
          type="text"
          id="targetAudience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="例: 経営者、新入社員、一般消費者"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="additionalNotes" className="block text-sm font-semibold text-gray-700 mb-2">
          補足事項（オプション）
        </label>
        <textarea
          id="additionalNotes"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="特別な注意事項、避けたい表現、強調したいポイントなど"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      {/* ティースリーモードの単体生成時：パターン選択 */}
      {mode === 't3' && t3SubMode === 'single' && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <label htmlFor="pattern" className="block text-sm font-semibold text-gray-700 mb-2">
            スライドパターンを選択 <span className="text-red-500">*</span>
          </label>
          <select
            id="pattern"
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">選択してください</option>
            {t3Patterns.map((pattern, index) => (
              <option key={index} value={pattern.type}>
                {pattern.title} - {pattern.guidance}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-600">
            14種類のデザインパターンから1つを選んで、1枚のスライドを生成します。
          </p>
        </div>
      )}

      {/* スライド枚数の設定（セット生成時のみ） */}
      {!(mode === 't3' && t3SubMode === 'single') && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label htmlFor="slideCount" className="block text-sm font-semibold text-gray-700 mb-2">
            スライド枚数
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              id="slideCount"
              value={slideCount || ''}
              onChange={(e) => setSlideCount(e.target.value ? parseInt(e.target.value) : undefined)}
              min="3"
              max="20"
              placeholder="自動推奨"
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">枚</span>
          </div>
          {recommendation && (
            <div className="mt-3 text-sm">
              <p className="text-blue-700 font-medium">
                💡 推奨: {recommendation.recommended}枚
              </p>
              <p className="text-gray-600 mt-1">{recommendation.reason}</p>
              <p className="text-gray-500 text-xs mt-1">
                推奨範囲: {recommendation.minSuggested}〜{recommendation.maxSuggested}枚
              </p>
            </div>
          )}
        </div>
      )}

      {/* 段階的生成モード（汎用モードのみ） */}
      {mode === 'general' && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="useStepByStep"
              checked={useStepByStep}
              onChange={(e) => setUseStepByStep(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="useStepByStep" className="block text-sm font-semibold text-gray-700">
                段階的生成モードを使用
              </label>
              <p className="mt-1 text-xs text-gray-600">
                情報量が多い場合におすすめ。最初に骨子を生成し、その後各スライドの詳細を段階的に作成します。
                Geminiが混乱せず、高品質なスライドを生成できます。
              </p>
              {useStepByStep && (
                <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                  <strong>📝 使い方:</strong>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>ステップ1のプロンプトで骨子を生成</li>
                    <li>生成された骨子を確認</li>
                    <li>ステップ2以降のプロンプトで各スライドの詳細を生成</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!theme || !details || (mode === 't3' && t3SubMode === 'single' && !selectedPattern)}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        プロンプトを生成
      </button>
    </form>
  );
}
