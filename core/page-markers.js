import { blocksToMarkdown } from 'kordoc';

function renderWithPageMarkers(blocks, fallbackMd = '') {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { markdown: fallbackMd, pageCount: 1 };
  }

  const pageGroups = new Map();
  for (const block of blocks) {
    const page = Number.isInteger(block.pageNumber) ? block.pageNumber : 1;
    if (!pageGroups.has(page)) pageGroups.set(page, []);
    pageGroups.get(page).push(block);
  }

  const pages = [...pageGroups.keys()].sort((a, b) => a - b);
  const parts = [];

  for (const page of pages) {
    const groupBlocks = pageGroups.get(page);
    const pageMarkdown = blocksToMarkdown(groupBlocks).trim();

    parts.push(`<!-- page: ${page} -->`);
    parts.push('');
    if (pageMarkdown) parts.push(pageMarkdown);

    const footnotes = groupBlocks
      .filter((block) => block.footnoteText && block.footnoteText.trim())
      .map((block, index) => `> **[각주 ${index + 1}]** ${block.footnoteText.trim()}`);

    if (footnotes.length > 0) {
      parts.push('');
      parts.push(footnotes.join('\n'));
    }

    parts.push('');
  }

  return {
    markdown: parts.join('\n').trim() + '\n',
    pageCount: pages.length,
  };
}

export { renderWithPageMarkers };
