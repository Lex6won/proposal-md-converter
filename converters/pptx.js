import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OfficeParser } from 'officeparser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TESSDATA_DIR = path.resolve(__dirname, '..', 'tessdata');

async function convertPptx(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const ocrEnabled = options.ocrEnabled !== false;
  const ocrLanguage = options.ocrLanguage || 'eng+kor';

  const hasLocalTessdata = fs.existsSync(TESSDATA_DIR)
    && fs.existsSync(path.join(TESSDATA_DIR, 'kor.traineddata.gz'));

  const ocrConfig = ocrEnabled ? {
    language: ocrLanguage,
    ...(hasLocalTessdata ? { langPath: TESSDATA_DIR } : {}),
  } : undefined;

  const ast = await OfficeParser.parseOffice(buffer, {
    ocr: ocrEnabled,
    ocrConfig,
    extractAttachments: true,
    ignoreNotes: false,
    putNotesAtLast: false,
    newlineDelimiter: '\n',
    onWarning: (issue) => {
      console.warn(`[officeparser] ${issue.code}: ${issue.message}`);
    },
  });

  const attachmentByName = new Map();
  if (Array.isArray(ast.attachments)) {
    for (const attachment of ast.attachments) {
      attachmentByName.set(attachment.name, attachment);
    }
  }

  const ctx = {
    currentSlide: 0,
    imageOrderInSlide: new Map(),
    imageLabelMap: new Map(),
    slideOcrTexts: new Map(),
    attachmentByName,
  };

  const body = renderNodes(ast.content || [], ctx);
  const ocrSection = buildOcrSection(ctx.slideOcrTexts);
  const finalMarkdown = ocrSection
    ? `${body.trim()}\n\n${ocrSection}\n`
    : `${body.trim()}\n`;

  const slideCount = ctx.currentSlide || estimateSlideCount(ast);
  const ocrCount = [...ctx.slideOcrTexts.values()].reduce((sum, items) => sum + items.length, 0);

  return {
    markdown: finalMarkdown,
    slideCount: slideCount || 1,
    ocrCount,
  };
}

function renderNodes(nodes, ctx) {
  if (!Array.isArray(nodes)) return '';
  return nodes.map((node) => renderNode(node, ctx)).filter(Boolean).join('');
}

function renderNode(node, ctx) {
  if (!node || typeof node !== 'object') return '';

  switch (node.type) {
    case 'slide':
      return renderSlide(node, ctx);
    case 'heading':
      return renderHeading(node, ctx);
    case 'paragraph':
      return renderParagraph(node, ctx);
    case 'text':
      return renderInline(node);
    case 'list':
      return renderList(node, ctx, 0);
    case 'table':
      return renderTable(node, ctx);
    case 'image':
    case 'drawing':
    case 'chart':
      return renderImage(node, ctx);
    case 'note':
      return renderNote(node, ctx);
    case 'comment':
      return renderComment(node, ctx);
    case 'break':
      return '\n';
    default:
      return Array.isArray(node.children)
        ? renderNodes(node.children, ctx)
        : (node.text ? `${node.text}\n\n` : '');
  }
}

function renderSlide(node, ctx) {
  const slideNum = node.metadata?.slideNumber || (ctx.currentSlide + 1);
  ctx.currentSlide = slideNum;
  ctx.imageOrderInSlide.set(slideNum, 0);

  const inner = renderNodes(node.children || [], ctx);
  return `\n<!-- slide: ${slideNum} -->\n\n${inner.trim()}\n\n`;
}

function renderHeading(node, ctx) {
  const level = clamp(node.metadata?.level || 1, 1, 6);
  const inner = (node.children && node.children.length > 0)
    ? renderInlineSeq(node.children, ctx)
    : (node.text || '');
  return `${'#'.repeat(level)} ${inner.trim()}\n\n`;
}

function renderParagraph(node, ctx) {
  const inner = (node.children && node.children.length > 0)
    ? renderInlineSeq(node.children, ctx)
    : (node.text || '');
  const trimmed = inner.trim();
  return trimmed ? `${trimmed}\n\n` : '';
}

function renderInline(node) {
  let text = node.text || '';
  if (!text) return '';

  const formatting = node.formatting || {};
  if (formatting.code) text = `\`${text}\``;
  if (formatting.bold) text = `**${text}**`;
  if (formatting.italic) text = `*${text}*`;
  if (formatting.underline) text = `<u>${text}</u>`;
  if (formatting.strikethrough) text = `~~${text}~~`;
  if (formatting.highlight) text = `<mark>${text}</mark>`;
  return text;
}

function renderInlineSeq(nodes, ctx) {
  if (!Array.isArray(nodes)) return '';

  let out = '';
  for (const node of nodes) {
    if (!node) continue;
    if (node.type === 'text') {
      out += renderInline(node);
    } else if (node.type === 'break') {
      out += '\n';
    } else if (node.type === 'image' || node.type === 'drawing' || node.type === 'chart') {
      out += renderImage(node, ctx).trim();
    } else if (Array.isArray(node.children)) {
      out += renderInlineSeq(node.children, ctx);
    } else if (node.text) {
      out += node.text;
    }
  }
  return out;
}

function renderList(node, ctx, depth) {
  const ordered = node.metadata?.style === 'ordered' || node.metadata?.ordered === true;
  const items = node.children || [];
  const indent = '  '.repeat(depth);
  const lines = [];
  let index = 1;

  for (const item of items) {
    if (!item) continue;
    const bullet = ordered ? `${index}.` : '-';
    index += 1;
    const itemText = (item.children && item.children.length > 0)
      ? renderInlineSeq(item.children, ctx).trim()
      : (item.text || '').trim();
    lines.push(`${indent}${bullet} ${itemText}`);

    if (Array.isArray(item.children)) {
      for (const child of item.children) {
        if (child?.type === 'list') {
          lines.push(renderList(child, ctx, depth + 1).replace(/\n+$/, ''));
        }
      }
    }
  }

  return lines.join('\n') + '\n\n';
}

function renderTable(node, ctx) {
  const rows = (node.children || []).filter((child) => child?.type === 'row');
  if (rows.length === 0) return '';

  const cellsPerRow = rows.map((row) =>
    (row.children || []).filter((child) => child?.type === 'cell').map((cell) => {
      const text = (cell.children && cell.children.length > 0)
        ? renderInlineSeq(cell.children, ctx)
        : (cell.text || '');
      return text.replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim();
    })
  );

  const width = Math.max(...cellsPerRow.map((row) => row.length));
  const header = cellsPerRow[0] || [];
  const body = cellsPerRow.slice(1);
  const padded = (row) => {
    const out = row.slice();
    while (out.length < width) out.push('');
    return out;
  };

  const lines = [];
  lines.push(`| ${padded(header).join(' | ')} |`);
  lines.push(`| ${Array(width).fill('---').join(' | ')} |`);
  for (const row of body) lines.push(`| ${padded(row).join(' | ')} |`);
  return lines.join('\n') + '\n\n';
}

function renderImage(node, ctx) {
  const meta = node.metadata || {};
  const attachmentName = meta.attachmentName || '';
  const slide = ctx.currentSlide || 1;
  const order = (ctx.imageOrderInSlide.get(slide) || 0) + 1;
  ctx.imageOrderInSlide.set(slide, order);

  const label = `슬라이드${slide}-이미지${order}`;
  ctx.imageLabelMap.set(attachmentName, { slide, order, label });

  const alt = (meta.altText && meta.altText.trim()) ? meta.altText.trim() : label;

  if (attachmentName) {
    const attachment = ctx.attachmentByName.get(attachmentName);
    if (attachment?.ocrText && attachment.ocrText.trim()) {
      const list = ctx.slideOcrTexts.get(slide) || [];
      list.push({
        label,
        text: attachment.ocrText.trim(),
        altText: meta.altText || '',
      });
      ctx.slideOcrTexts.set(slide, list);
    }
  }

  return `![${alt}](#${label})\n\n`;
}

function renderNote(node, ctx) {
  const inner = (node.children && node.children.length > 0)
    ? renderInlineSeq(node.children, ctx).trim()
    : (node.text || '').trim();
  if (!inner) return '';

  const noteType = node.metadata?.noteType;
  const tag = noteType === 'footnote'
    ? '각주'
    : noteType === 'endnote'
      ? '미주'
      : '발표자 노트';
  return inner.split('\n').map((line) => `> **[${tag}]** ${line}`).join('\n') + '\n\n';
}

function renderComment(node, ctx) {
  const inner = (node.children && node.children.length > 0)
    ? renderInlineSeq(node.children, ctx).trim()
    : (node.text || '').trim();
  if (!inner) return '';
  return inner.split('\n').map((line) => `> **[주석]** ${line}`).join('\n') + '\n\n';
}

function buildOcrSection(slideOcrTexts) {
  if (!slideOcrTexts || slideOcrTexts.size === 0) return '';

  const out = ['---', '<!-- OCR: 이미지에서 추출한 텍스트 -->', ''];
  const slides = [...slideOcrTexts.keys()].sort((a, b) => a - b);
  for (const slide of slides) {
    const items = slideOcrTexts.get(slide) || [];
    for (const item of items) {
      out.push(`### ${item.label}${item.altText ? ` - ${item.altText}` : ''}`);
      out.push('');
      const lines = item.text.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        out.push(`> ${line}`);
      }
      out.push('');
    }
  }
  return out.join('\n');
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function estimateSlideCount(ast) {
  if (!ast || !Array.isArray(ast.content)) return 1;
  let count = 0;
  for (const item of ast.content) {
    if (item?.type === 'slide' || item?.metadata?.slideNumber !== undefined) count += 1;
  }
  return count || 1;
}

export { convertPptx };
