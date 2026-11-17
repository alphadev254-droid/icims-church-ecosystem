import { resolveMediaUrl } from "@/lib/media-url";

export async function downloadMediaFile(url: string, fileName: string) {
  const response = await fetch(resolveMediaUrl(url), { credentials: "include" });
  if (!response.ok) throw new Error("The file could not be downloaded");

  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName || "curriculum-file";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000);
}
