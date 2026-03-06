import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { isSupportedUploadFile } from "@/lib/upload/supported-formats";

const f = createUploadthing();

export const uploadRouter = {
  officeDocument: f({
    blob: {
      maxFileCount: 1,
      maxFileSize: "32MB",
      minFileCount: 1,
    },
  })
    .middleware(({ files }) => {
      const invalidFiles = files.filter((file) => !isSupportedUploadFile(file.name, file.type));
      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map((file) => file.name).join(", ");
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: `Unsupported file type for upload: ${invalidNames}`,
        });
      }

      return {};
    })
    .onUploadComplete(({ file }) => ({
      fileKey: file.key,
      mimeType: file.type || "application/octet-stream",
      originalFilename: file.name,
      sizeBytes: file.size,
      storageProvider: "uploadthing",
    })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
