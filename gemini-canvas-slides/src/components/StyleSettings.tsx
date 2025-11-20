import { useState } from 'react';
import type { Template, Style, AppMode, AccentColors } from '../types';
import CustomStyleModal from './CustomStyleModal';

// アクセントカラーのプリセット
const COLOR_PRESETS: { id: string; name: string; colors: AccentColors }[] = [
  { id: 'blue', name: '青系', colors: { main: '#2563EB', sub: '#60A5FA' } },
  { id: 'green', name: '緑系', colors: { main: '#16A34A', sub: '#4ADE80' } },
  { id: 'red', name: '赤系', colors: { main: '#DC2626', sub: '#F87171' } },
  { id: 'purple', name: '紫系', colors: { main: '#9333EA', sub: '#C084FC' } },
  { id: 'orange', name: 'オレンジ系', colors: { main: '#EA580C', sub: '#FB923C' } },
  { id: 'teal', name: '青緑系', colors: { main: '#0D9488', sub: '#5EEAD4' } },
];

interface StyleSettingsProps {
  templates: Template[];
  styles: Style[];
  selectedTemplateId: string;
  selectedStyleId: string;
  onTemplateChange: (templateId: string) => void;
  onStyleChange: (styleId: string) => void;
  mode: AppMode;
  customAccentColors?: AccentColors;
  onAccentColorsChange: (colors: AccentColors) => void;
  onCreateCustomStyle: (style: Partial<Style>) => void;
  onUpdateCustomStyle: (styleId: string, updates: Partial<Style>) => void;
  onDeleteCustomStyle: (styleId: string) => void;
}

export default function StyleSettings({
  templates,
  styles,
  selectedTemplateId,
  selectedStyleId,
  onTemplateChange,
  onStyleChange,
  mode,
  customAccentColors,
  onAccentColorsChange,
  onCreateCustomStyle,
  onUpdateCustomStyle,
  onDeleteCustomStyle,
}: StyleSettingsProps) {
  // カスタムカラーモードの状態管理
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customMainColor, setCustomMainColor] = useState(customAccentColors?.main || '#2563EB');
  const [customSubColor, setCustomSubColor] = useState(customAccentColors?.sub || '#60A5FA');

  // カスタムスタイルモーダルの状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  // プリセットカラーが選択されているかチェック
  const isPresetSelected = (preset: AccentColors) => {
    return !isCustomMode &&
           customAccentColors?.main === preset.main &&
           customAccentColors?.sub === preset.sub;
  };

  // カスタムカラーを適用
  const handleCustomColorApply = () => {
    onAccentColorsChange({ main: customMainColor, sub: customSubColor });
    setIsCustomMode(false); // 適用後、カスタムモードを解除
  };

  // プリセットを選択
  const handlePresetSelect = (colors: AccentColors) => {
    setIsCustomMode(false);
    onAccentColorsChange(colors);
  };

  // カスタムモードを有効化
  const handleCustomModeEnable = () => {
    setIsCustomMode(true);
    setCustomMainColor(customAccentColors?.main || '#2563EB');
    setCustomSubColor(customAccentColors?.sub || '#60A5FA');
  };

  // カスタムスタイル作成ボタン
  const handleCreateCustomStyle = () => {
    setEditingStyle(null);
    setIsModalOpen(true);
  };

  // カスタムスタイル編集ボタン
  const handleEditCustomStyle = (style: Style) => {
    setEditingStyle(style);
    setIsModalOpen(true);
  };

  // カスタムスタイル削除
  const handleDeleteCustomStyle = (styleId: string) => {
    if (confirm('このカスタムスタイルを削除しますか？')) {
      onDeleteCustomStyle(styleId);
      // 削除したスタイルが選択されていた場合、最初のスタイルに変更
      if (selectedStyleId === styleId && styles.length > 0) {
        onStyleChange(styles[0].id);
      }
    }
  };

  // カスタムスタイル保存
  const handleSaveCustomStyle = (styleData: Partial<Style>) => {
    if (editingStyle) {
      // 編集モード
      onUpdateCustomStyle(editingStyle.id, styleData);
    } else {
      // 新規作成モード
      onCreateCustomStyle(styleData);
    }
    setIsModalOpen(false);
    setEditingStyle(null);
  };

  // プリセットとカスタムスタイルを分離
  const presetStyles = styles.filter(s => !s.isCustom);
  const customStyles = styles.filter(s => s.isCustom);

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">設定</h3>

      {/* テンプレート選択（汎用モードのみ表示） */}
      {mode === 'general' && (
        <div>
          <label htmlFor="template" className="block text-sm font-semibold text-gray-700 mb-2">
            テンプレート
          </label>
          <select
            id="template"
            value={selectedTemplateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-600">
            {templates.find(t => t.id === selectedTemplateId)?.structure.length}枚のスライド構成
          </p>
        </div>
      )}

      {/* スタイル選択（汎用モードのみ表示） */}
      {mode === 'general' && (
        <div>
          <label htmlFor="style" className="block text-sm font-semibold text-gray-700 mb-2">
            スタイル
          </label>

          {/* プリセットスタイル */}
          <select
            id="style"
            value={selectedStyleId}
            onChange={(e) => onStyleChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <optgroup label="プリセット">
              {presetStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name} - {style.description}
                </option>
              ))}
            </optgroup>
            {customStyles.length > 0 && (
              <optgroup label="カスタムスタイル">
                {customStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name} - {style.description}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* カラープレビュー */}
          {selectedStyleId && (
            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-700">カラー:</span>
                <div className="flex gap-1">
                  {styles.find(s => s.id === selectedStyleId)?.colors && (
                    <>
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: styles.find(s => s.id === selectedStyleId)!.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: styles.find(s => s.id === selectedStyleId)!.colors.secondary }}
                        title="Secondary"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* カスタムスタイル作成ボタン */}
          <button
            type="button"
            onClick={handleCreateCustomStyle}
            className="mt-3 w-full py-2 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>カスタムスタイルを作成</span>
          </button>

          {/* カスタムスタイル一覧（編集・削除ボタン付き） */}
          {customStyles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700">カスタムスタイル管理</p>
              {customStyles.map((style) => (
                <div key={style.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{style.name}</p>
                    <p className="text-xs text-gray-600">{style.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditCustomStyle(style)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomStyle(style.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* アクセントカラー選択（ティースリーモードのみ表示） */}
      {mode === 't3' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            アクセントカラー
          </label>
          <p className="text-xs text-gray-600 mb-3">
            装飾に使用するカラーを選択してください（本文・タイトルには使用されません）
          </p>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.colors)}
              className={`p-3 rounded-lg border-2 transition-all ${
                isPresetSelected(preset.colors)
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: preset.colors.main }}
                    title="メインカラー"
                  />
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: preset.colors.sub }}
                    title="サブカラー"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{preset.name}</span>
              </div>
            </button>
          ))}
          {/* カスタムカラーボタン */}
          <button
            type="button"
            onClick={handleCustomModeEnable}
            className={`p-3 rounded-lg border-2 transition-all ${
              isCustomMode
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-6 h-6 rounded border border-gray-300 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500" title="カスタム" />
                <div className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs">✎</div>
              </div>
              <span className="text-xs font-medium text-gray-700">カスタム</span>
            </div>
          </button>
        </div>

        {/* カスタムカラー入力フィールド */}
        {isCustomMode && (
          <div className="mt-3 p-4 bg-white rounded border-2 border-purple-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">カスタムカラー設定</h4>
            <div className="space-y-3">
              {/* メインカラー */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  メインカラー
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customMainColor}
                    onChange={(e) => setCustomMainColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customMainColor}
                    onChange={(e) => setCustomMainColor(e.target.value)}
                    placeholder="#2563EB"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* サブカラー */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  サブカラー
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customSubColor}
                    onChange={(e) => setCustomSubColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customSubColor}
                    onChange={(e) => setCustomSubColor(e.target.value)}
                    placeholder="#60A5FA"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 適用ボタン */}
              <button
                type="button"
                onClick={handleCustomColorApply}
                className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 active:scale-95 transition-all shadow-sm hover:shadow"
              >
                カスタムカラーを適用
              </button>
            </div>
          </div>
        )}

        {/* 現在の設定表示 */}
        {customAccentColors && !isCustomMode && (
          <div className="mt-3 p-3 bg-white rounded border border-gray-200">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">メインカラー:</span>
                <span className="font-mono">{customAccentColors.main}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">サブカラー:</span>
                <span className="font-mono">{customAccentColors.sub}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* カスタムスタイルモーダル */}
      <CustomStyleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStyle(null);
        }}
        onSave={handleSaveCustomStyle}
        editingStyle={editingStyle}
      />
    </div>
  );
}
