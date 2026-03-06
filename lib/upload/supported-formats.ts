const SUPPORTED_UPLOAD_EXTENSIONS = new Set(["docx", "pptx", "xlsx", "pdf"]);

const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
]);

export const SUPPORTED_UPLOAD_FORMATS_LABEL = "DOCX, PPTX, XLSX, PDF";

function getFileExtension(fileName: string): string | null {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return null;
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function isSupportedUploadFile(fileName: string, mimeType: string): boolean {
  const extension = getFileExtension(fileName);
  if (extension && SUPPORTED_UPLOAD_EXTENSIONS.has(extension)) {
    return true;
  }

  return SUPPORTED_UPLOAD_MIME_TYPES.has(mimeType.toLowerCase());
}
