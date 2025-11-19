import type { Template, Style } from '../types';

interface StyleSettingsProps {
  templates: Template[];
  styles: Style[];
  selectedTemplateId: string;
  selectedStyleId: string;
  onTemplateChange: (templateId: string) => void;
  onStyleChange: (styleId: string) => void;
}

export default function StyleSettings({
  templates,
  styles,
  selectedTemplateId,
  selectedStyleId,
  onTemplateChange,
  onStyleChange,
}: StyleSettingsProps) {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">設定</h3>

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

      <div>
        <label htmlFor="style" className="block text-sm font-semibold text-gray-700 mb-2">
          スタイル
        </label>
        <select
          id="style"
          value={selectedStyleId}
          onChange={(e) => onStyleChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          {styles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name} - {style.description}
            </option>
          ))}
        </select>
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
      </div>
    </div>
  );
}
