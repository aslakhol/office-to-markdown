"use client";

import { useState } from "react";
import { UploadButton } from "../utils/uploadthing";

export function UploadForm() {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Office to <span className="text-[hsl(280,100%,70%)]">Markdown</span>
        </h1>

        <div className="flex flex-col items-center gap-2">
          <div className="mb-4 text-center">
            <p>Upload your Office documents (DOCX, XLSX, PPTX) or PDF files</p>
            <p className="text-sm text-gray-400">Maximum file size: 16MB</p>
          </div>

          <UploadButton
            endpoint="officeUploader"
            onClientUploadComplete={(res) => {
              if (res) {
                const file = res[0];
                console.log("Upload completed:", file);
                setUploadedFileUrl(file?.url ?? null);
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
            }}
          />

          {uploadedFileUrl && (
            <div className="mt-4 text-center">
              <p className="text-green-400">File uploaded successfully!</p>
              <p className="text-sm text-gray-400">
                Processing file for conversion...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
