import { useState, useEffect } from 'react';
import FileUploader from './FileUploader';
import type { UserInput, AppMode, SubMode, Template, SlidePattern } from '../types';
import { recommendSlideCount } from '../services/promptBuilder';

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  mode: AppMode;
  subMode?: SubMode; // 両モード共通のサブモード
  templates: Template[];
  isGenerating?: boolean;
}

export default function InputForm({ onSubmit, mode, subMode, templates, isGenerating }: InputFormProps) {
  const [theme, setTheme] = useState('');
  const [details, setDetails] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [slideCountInput, setSlideCountInput] = useState('');
  const [slideCount, setSlideCount] = useState<number | undefined>(undefined);
  const [useStepByStep, setUseStepByStep] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [useCustomPatterns, setUseCustomPatterns] = useState(false); // カスタムパターン指定を使用するか
  const [customSlidePatterns, setCustomSlidePatterns] = useState<SlidePattern[]>([]); // カスタムスライドパターン

  const [recommendation, setRecommendation] = useState<{
    recommended: number;
    reason: string;
    minSuggested: number;
    maxSuggested: number;
  } | null>(null);

  // ティースリーモードの単体生成時のパターン一覧（セット生成のカスタムパターンでも使用）
  const t3Patterns = mode === 't3' && templates.length > 0
    ? templates.find(t => t.id === 'corporate-training-full')?.structure || []
    : [];

  // 詳細情報が変更されたら推奨スライド枚数を再計算
  useEffect(() => {
    if (details || additionalNotes) {
      const rec = recommendSlideCount({ theme, details, additionalNotes });
      setRecommendation(rec);
      // ユーザーがまだスライド枚数を設定していない場合のみ推奨値を設定
      // slideCountInputとslideCountを依存配列から除外することで、
      // ユーザーが手動で削除したときに自動設定されるのを防ぐ
      if (slideCountInput === '' && slideCount === undefined) {
        setSlideCount(rec.recommended);
        setSlideCountInput(rec.recommended.toString());
      }
    }
  }, [details, additionalNotes, theme]);

  const handleFilesProcessed = (content: string) => {
    // ファイルの内容を詳細情報に追加
    setDetails(prev => {
      if (prev) {
        return `${prev}\n\n---\n\n${content}`;
      }
      return content;
    });
  };

  const handleSlideCountChange = (value: string) => {
    setSlideCountInput(value);
    // 入力値が有効な数値の場合のみslideCountを更新
    if (value === '') {
      setSlideCount(undefined);
      setCustomSlidePatterns([]);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 3 && num <= 20) {
        setSlideCount(num);
        // カスタムパターン使用時は、スライド枚数に応じてパターン配列を初期化
        if (useCustomPatterns) {
          initializeCustomPatterns(num);
        }
      }
    }
  };

  // カスタムスライドパターンを初期化
  const initializeCustomPatterns = (count: number) => {
    const patterns: SlidePattern[] = [];
    const availablePatterns = t3Patterns;

    for (let i = 1; i <= count; i++) {
      // 既存のパターンがあればそれを保持、なければデフォルトを設定
      const existingPattern = customSlidePatterns.find(p => p.slideNumber === i);
      if (existingPattern) {
        patterns.push(existingPattern);
      } else {
        // デフォルトパターンを設定
        let defaultPattern = availablePatterns.find(p => p.type === 'content-explanation') || availablePatterns[0];
        if (i === 1) {
          // 1枚目は表紙
          defaultPattern = availablePatterns.find(p => p.type === 'title-cover') || availablePatterns[0];
        } else if (i === 2) {
          // 2枚目はアジェンダ
          defaultPattern = availablePatterns.find(p => p.type === 'agenda') || availablePatterns[1];
        } else if (i === count) {
          // 最後はQ&Aまたは連絡先
          defaultPattern = availablePatterns.find(p => p.type === 'qa-workshop' || p.type === 'contact-info') || availablePatterns[availablePatterns.length - 1];
        }

        patterns.push({
          slideNumber: i,
          patternType: defaultPattern.type,
          patternTitle: defaultPattern.title,
        });
      }
    }
    setCustomSlidePatterns(patterns);
  };

  // カスタムパターンが有効化されたときに初期化
  useEffect(() => {
    if (useCustomPatterns && slideCount && customSlidePatterns.length === 0) {
      initializeCustomPatterns(slideCount);
    }
  }, [useCustomPatterns, slideCount]);

  // 個別のスライドパターンを変更
  const handlePatternChange = (slideNumber: number, patternType: string) => {
    const pattern = t3Patterns.find(p => p.type === patternType);
    if (!pattern) return;

    setCustomSlidePatterns(prev =>
      prev.map(p =>
        p.slideNumber === slideNumber
          ? { ...p, patternType: pattern.type, patternTitle: pattern.title }
          : p
      )
    );
  };

  // 個別のスライドの内容指定を変更
  const handleContentGuidanceChange = (slideNumber: number, contentGuidance: string) => {
    setCustomSlidePatterns(prev =>
      prev.map(p =>
        p.slideNumber === slideNumber
          ? { ...p, contentGuidance }
          : p
      )
    );
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
      subMode,
      t3SubMode: subMode, // 後方互換性のため
    };

    // 汎用モードのセット生成時のみ段階的生成を使用可能
    if (mode === 'general' && subMode === 'set') {
      input.useStepByStep = useStepByStep;
    }

    // 単体生成時の処理
    if (subMode === 'single') {
      input.slideCount = 1; // 単体生成は1枚のみ

      // ティースリーモードの単体生成時はパターンを指定
      if (mode === 't3' && selectedPattern) {
        input.selectedPattern = selectedPattern;
      }
    }

    // ティースリーモードのセット生成時：カスタムパターン指定
    if (mode === 't3' && subMode === 'set' && useCustomPatterns && customSlidePatterns.length > 0) {
      input.customSlidePatterns = customSlidePatterns;
    }

    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* テーマ */}
      <div>
        <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 mb-2">
          1. テーマ <span className="text-red-500">*</span>
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
        <p className="mt-1 text-xs text-gray-500">
          スライドのメインテーマを入力してください。
        </p>
      </div>

      {/* 詳細情報 */}
      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-gray-700 mb-2">
          2. 詳細情報 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            subMode === 'single'
              ? "【単体生成モード】テーマに関連する情報のみを入力してください。スライド1枚に収まる程度の情報量が適切です。"
              : "スライドに含めたい内容、伝えたいメッセージ、重要なポイントなどを記入してください。"
          }
          required
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
        {subMode === 'single' ? (
          <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <p className="font-semibold">⚠️ 単体生成モードの注意事項</p>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li><strong>極力指定したテーマに関連する情報のみ</strong>を入力してください</li>
              <li><strong>スライド1枚に収まる程度の情報量</strong>が適切です（目安: 200〜500文字程度）</li>
              <li>テーマから外れる内容が含まれると、生成されるスライドの品質が低下します</li>
            </ul>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            テキストで直接入力するか、下のファイルアップロードから情報を取り込むこともできます。
          </p>
        )}
      </div>

      {/* ファイルアップロード */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📎 ファイルから情報を追加（オプション）
        </label>
        <FileUploader onFilesProcessed={handleFilesProcessed} />
        <p className="mt-2 text-xs text-gray-500">
          PDF、Word、テキスト、画像ファイルから情報を取り込めます。内容は上の「詳細情報」に自動追加されます。
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
      {mode === 't3' && subMode === 'single' && (
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
            15種類のデザインパターンから1つを選んで、1枚のスライドを生成します。
          </p>
        </div>
      )}

      {/* スライド枚数の設定（セット生成時のみ） */}
      {subMode === 'set' && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label htmlFor="slideCount" className="block text-sm font-semibold text-gray-700 mb-2">
            スライド枚数
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              id="slideCount"
              value={slideCountInput}
              onChange={(e) => handleSlideCountChange(e.target.value)}
              min="3"
              max="20"
              placeholder="自動推奨"
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">枚（3〜20枚）</span>
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
          <p className="mt-2 text-xs text-gray-500">
            情報量に応じて自動で推奨枚数が計算されます。推奨より少ない枚数を指定すると、内容が自動的に要約されます。
          </p>
        </div>
      )}

      {/* ティースリーモードのセット生成：カスタムスライドパターン指定 */}
      {mode === 't3' && subMode === 'set' && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3 mb-3">
            <input
              type="checkbox"
              id="useCustomPatterns"
              checked={useCustomPatterns}
              onChange={(e) => setUseCustomPatterns(e.target.checked)}
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="useCustomPatterns" className="block text-sm font-semibold text-gray-700">
                スライドパターンを個別に指定する
              </label>
              <p className="mt-1 text-xs text-gray-600">
                各スライドのパターン（表紙、アジェンダ、Before/Afterなど）を手動で選択できます。
              </p>
            </div>
          </div>

          {useCustomPatterns && slideCount && customSlidePatterns.length > 0 && (
            <div className="mt-4 space-y-3 bg-white p-4 rounded-lg border border-purple-300">
              <h4 className="text-sm font-semibold text-purple-800 mb-3">
                各スライドのパターンと内容を指定（全{slideCount}枚）
              </h4>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {customSlidePatterns.map((pattern) => (
                  <div key={pattern.slideNumber} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-800 min-w-[60px]">
                        {pattern.slideNumber}枚目
                      </span>
                      <select
                        value={pattern.patternType}
                        onChange={(e) => handlePatternChange(pattern.slideNumber, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {t3Patterns.map((p, index) => (
                          <option key={index} value={p.type}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        このスライドに書いてほしい内容（オプション）
                      </label>
                      <textarea
                        value={pattern.contentGuidance || ''}
                        onChange={(e) => handleContentGuidanceChange(pattern.slideNumber, e.target.value)}
                        placeholder="例: DX推進の3つの課題、導入事例（○○社）、費用対効果のグラフなど"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        このスライドで伝えたい具体的な内容を記入すると、AIが的確に生成します
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3 p-2 bg-purple-50 rounded">
                💡 デフォルトで1枚目は表紙、2枚目はアジェンダ、最後はQ&A/連絡先に設定されています。<br />
                各スライドの内容を指定すると、AIが元資料の該当箇所を使って詳細なスライドを生成します。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 段階的生成モード（汎用モードのセット生成時のみ） */}
      {mode === 'general' && subMode === 'set' && (
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
                情報量が多い場合におすすめ。最初に構成を生成し、その後各スライドの詳細を段階的に作成します。
                Geminiが混乱せず、高品質なスライドを生成できます。
              </p>
              {useStepByStep && (
                <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                  <strong>📝 使い方:</strong>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>ステップ1のプロンプトで構成を生成</li>
                    <li>生成された構成を確認</li>
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
        disabled={!theme || !details || (mode === 't3' && subMode === 'single' && !selectedPattern) || isGenerating}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? '生成中...' : 'プロンプトを生成'}
      </button>
    </form>
  );
}
