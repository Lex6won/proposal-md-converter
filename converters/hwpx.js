import fs from 'fs';
import { parse } from 'kordoc';
import { renderWithPageMarkers } from '../core/page-markers.js';

async function convertHwpx(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const result = await parse(arrayBuffer, { filePath });
  const label = options.label || 'HWPX';

  if (!result.success) {
    throw new Error(`${label} 변환 실패: ${result.error || 'unknown'}`);
  }

  const { markdown, pageCount } = renderWithPageMarkers(result.blocks || [], result.markdown || '');

  return {
    markdown,
    metadata: result.metadata || {},
    pageCount: pageCount || result.pageCount || 1,
    blocks: result.blocks || [],
  };
}

export { convertHwpx };
