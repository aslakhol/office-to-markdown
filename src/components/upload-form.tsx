"use client";

import { useState } from "react";
import { UploadButton } from "../utils/uploadthing";

export function UploadForm() {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConversion = async (fileUrl: string) => {
    try {
      setIsConverting(true);
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      console.log("Conversion result:", data);
      return data.markdown;
    } catch (error) {
      console.error("Conversion error:", error);
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

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
            onClientUploadComplete={async (res) => {
              if (res) {
                const file = res[0];
                console.log("Upload completed:", file);
                setUploadedFileUrl(file?.url ?? null);

                if (file?.url) {
                  try {
                    const markdown = await handleConversion(file.url);
                    console.log("Markdown content:", markdown);
                  } catch (error) {
                    console.error("Failed to convert file:", error);
                  }
                }
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
            }}
          />

          {uploadedFileUrl && (
            <div className="mt-4 text-center">
              <p className="text-green-400">File uploaded successfully!</p>
              {isConverting ? (
                <p className="text-sm text-gray-400">
                  Converting to markdown...
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Check console for conversion result
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
