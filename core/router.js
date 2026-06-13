import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertHwpx } from '../converters/hwpx.js';
import { convertPdf } from '../converters/pdf.js';
import { convertPptx } from '../converters/pptx.js';
import { postprocess } from './postprocess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUPPORTED_EXTENSIONS = {
  '.hwpx': 'hwpx',
  '.hwp': 'hwp',
  '.pdf': 'pdf',
  '.pptx': 'pptx',
};

function detectFileType(ext) {
  return SUPPORTED_EXTENSIONS[ext] || null;
}

function readInstalledVersion(packageName) {
  try {
    const packagePath = path.join(rootDir, 'node_modules', packageName, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch {
    return null;
  }
}

function getConverterName(fileType, options = {}) {
  const kordocVersion = readInstalledVersion('kordoc');
  const officeparserVersion = readInstalledVersion('officeparser');
  const kordoc = kordocVersion ? `kordoc v${kordocVersion}` : 'kordoc';
  const officeparser = officeparserVersion ? `officeparser v${officeparserVersion}` : 'officeparser';

  const names = {
    hwp: kordoc,
    hwpx: kordoc,
    pdf: options.pdfOcrUsed ? `${kordoc} + OCR(eng+kor)` : kordoc,
    pptx: options.ocrEnabled
      ? `${officeparser} + OCR(eng+kor)`
      : `${officeparser} (OCR off)`,
  };
  return names[fileType] || 'unknown';
}

async function convertFile(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const fileType = detectFileType(ext);
  const diskName = path.basename(filePath);
  const fileName = options.displayName || diskName;
  const ocrEnabled = options.ocrEnabled !== false;

  if (!fileType) {
    throw new Error(
      `지원하지 않는 파일 형식입니다: ${ext}\n` +
      `지원 형식: ${Object.keys(SUPPORTED_EXTENSIONS).join(', ')}`
    );
  }

  if (options.onProgress) {
    options.onProgress('parsing', `"${fileName}" 파싱 중...`);
  }

  let result;

  switch (fileType) {
    case 'hwp':
    case 'hwpx': {
      const r = await convertHwpx(filePath, { label: fileType.toUpperCase() });
      result = {
        markdown: r.markdown,
        pageCount: r.pageCount,
        slideCount: undefined,
      };
      break;
    }
    case 'pdf': {
      const r = await convertPdf(filePath, { ocrEnabled, ocrLanguage: ['eng', 'kor'] });
      result = {
        markdown: r.markdown,
        pageCount: r.pageCount,
        slideCount: undefined,
        ocrUsed: r.ocrUsed,
        ocrPageCount: r.ocrPageCount,
      };
      break;
    }
    case 'pptx': {
      const r = await convertPptx(filePath, { ocrEnabled, ocrLanguage: 'eng+kor' });
      result = {
        markdown: r.markdown,
        pageCount: undefined,
        slideCount: r.slideCount,
        ocrCount: r.ocrCount,
      };
      break;
    }
    default:
      throw new Error(`변환기를 찾을 수 없습니다: ${fileType}`);
  }

  if (options.onProgress) {
    options.onProgress('postprocess', 'Markdown 정리 중...');
  }

  const converterName = getConverterName(fileType, { ocrEnabled, pdfOcrUsed: result.ocrUsed });
  const finalMd = postprocess({
    markdown: result.markdown,
    fileName,
    converterName,
    fileType,
    pageCount: result.pageCount,
    slideCount: result.slideCount,
    ocrCount: result.ocrCount,
    ocrPageCount: result.ocrPageCount,
  });

  if (options.onProgress) {
    options.onProgress('done', '변환 완료');
  }

  return {
    markdown: finalMd,
    fileName: diskName.replace(ext, '.md'),
    fileType,
    pageCount: result.pageCount,
    slideCount: result.slideCount,
    ocrCount: result.ocrCount,
    ocrPageCount: result.ocrPageCount,
    ocrUsed: result.ocrUsed || false,
  };
}

export { convertFile, detectFileType, getConverterName, SUPPORTED_EXTENSIONS };
