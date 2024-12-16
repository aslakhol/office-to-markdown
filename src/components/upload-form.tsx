"use client";

import { useState } from "react";
import { UploadButton } from "../utils/uploadthing";
import { MarkdownPreview } from "./markdown-preview";

export function UploadForm() {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConversion = async (fileUrl: string) => {
    try {
      setIsConverting(true);
      setError(null);

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

      setMarkdown(data.markdown);
      return data.markdown;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to convert file";
      setError(message);
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

        <div className="flex w-full flex-col items-center gap-6">
          <div className="text-center">
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
                    await handleConversion(file.url);
                  } catch (error) {
                    console.error("Failed to convert file:", error);
                  }
                }
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
              setError(error.message);
            }}
          />

          {error && (
            <div className="text-center text-red-400">
              <p>Error: {error}</p>
            </div>
          )}

          {isConverting && (
            <div className="text-center">
              <p className="text-gray-400">Converting to markdown...</p>
            </div>
          )}

          {markdown && !isConverting && <MarkdownPreview markdown={markdown} />}
        </div>
      </div>
    </main>
  );
}
