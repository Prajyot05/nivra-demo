/** A4 page height in CSS px for a 900px-wide dossier sheet (210mm × 297mm). */
export const PDF_DOSSIER_PAGE_HEIGHT_PX = (297 / 210) * 900;

const PAGE_SLICE_TOLERANCE_PX = 2;
const ORPHAN_THRESHOLD_PX = 110;

function offsetTopInRoot(el: HTMLElement, root: HTMLElement): number {
  const rootRect = root.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return rect.top - rootRect.top + root.scrollTop;
}

/** Top-level keepers only (no nested data-pdf-keep-together ancestors). */
function topLevelKeepers(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-keep-together]")).filter(
    (el) => !el.parentElement?.closest("[data-pdf-keep-together]"),
  );
}

/** Schedule tables flow naturally; do not inject spacers into the grid. */
function tableSliceTargets(_root: HTMLElement): HTMLElement[] {
  return [];
}

function needsPadBeforeSlice(
  top: number,
  height: number,
  pageHeight: number,
): { pad: number } | null {
  if (height <= 0) return null;

  const maxFit = pageHeight - 20;
  if (height > maxFit) return null;

  const pageIndex = Math.floor(top / pageHeight);
  const pageEnd = (pageIndex + 1) * pageHeight;
  const bottom = top + height;
  const remaining = pageEnd - top;

  const wouldSlice =
    top < pageEnd - PAGE_SLICE_TOLERANCE_PX &&
    bottom > pageEnd + PAGE_SLICE_TOLERANCE_PX;
  const orphanStart =
    remaining < ORPHAN_THRESHOLD_PX &&
    height > remaining + PAGE_SLICE_TOLERANCE_PX &&
    height < maxFit * 0.92;

  if (!wouldSlice && !orphanStart) return null;

  const pad = Math.ceil(remaining + 6);
  if (pad <= 0 || pad >= pageHeight) return null;
  return { pad };
}

function insertPadBefore(el: HTMLElement, padPx: number, root: HTMLElement): boolean {
  if (el.tagName === "THEAD") {
    const anchor =
      el.closest(".sched-frame") ?? el.closest(".sched-wrap") ?? el.closest("table");
    const parent = anchor?.parentElement ?? root;
    if (!anchor) return false;
    const spacer = document.createElement("div");
    spacer.setAttribute("data-pdf-spacer", "true");
    spacer.style.cssText = `height:${padPx}px;width:100%;flex-shrink:0;pointer-events:none;background:#ffffff;`;
    parent.insertBefore(spacer, anchor);
    return true;
  }

  const spacer = document.createElement("div");
  spacer.setAttribute("data-pdf-spacer", "true");
  spacer.style.cssText = `height:${padPx}px;width:100%;flex-shrink:0;pointer-events:none;background:#ffffff;`;
  const parent = el.parentElement ?? root;
  parent.insertBefore(spacer, el);
  return true;
}

/**
 * Before raster PDF capture, insert temporary spacers so marked blocks and table
 * rows are not sliced across A4 page boundaries.
 */
export function padKeepTogetherSections(
  element: HTMLElement,
  pageHeight = PDF_DOSSIER_PAGE_HEIGHT_PX,
) {
  element.querySelectorAll("[data-pdf-spacer]").forEach((n) => n.remove());

  const maxPasses = 16;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    const targets = [...topLevelKeepers(element), ...tableSliceTargets(element)];
    const unique = Array.from(new Set(targets)).sort(
      (a, b) => offsetTopInRoot(a, element) - offsetTopInRoot(b, element),
    );

    for (const el of unique) {
      const top = offsetTopInRoot(el, element);
      const height = el.offsetHeight;
      const plan = needsPadBeforeSlice(top, height, pageHeight);
      if (!plan) continue;
      if (insertPadBefore(el, plan.pad, element)) changed = true;
    }

    if (!changed) break;
  }
}

export function clearPdfSpacers(element: HTMLElement) {
  element.querySelectorAll("[data-pdf-spacer]").forEach((n) => n.remove());
}
