import type { Panel } from "@/types/story";

type ImageFormat = "PNG" | "JPEG";

const imageTypes: Record<string, ImageFormat> = { "image/png": "PNG", "image/jpeg": "JPEG" };
const completeImages: Record<ImageFormat, (bytes: Uint8Array) => boolean> = {
  PNG: (bytes) => {
    const start = [137, 80, 78, 71, 13, 10, 26, 10];
    const end = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];
    return bytes.length >= start.length + end.length &&
      start.every((byte, index) => bytes[index] === byte) &&
      end.every((byte, index) => bytes[bytes.length - end.length + index] === byte);
  },
  JPEG: (bytes) => bytes.length >= 4 &&
    bytes[0] === 255 && bytes[1] === 216 &&
    bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217,
};

async function fetchPanel(panel: Panel) {
  const response = await fetch(panel.image, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Panel ${panel.index} image request failed`);

  const mime = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  const format = imageTypes[mime];
  if (!format) throw new Error(`Panel ${panel.index} is not a supported image`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!completeImages[format](bytes)) throw new Error(`Panel ${panel.index} is not a complete image`);
  return { bytes, format, index: panel.index, mime };
}

export async function exportStoryPdf({
  panels,
  title,
  pageSize = "a4",
  panelsPerPage = 2,
}: {
  panels: Panel[];
  title: string;
  pageSize?: "a4" | "letter";
  panelsPerPage?: 2 | 4;
}): Promise<void> {
  if (panels.length === 0) throw new Error("No panels to export");

  const sortedPanels = [...panels].sort((a, b) => a.index - b.index);
  const images = await Promise.all(sortedPanels.map(fetchPanel));
  const decodedImages = await Promise.all(images.map(async (image) => {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(new Blob([image.bytes], { type: image.mime }));
    } catch {
      throw new Error(`Panel ${image.index} could not be decoded`);
    }
    try {
      if (
        !Number.isFinite(bitmap.width) || bitmap.width <= 0 ||
        !Number.isFinite(bitmap.height) || bitmap.height <= 0
      ) {
        throw new Error(`Panel ${image.index} is not a supported image`);
      }
      return { ...image, width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  }));
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: pageSize });
  const verifiedImages = decodedImages.map((image) => {
    const properties = doc.getImageProperties(image.bytes);
    if (
      properties.fileType.toUpperCase() !== image.format ||
      properties.width !== image.width || properties.height !== image.height
    ) {
      throw new Error(`Panel ${image.index} is not a supported image`);
    }
    return image;
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const spacing = 5;
  const usableWidth = pageWidth - 2 * margin;
  const usableHeight = pageHeight - 2 * margin;
  const maxPanelWidth = panelsPerPage === 2 ? usableWidth : (usableWidth - spacing) / 2;
  const maxPanelHeight = (usableHeight - spacing) / 2;

  verifiedImages.forEach(({ bytes, format, width, height }, index) => {
    if (index > 0 && index % panelsPerPage === 0) doc.addPage();

    const indexOnPage = index % panelsPerPage;
    const row = panelsPerPage === 2 ? indexOnPage : Math.floor(indexOnPage / 2);
    const column = panelsPerPage === 2 ? 0 : indexOnPage % 2;
    const scale = Math.min(maxPanelWidth / width, maxPanelHeight / height);
    const panelWidth = width * scale;
    const panelHeight = height * scale;
    const x = margin + column * (maxPanelWidth + spacing) + (maxPanelWidth - panelWidth) / 2;
    const y = margin + row * (maxPanelHeight + spacing) + (maxPanelHeight - panelHeight) / 2;
    doc.addImage(bytes, format, x, y, panelWidth, panelHeight);
  });

  doc.save(`${title}.pdf`);
}
