import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from '@napi-rs/canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parse } from 'kordoc';
import { createWorker } from 'tesseract.js';
import { renderWithPageMarkers } from '../core/page-markers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TESSDATA_DIR = path.resolve(__dirname, '..', 'tessdata');
const OCR_MIN_CHARS_PER_PAGE = 10;
const OCR_MAX_PAGE_DIMENSION = 2200;
const OCR_DEFAULT_SCALE = 2;

async function convertPdf(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const ocrEnabled = options.ocrEnabled !== false;
  const ocrLanguage = options.ocrLanguage || ['eng', 'kor'];
  let result;
  let parseError;

  try {
    result = await parse(arrayBuffer, { filePath });
  } catch (err) {
    parseError = err;
    result = { success: false, error: err.message };
  }

  if (result.success) {
    const rendered = renderWithPageMarkers(result.blocks || [], result.markdown || '');
    const pageCount = rendered.pageCount || result.pageCount || 1;

    if (!shouldUseOcrFallback(result, rendered.markdown, pageCount) || !ocrEnabled) {
      return {
        markdown: rendered.markdown,
        metadata: result.metadata || {},
        pageCount,
        isImageBased: result.isImageBased || false,
        blocks: result.blocks || [],
        ocrUsed: false,
        ocrPageCount: 0,
      };
    }

    const ocrResult = await convertPdfWithOcr(buffer, { ocrLanguage });
    return {
      markdown: ocrResult.markdown,
      metadata: result.metadata || {},
      pageCount: ocrResult.pageCount,
      isImageBased: true,
      blocks: [],
      ocrUsed: true,
      ocrPageCount: ocrResult.ocrPageCount,
    };
  }

  if (!ocrEnabled) {
    if (result.isImageBased) {
      throw new Error(
        'PDF가 이미지 기반 스캔 문서입니다. 텍스트 추출이 어렵습니다.\n' +
        '  PDF OCR 옵션을 켠 뒤 다시 시도해 주세요.'
      );
    }
    throw new Error(`PDF 변환 실패: ${result.error || 'unknown'}`);
  }

  try {
    const ocrResult = await convertPdfWithOcr(buffer, { ocrLanguage });
    return {
      markdown: ocrResult.markdown,
      metadata: result.metadata || {},
      pageCount: ocrResult.pageCount,
      isImageBased: true,
      blocks: [],
      ocrUsed: true,
      ocrPageCount: ocrResult.ocrPageCount,
    };
  } catch (ocrError) {
    const baseError = parseError?.message || result.error || 'unknown';
    throw new Error(`PDF 변환 실패: ${baseError}\nOCR 시도도 실패했습니다: ${ocrError.message}`);
  }
}

function shouldUseOcrFallback(result, markdown, pageCount) {
  if (result.isImageBased) return true;

  const textLength = countMeaningfulChars(markdown);
  if (textLength === 0) return true;

  return (pageCount || 1) > 1 && textLength < pageCount * OCR_MIN_CHARS_PER_PAGE;
}

function countMeaningfulChars(text) {
  return (text || '')
    .replace(/<!--\s*page:\s*\d+\s*-->/gi, '')
    .replace(/\s+/g, '')
    .length;
}

async function convertPdfWithOcr(buffer, options = {}) {
  ensureLocalTessdata();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useSystemFonts: true,
  }).promise;
  const worker = await createWorker(options.ocrLanguage, 1, {
    langPath: normalizeLangPath(TESSDATA_DIR),
  });

  const parts = [];
  let ocrPageCount = 0;

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const png = await renderPageToPng(page);
      const { data } = await worker.recognize(png);
      const text = cleanOcrText(data?.text || '');

      if (text) ocrPageCount += 1;
      parts.push(`<!-- page: ${pageNum} -->\n\n${text || '_OCR로 인식된 텍스트가 없습니다._'}`);
      page.cleanup();
    }
  } finally {
    await worker.terminate();
    await pdf.destroy();
  }

  return {
    markdown: `${parts.join('\n\n')}\n`,
    pageCount: pdf.numPages || 1,
    ocrPageCount,
  };
}

async function renderPageToPng(page) {
  const viewport = buildOcrViewport(page);
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.encode('png');
}

function buildOcrViewport(page) {
  const base = page.getViewport({ scale: 1 });
  const largestSide = Math.max(base.width, base.height);
  const scale = Math.max(1, Math.min(OCR_DEFAULT_SCALE, OCR_MAX_PAGE_DIMENSION / largestSide));
  return page.getViewport({ scale });
}

function cleanOcrText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ensureLocalTessdata() {
  const required = ['eng.traineddata.gz', 'kor.traineddata.gz'];
  const missing = required.filter((name) => !fs.existsSync(path.join(TESSDATA_DIR, name)));
  if (missing.length > 0) {
    throw new Error(`OCR 학습 데이터가 없습니다: ${missing.join(', ')}`);
  }
}

function normalizeLangPath(dir) {
  return `${dir.replace(/\\/g, '/')}/`;
}

export { convertPdf };
