"use client";

import { UploadConvertPanelBody, type UploadFileHandler } from "@/components/upload-convert-panel";
import { useUploadThing } from "@/lib/uploadthing";

export function UploadConvertPanelWithUploadThing() {
  const { startUpload } = useUploadThing("officeDocument");

  const uploadFile: UploadFileHandler = async (file) => {
    const uploadResult = await startUpload([file]);
    if (!uploadResult || uploadResult.length === 0) {
      throw new Error("Upload did not return a file reference.");
    }

    const uploadedFile = uploadResult[0];
    const reference = uploadedFile.serverData;
    if (!reference) {
      throw new Error("Upload completed without server reference metadata.");
    }

    return {
      fileKey: reference.fileKey,
      mimeType: reference.mimeType,
      originalFilename: reference.originalFilename,
      sizeBytes: reference.sizeBytes,
    };
  };

  return <UploadConvertPanelBody uploadFile={uploadFile} />;
}
