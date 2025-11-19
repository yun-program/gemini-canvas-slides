import { useState, useCallback } from 'react';
import { parseFiles, isSupportedFileType, isValidFileSize, type ParseResult } from '../services/fileParser';

interface FileUploaderProps {
  onFilesProcessed: (content: string) => void;
}

export default function FileUploader({ onFilesProcessed }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ParseResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setErrorMessage('');

    // ファイル形式とサイズの検証
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      if (!isSupportedFileType(file)) {
        invalidFiles.push(`${file.name} (サポートされていない形式)`);
      } else if (!isValidFileSize(file)) {
        invalidFiles.push(`${file.name} (ファイルサイズが大きすぎます)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setErrorMessage(`以下のファイルを読み込めませんでした:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const results = await parseFiles(validFiles);
      setUploadedFiles(prev => [...prev, ...results]);

      // すべてのファイルの内容を結合
      const combinedContent = results
        .filter(r => !r.error)
        .map(r => `## ${r.fileName}\n\n${r.content}`)
        .join('\n\n---\n\n');

      if (combinedContent) {
        onFilesProcessed(combinedContent);
      }

      // エラーがあったファイルを表示
      const errorFiles = results.filter(r => r.error);
      if (errorFiles.length > 0) {
        const errorMsg = errorFiles.map(r => `${r.fileName}: ${r.error}`).join('\n');
        setErrorMessage(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
      }
    } catch (error) {
      setErrorMessage('ファイルの処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setErrorMessage('');
    onFilesProcessed('');
  };

  return (
    <div className="space-y-4">
      {/* ドラッグ&ドロップエリア */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}
        `}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".txt,.md,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        <div className="pointer-events-none">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-semibold">
                ファイルを選択
              </span>
              <span className="text-gray-600"> またはドラッグ&ドロップ</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            PDF、Word (.docx)、テキスト、画像 (最大10MB)
          </p>
        </div>
      </div>

      {/* 処理中インジケータ */}
      {isProcessing && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>ファイルを処理中...</span>
        </div>
      )}

      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{errorMessage}</pre>
            </div>
          </div>
        </div>
      )}

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-green-800">
              アップロード済み ({uploadedFiles.length}ファイル)
            </h3>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              すべてクリア
            </button>
          </div>
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-white rounded px-3 py-2">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">{file.fileName}</span>
                  {file.error && (
                    <span className="text-xs text-red-500">({file.error})</span>
                  )}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
