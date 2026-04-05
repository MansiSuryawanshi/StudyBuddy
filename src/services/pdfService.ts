import * as pdfjsLib from 'pdfjs-dist';

// Use a stable CDN for the worker to avoid Vite build/blob issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extracts raw text from a PDF file.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  console.group(`[PDF-Service] Analyzing: ${file.name}`);
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    console.log(`Step 1: Document loaded. Total Pages: ${pdf.numPages}`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
      
      if (i % 5 === 0) console.log(`Step 2: Processed ${i} pages...`);
    }

    console.log(`Step 3: Extraction SUCCESS. Total chars: ${fullText.length}`);
    console.groupEnd();
    return fullText.trim();
  } catch (error) {
    console.error(`[PDF-Service] CRITICAL FAIL:`, error);
    console.groupEnd();
    throw new Error("Failed to extract text from PDF. Please ensure the file is not password protected.");
  }
}
