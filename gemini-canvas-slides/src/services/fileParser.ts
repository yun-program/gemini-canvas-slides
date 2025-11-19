/**
 * ファイルパーサーサービス
 * PDF、Word、画像、テキストファイルから内容を抽出
 */

export interface ParseResult {
  content: string;
  fileName: string;
  fileType: string;
  error?: string;
}

/**
 * テキストファイルをパース
 */
async function parseTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => reject(new Error('テキストファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

/**
 * PDFファイルをパース（テキスト抽出）
 * 注: ブラウザ環境では完全なPDFパースは難しいため、
 * ファイル名とサイズのみを返し、ユーザーに内容をコピペしてもらうよう促す
 */
async function parsePDF(file: File): Promise<string> {
  // PDFの完全なパースにはpdf.jsなどのライブラリが必要
  // ここでは簡易的な実装として、ファイル情報のみを返す
  const sizeInKB = (file.size / 1024).toFixed(2);
  return `[PDFファイル: ${file.name} (${sizeInKB}KB)]\n\n※ PDFの内容を抽出するには、別途テキストとしてコピーして貼り付けてください。`;
}

/**
 * Wordファイル (.docx) をパース
 * 注: .docxの完全なパースにはmammothなどのライブラリが必要
 * ここでは簡易的な実装として、ファイル情報のみを返す
 */
async function parseWord(file: File): Promise<string> {
  const sizeInKB = (file.size / 1024).toFixed(2);
  return `[Wordファイル: ${file.name} (${sizeInKB}KB)]\n\n※ Wordファイルの内容を抽出するには、別途テキストとしてコピーして貼り付けてください。`;
}

/**
 * 画像ファイルをパース（画像認識はできないので、ファイル情報を返す）
 */
async function parseImage(file: File): Promise<string> {
  const sizeInKB = (file.size / 1024).toFixed(2);
  return `[画像ファイル: ${file.name} (${sizeInKB}KB)]\n\n※ 画像の内容を説明するテキストを追加してください。`;
}

/**
 * ファイルをパースしてテキストを抽出
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name;
  const fileType = file.type;
  const extension = fileName.split('.').pop()?.toLowerCase();

  try {
    let content = '';

    // ファイルタイプに応じてパース
    if (fileType.startsWith('text/') || extension === 'txt' || extension === 'md') {
      content = await parseTextFile(file);
    } else if (fileType === 'application/pdf' || extension === 'pdf') {
      content = await parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      content = await parseWord(file);
    } else if (fileType === 'application/msword' || extension === 'doc') {
      content = await parseWord(file);
    } else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      content = await parseImage(file);
    } else {
      // サポートされていないファイル形式
      return {
        content: '',
        fileName,
        fileType,
        error: `サポートされていないファイル形式です: ${extension || fileType}`,
      };
    }

    return {
      content,
      fileName,
      fileType,
    };
  } catch (error) {
    return {
      content: '',
      fileName,
      fileType,
      error: error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました',
    };
  }
}

/**
 * 複数のファイルをパース
 */
export async function parseFiles(files: File[]): Promise<ParseResult[]> {
  const results = await Promise.all(files.map(parseFile));
  return results;
}

/**
 * サポートされているファイル形式かチェック
 */
export function isSupportedFileType(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtensions = ['txt', 'md', 'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
  const supportedTypes = ['text/', 'application/pdf', 'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'image/'];

  return (
    supportedExtensions.includes(extension || '') ||
    supportedTypes.some(type => file.type.startsWith(type))
  );
}

/**
 * ファイルサイズが妥当かチェック（10MB以下）
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
