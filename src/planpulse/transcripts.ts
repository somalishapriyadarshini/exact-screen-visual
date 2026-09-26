export type TranscriptFile = { id: string; name: string; text: string };

const textExtensions = new Set(['txt', 'md', 'srt', 'vtt', 'csv', 'json', 'log']);

export async function readTranscript(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) throw new Error('This file needs a supported extension.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Files must be under 20 MB.');

  let content = '';
  if (textExtensions.has(extension)) {
    content = await file.text();
  } else if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    content = result.value;
  } else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push(text.items.map(item => 'str' in item ? item.str : '').join(' '));
    }
    content = pages.join('\n');
  } else {
    throw new Error('Use TXT, MD, SRT, VTT, CSV, JSON, LOG, DOCX, or PDF.');
  }

  if (!content.trim()) throw new Error('No selectable text was found in this file.');
  return content.trim();
}