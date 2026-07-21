import type { Options } from "html-to-image/lib/types";
import type { jsPDF } from "jspdf";

const SECTION_GAP_MM = 4;

export async function buildPdfFromSections(
  root: HTMLElement,
  toCanvas: (node: HTMLElement, options?: Options) => Promise<HTMLCanvasElement>,
  pdf: jsPDF,
  margins = { x: 10, y: 10 }
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.x * 2;
  const maxY = pageHeight - margins.y;

  let y = margins.y;
  const sections = root.querySelectorAll<HTMLElement>("[data-pdf-section]");

  for (const section of sections) {
    const sectionWidth = section.offsetWidth || root.offsetWidth || 794;
    const sectionHeight = Math.max(section.offsetHeight, section.scrollHeight, 1);

    const canvas = await toCanvas(section, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: sectionWidth,
      height: sectionHeight,
      filter: (node) => node.tagName !== "SCRIPT",
    });

    if (canvas.width === 0 || canvas.height === 0) {
      console.warn("PDF section skipped due to empty capture:", section);
      continue;
    }

    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/png");

    // Start a new page if this section won't fit on the current one
    if (y + imgHeight > maxY && y > margins.y) {
      pdf.addPage();
      y = margins.y;
    }

    // If a single section is taller than one page, slice it cleanly row-by-row
    if (imgHeight > maxY - margins.y) {
      y = await sliceTallCanvasIntoPdf(
        pdf,
        canvas,
        imgData,
        contentWidth,
        imgHeight,
        margins,
        pageHeight,
        y
      );
      y += SECTION_GAP_MM;
      continue;
    }

    pdf.addImage(imgData, "PNG", margins.x, y, contentWidth, imgHeight);
    y += imgHeight + SECTION_GAP_MM;

    if (y > maxY - 20) {
      pdf.addPage();
      y = margins.y;
    }
  }
}

async function sliceTallCanvasIntoPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  imgData: string,
  contentWidth: number,
  imgHeight: number,
  margins: { x: number; y: number },
  pageHeight: number,
  startY: number
): Promise<number> {
  const maxSliceHeight = pageHeight - margins.y * 2;
  let remaining = imgHeight;
  let srcOffset = 0;
  let y = startY;

  while (remaining > 0) {
    const sliceHeight = Math.min(remaining, maxSliceHeight);

    if (y + sliceHeight > pageHeight - margins.y && y > margins.y) {
      pdf.addPage();
      y = margins.y;
    }

    const srcY = (srcOffset / imgHeight) * canvas.height;
    const srcH = (sliceHeight / imgHeight) * canvas.height;

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcH;
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    pdf.addImage(
      sliceCanvas.toDataURL("image/png"),
      "PNG",
      margins.x,
      y,
      contentWidth,
      sliceHeight
    );

    srcOffset += sliceHeight;
    remaining -= sliceHeight;
    y += sliceHeight;

    if (remaining > 0) {
      pdf.addPage();
      y = margins.y;
    }
  }

  return y;
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
