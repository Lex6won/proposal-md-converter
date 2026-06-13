import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { convertFile, SUPPORTED_EXTENSIONS } from './core/router.js';
import { maskPersonalInfo } from './core/privacy-mask.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const OUTPUT_MAX_FILES = Number(process.env.OUTPUT_MAX_FILES || 50);

const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function decodeOriginalName(name) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

function cleanupOldOutputs(maxFiles = OUTPUT_MAX_FILES) {
  if (!Number.isFinite(maxFiles) || maxFiles <= 0) return;

  const files = fs.readdirSync(outputDir)
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .map((name) => {
      const fullPath = path.join(outputDir, name);
      const stat = fs.statSync(fullPath);
      return { name, fullPath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const file of files.slice(maxFiles)) {
    fs.unlink(file.fullPath, (err) => {
      if (err) console.warn(`[cleanup] output 삭제 실패: ${file.name}`);
    });
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const original = decodeOriginalName(file.originalname);
      file.originalname = original;
      const timestamp = Date.now();
      const safeName = original.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
      cb(null, `${timestamp}_${safeName}`);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '파일이 업로드되지 않았습니다.' });
    }

    const filePath = req.file.path;
    const ocrEnabled = req.body?.ocrEnabled !== 'false' && req.body?.pptxOcr !== 'false';
    const privacyMaskEnabled = req.body?.privacyMask !== 'false';
    const result = await convertFile(filePath, {
      displayName: req.file.originalname,
      ocrEnabled,
    });
    const markdown = privacyMaskEnabled ? maskPersonalInfo(result.markdown) : result.markdown;

    const outputFilePath = path.join(outputDir, result.fileName);
    fs.writeFileSync(outputFilePath, markdown, 'utf-8');
    cleanupOldOutputs();

    const originalExt = path.extname(req.file.originalname);
    const displayName = req.file.originalname.slice(0, -originalExt.length) + '.md';

    fs.unlink(filePath, (err) => {
      if (err) console.warn(`[cleanup] upload 삭제 실패: ${filePath}`);
    });

    res.json({
      success: true,
      fileName: displayName,
      fileType: result.fileType,
      pageCount: result.pageCount,
      slideCount: result.slideCount,
      ocrCount: result.ocrCount,
      ocrPageCount: result.ocrPageCount,
      ocrUsed: result.ocrUsed,
      privacyMasked: privacyMaskEnabled,
      markdown,
      downloadUrl: `/download/${encodeURIComponent(result.fileName)}?as=${encodeURIComponent(displayName)}`,
    });
  } catch (err) {
    console.error('[convert] 오류:', err.message);

    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(422).json({
      success: false,
      error: err.message,
    });
  }
});

app.get('/download/:fileName', (req, res) => {
  const filePath = path.join(outputDir, req.params.fileName);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(path.resolve(outputDir))) {
    return res.status(403).json({ error: '잘못된 파일 경로입니다.' });
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }

  const displayName = (req.query.as && typeof req.query.as === 'string')
    ? req.query.as
    : req.params.fileName;
  res.download(resolvedPath, displayName);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    port: PORT,
    version: '1.0.0',
    supportedFormats: Object.keys(SUPPORTED_EXTENSIONS),
    outputMaxFiles: OUTPUT_MAX_FILES,
    privacyMaskDefault: true,
    ocrDefault: true,
  });
});

const server = app.listen(PORT, () => {
  const addr = `http://localhost:${PORT}`;
  console.log('==========================================');
  console.log('  제안서 MD 변환 도구');
  console.log('==========================================');
  console.log(`  접속: ${addr}`);
  console.log('  종료: Ctrl+C');
  console.log('==========================================');
});

async function shutdown() {
  console.log('\n서버를 종료합니다.');
  try {
    const { OfficeParser } = await import('officeparser');
    await OfficeParser.terminateOcr();
  } catch {
    // OCR worker가 시작되지 않았으면 무시한다.
  }
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
