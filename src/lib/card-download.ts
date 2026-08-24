"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export async function captureCardPng(node: HTMLElement) {
  return toPng(node, {
    pixelRatio: 3,
    cacheBust: true,
    skipAutoScale: true,
  });
}

export async function downloadCardFile(node: HTMLElement, format: "png" | "pdf", filename: string) {
  const dataUrl = await captureCardPng(node);
  if (format === "png") {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.png`;
    a.click();
    return;
  }

  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not read card image"));
    img.src = dataUrl;
  });
  const width = 1080;
  const height = Math.max(1440, Math.round((img.naturalHeight / img.naturalWidth) * width));
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [width, height],
    compress: true,
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height, undefined, "MEDIUM");
  pdf.save(`${filename}.pdf`);
}
