const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.esm.min.js';

const els = {
  dropzone: document.querySelector('#dropzone'),
  fileInput: document.querySelector('#fileInput'),
  fileName: document.querySelector('#fileName'),
  status: document.querySelector('#status'),
  output: document.querySelector('#output'),
  convertBtn: document.querySelector('#convertBtn'),
  copyBtn: document.querySelector('#copyBtn'),
  downloadBtn: document.querySelector('#downloadBtn'),
  progress: document.querySelector('#progress'),
  ocrToggle: document.querySelector('#ocrToggle'),
  maskToggle: document.querySelector('#maskToggle'),
};

let selectedFile = null;
let lastMarkdown = '';
let pdfjsLibPromise = null;
let tesseractWorkerPromise = null;

els.dropzone.addEventListener('click', () => els.fileInput.click());
els.dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') els.fileInput.click();
});
els.dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  els.dropzone.classList.add('dragover');
});
els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('dragover'));
els.dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  els.dropzone.classList.remove('dragover');
  const [file] = event.dataTransfer.files;
  if (file) selectFile(file);
});
els.fileInput.addEventListener('change', () => {
  const [file] = els.fileInput.files;
  if (file) selectFile(file);
});
els.convertBtn.addEventListener('click', convertSelectedFile);
els.copyBtn.addEventListener('click', copyMarkdown);
els.downloadBtn.addEventListener('click', downloadMarkdown);

function selectFile(file) {
  selectedFile = file;
  lastMarkdown = '';
  els.fileName.textContent = file.name;
  els.status.textContent = formatBytes(file.size);
  els.output.value = '';
  els.progress.textContent = '';
  els.convertBtn.disabled = false;
  els.copyBtn.disabled = true;
  els.downloadBtn.disabled = true;
}

async function convertSelectedFile() {
  if (!selectedFile) return;

  setBusy(true);
  try {
    const ext = extensionOf(selectedFile.name);
    let markdown;

    if (ext === 'pdf') {
      markdown = await convertPdf(selectedFile);
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      markdown = await convertImage(selectedFile);
    } else if (['txt', 'md'].includes(ext)) {
      markdown = await selectedFile.text();
    } else if (['ppt', 'pptx', 'hwp', 'hwpx'].includes(ext)) {
      throw new Error(
        '이 파일은 풀버전에서 변환해야 합니다.\n' +
        '브라우저 웹판은 서버가 없어 PPTX/HWPX 파서와 고성능 OCR을 실행할 수 없습니다.\n' +
        '오른쪽 위의 "풀버전 다운로드"를 사용해 주세요.'
      );
    } else {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }

    if (els.maskToggle.checked) markdown = maskPersonalInfo(markdown);
    lastMarkdown = withFrontmatter(markdown, selectedFile.name);
    els.output.value = lastMarkdown;
    els.status.textContent = '변환 완료';
    els.copyBtn.disabled = false;
    els.downloadBtn.disabled = false;
  } catch (error) {
    els.status.textContent = '오류';
    els.progress.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

async function convertPdf(file) {
  const pdfjsLib = await loadPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const parts = [];
  let extractedChars = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    setProgress(`텍스트 추출 ${pageNum}/${pdf.numPages}`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
    extractedChars += countChars(text);
    parts.push(`<!-- page: ${pageNum} -->\n\n${text}`);
  }

  const minimum = Math.max(120, pdf.numPages * 40);
  if (els.ocrToggle.checked && extractedChars < minimum) {
    return ocrPdf(pdf);
  }

  await pdf.destroy();
  return `${parts.join('\n\n')}\n`;
}

async function ocrPdf(pdf) {
  const parts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    setProgress(`OCR ${pageNum}/${pdf.numPages}`);
    const page = await pdf.getPage(pageNum);
    const blob = await renderPageToBlob(page);
    const text = await recognizeImage(blob);
    parts.push(`<!-- page: ${pageNum} -->\n\n${text || '_OCR로 인식된 텍스트가 없습니다._'}`);
  }
  await pdf.destroy();
  return `${parts.join('\n\n')}\n`;
}

async function convertImage(file) {
  if (!els.ocrToggle.checked) throw new Error('이미지 파일은 OCR을 켜야 변환할 수 있습니다.');
  setProgress('OCR 준비 중');
  const text = await recognizeImage(file);
  return `${text}\n`;
}

async function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(PDFJS_URL).then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return mod;
    });
  }
  return pdfjsLibPromise;
}

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = import(TESSERACT_URL)
      .then(({ createWorker }) => createWorker(['eng', 'kor'], 1, {
        logger: (message) => {
          if (message.status) {
            const pct = Number.isFinite(message.progress)
              ? ` ${Math.round(message.progress * 100)}%`
              : '';
            setProgress(`${message.status}${pct}`);
          }
        },
      }));
  }
  return tesseractWorkerPromise;
}

async function recognizeImage(image) {
  const worker = await getTesseractWorker();
  const { data } = await worker.recognize(image);
  return cleanText(data?.text || '');
}

async function renderPageToBlob(page) {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.max(1, Math.min(2, 2200 / Math.max(base.width, base.height)));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function withFrontmatter(markdown, source) {
  const now = new Date().toISOString();
  return [
    '---',
    `source: "${source.replace(/"/g, '\\"')}"`,
    `converted_at: "${now}"`,
    'converter: "browser pdf.js + tesseract.js"',
    '---',
    '',
    markdown.trim(),
    '',
  ].join('\n');
}

function maskPersonalInfo(text) {
  return text
    .replace(/\b\d{6}-[1-4]\d{6}\b/g, '[주민번호]')
    .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, '[휴대전화]')
    .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[전화번호]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[이메일]')
    .replace(/\b\d{3}-\d{2}-\d{5}\b/g, '[사업자번호]')
    .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[카드번호]');
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function setBusy(isBusy) {
  els.convertBtn.disabled = isBusy || !selectedFile;
  els.convertBtn.textContent = isBusy ? '변환 중' : '변환';
}

function setProgress(message) {
  els.progress.textContent = message;
}

async function copyMarkdown() {
  await navigator.clipboard.writeText(lastMarkdown);
  els.status.textContent = '복사 완료';
}

function downloadMarkdown() {
  const baseName = selectedFile.name.replace(/\.[^.]+$/, '') || 'converted';
  const blob = new Blob([lastMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseName}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function extensionOf(name) {
  return name.split('.').pop().toLowerCase();
}

function countChars(text) {
  return (text || '').replace(/\s+/g, '').length;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
