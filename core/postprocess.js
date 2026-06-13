function nowInKstIso() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace('Z', '+09:00');
}

function buildFrontmatter({ fileName, converterName, pageCount, slideCount, ocrCount, ocrPageCount }) {
  const lines = ['---'];
  lines.push(`source: "${fileName}"`);
  lines.push(`converted_at: "${nowInKstIso()}"`);
  if (pageCount !== undefined) lines.push(`pages: ${pageCount}`);
  if (slideCount !== undefined) lines.push(`slides: ${slideCount}`);
  if (ocrCount !== undefined && ocrCount > 0) lines.push(`ocr_images: ${ocrCount}`);
  if (ocrPageCount !== undefined && ocrPageCount > 0) lines.push(`ocr_pages: ${ocrPageCount}`);
  lines.push(`converter: "${converterName}"`);
  lines.push('---');
  return lines.join('\n');
}

function postprocess({ markdown, fileName, converterName, fileType, pageCount, slideCount, ocrCount, ocrPageCount }) {
  const body = (markdown || '').replace(/^\s+/, '');

  const fmData = { fileName, converterName };
  if (fileType === 'hwp' || fileType === 'hwpx' || fileType === 'pdf') {
    fmData.pageCount = pageCount || 1;
    fmData.ocrPageCount = ocrPageCount;
  } else if (fileType === 'pptx') {
    fmData.slideCount = slideCount || 1;
    fmData.ocrCount = ocrCount;
  }

  return `${buildFrontmatter(fmData)}\n\n${body}`;
}

export { postprocess, buildFrontmatter };
