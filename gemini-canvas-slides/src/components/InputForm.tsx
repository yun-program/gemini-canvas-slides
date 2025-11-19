import { useState } from 'react';
import type { UserInput } from '../types';

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
}

export default function InputForm({ onSubmit }: InputFormProps) {
  const [theme, setTheme] = useState('');
  const [details, setDetails] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      theme,
      details,
      targetAudience: targetAudience || undefined,
      additionalNotes: additionalNotes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <button
        type="submit"
        disabled={!theme || !details}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        プロンプトを生成
      </button>
    </form>
  );
}
