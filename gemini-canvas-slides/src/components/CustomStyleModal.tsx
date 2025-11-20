import { useState } from 'react';
import type { Style } from '../types';

interface CustomStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: Partial<Style>) => void;
  editingStyle?: Style | null; // 編集時に渡される既存スタイル
}

export default function CustomStyleModal({
  isOpen,
  onClose,
  onSave,
  editingStyle,
}: CustomStyleModalProps) {
  const [name, setName] = useState(editingStyle?.name || '');
  const [description, setDescription] = useState(editingStyle?.description || '');
  const [fontFamily, setFontFamily] = useState(editingStyle?.font.family || 'Noto Sans JP');
  const [fontFallback, setFontFallback] = useState(editingStyle?.font.fallback || 'Yu Gothic, sans-serif');
  const [primary, setPrimary] = useState(editingStyle?.colors.primary || '#1E40AF');
  const [secondary, setSecondary] = useState(editingStyle?.colors.secondary || '#3B82F6');
  const [text, setText] = useState(editingStyle?.colors.text || '#1F2937');
  const [textLight, setTextLight] = useState(editingStyle?.colors.textLight || '#6B7280');
  const [background, setBackground] = useState(editingStyle?.colors.background || '#FFFFFF');
  const [accent, setAccent] = useState(editingStyle?.colors.accent || '#DBEAFE');

  const handleSave = () => {
    if (!name.trim()) {
      alert('スタイル名を入力してください');
      return;
    }

    onSave({
      name,
      description,
      font: {
        family: fontFamily,
        fallback: fontFallback,
      },
      colors: {
        primary,
        secondary,
        text,
        textLight,
        background,
        accent,
      },
    });

    // フォームをリセット
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setFontFamily('Noto Sans JP');
    setFontFallback('Yu Gothic, sans-serif');
    setPrimary('#1E40AF');
    setSecondary('#3B82F6');
    setText('#1F2937');
    setTextLight('#6B7280');
    setBackground('#FFFFFF');
    setAccent('#DBEAFE');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingStyle ? 'カスタムスタイルを編集' : 'カスタムスタイルを作成'}
          </h2>

          <div className="space-y-4">
            {/* スタイル名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スタイル名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: マイスタイル"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 私のプレゼン用スタイル"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* フォント設定 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">フォント設定</h3>
              <div className="mb-3 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
                <p className="font-semibold mb-1">💡 フォントの指定方法</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>Google Fonts</strong>を推奨：Noto Sans JP, Roboto, Open Sans等</li>
                  <li><strong>システムフォント</strong>：Arial, Helvetica, Yu Gothic, Meiryo等</li>
                  <li><strong>複数指定</strong>：カンマ区切りで優先順位順に記載（例: Noto Sans JP, Arial）</li>
                  <li><strong>代替フォント</strong>：メインフォントが利用できない場合のフォールバック</li>
                  <li><strong>最後はジェネリック</strong>：sans-serif, serif等で終わらせる</li>
                </ul>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    フォントファミリー（メイン）
                  </label>
                  <input
                    type="text"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    placeholder="例: Noto Sans JP, Roboto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">メインで使用するフォント（複数可、カンマ区切り）</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    代替フォント（フォールバック）
                  </label>
                  <input
                    type="text"
                    value={fontFallback}
                    onChange={(e) => setFontFallback(e.target.value)}
                    placeholder="例: Yu Gothic, Meiryo, sans-serif"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">メインフォントが使えない場合に使用</p>
                </div>
              </div>
            </div>

            {/* カラー設定 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">カラー設定</h3>
              <div className="mb-3 p-3 bg-green-50 rounded-lg text-xs text-gray-700">
                <p className="font-semibold mb-1">🎨 各カラーの役割</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>Primary</strong>：メインカラー（装飾・アクセント用、タイトルには不使用）</li>
                  <li><strong>Secondary</strong>：サブカラー（Primaryの補助、アクセント用）</li>
                  <li><strong>Text</strong>：本文の文字色（通常の白背景上のテキスト）</li>
                  <li><strong>Text Light</strong>：補足テキスト色（注釈・キャプション等）</li>
                  <li><strong>Background</strong>：背景色（通常は白#FFFFFFを推奨）</li>
                  <li><strong>Accent</strong>：薄い背景色（強調エリア等に使用）</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Primary', value: primary, setter: setPrimary, desc: 'メインカラー' },
                  { label: 'Secondary', value: secondary, setter: setSecondary, desc: 'サブカラー' },
                  { label: 'Text', value: text, setter: setText, desc: '本文' },
                  { label: 'Text Light', value: textLight, setter: setTextLight, desc: '補足' },
                  { label: 'Background', value: background, setter: setBackground, desc: '背景' },
                  { label: 'Accent', value: accent, setter: setAccent, desc: '薄い背景' },
                ].map(({ label, value, setter, desc }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {label} <span className="text-gray-500 font-normal">({desc})</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        title={desc}
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 px-2 py-2 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* フォントサイズ（固定）の説明 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">フォントサイズ</h3>
              <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-700">
                <p className="font-semibold mb-1">📏 フォントサイズは固定されています</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>大見出し（タイトルスライド）</strong>：40pt</li>
                  <li><strong>スライドタイトル</strong>：32pt</li>
                  <li><strong>本文</strong>：24pt</li>
                  <li><strong>引用・注釈</strong>：18pt</li>
                </ul>
                <p className="mt-2 text-gray-600">※ はみ出し防止のため、サイズ変更はできません</p>
              </div>
            </div>

            {/* プレビュー */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">プレビュー</h3>
              <div className="p-4 rounded-lg border-2 border-gray-200" style={{ backgroundColor: background }}>
                <div className="flex gap-2 mb-2">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: primary }} title="Primary" />
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: secondary }} title="Secondary" />
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: accent }} title="Accent" />
                </div>
                <div className="font-medium" style={{ color: text }}>
                  本文サンプル
                </div>
                <div className="text-sm" style={{ color: textLight }}>
                  補足テキスト
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                {editingStyle ? '更新' : '作成'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 active:scale-95 transition-all"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
