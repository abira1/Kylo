/**
 * Document Extractor - converts uploaded documents (PDF, DOCX, TXT, CSV, etc.)
 * into plain text in the browser so they can be saved to the knowledge base.
 */
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed worker URL at build time.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ExtractedDocument {
  text: string;
  charCount: number;
}

const decodePlainText = (buffer: ArrayBuffer): string => {
  return new TextDecoder('utf-8').decode(new Uint8Array(buffer));
};

const extractPdf = async (buffer: ArrayBuffer): Promise<string> => {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    pages.push(pageText);
  }
  return pages.join('\n\n');
};

const extractDocx = async (buffer: ArrayBuffer): Promise<string> => {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
};

/**
 * Extract plain text from a file. Falls back to UTF-8 decoding for unknown types.
 */
export const extractTextFromFile = async (file: File): Promise<ExtractedDocument> => {
  const buffer = await file.arrayBuffer();
  const name = file.name.toLowerCase();
  let text = '';

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    text = await extractPdf(buffer);
  } else if (name.endsWith('.docx') || file.type.includes('officedocument.wordprocessingml')) {
    text = await extractDocx(buffer);
  } else {
    // txt, csv, md, json, html and other text-based formats
    text = decodePlainText(buffer);
  }

  text = text.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').trim();
  return { text, charCount: text.length };
};
