"use client";

import { useState } from "react";
import { UploadDropzone } from "../utils/uploadthing";
import { MarkdownPreview } from "./markdown-preview";
import { Progress } from "~/components/ui/progress";
import { Card, CardContent } from "~/components/ui/card";

export function UploadForm() {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleConversion = async (fileUrl: string) => {
    try {
      setIsConverting(true);
      setError(null);

      // Simulate progress while converting
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 100);

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

      setProgress(100);
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
      setProgress(0);
    }
  };

  const handleComplete = async (res: { url: string }[]) => {
    if (res?.[0]?.url) {
      try {
        await handleConversion(res[0].url);
      } catch (error) {
        console.error("Failed to convert file:", error);
      }
    }
  };

  const handleError = (error: Error) => {
    console.error("Upload error:", error);
    setError(error.message);
  };

  return (
    <div className="mx-auto flex-1">
      <div className="container flex flex-col items-center justify-center gap-8 py-8">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
            Convert Office Documents
            <br />
            to Markdown
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Transform your documents into clean, formatted markdown in seconds.
          </p>
        </div>

        <Card className="mx-auto w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <UploadDropzone
                endpoint="officeUploader"
                onClientUploadComplete={handleComplete}
                onUploadError={handleError}
                className="ut-allowed-content:text-sm ut-allowed-content:text-muted-foreground w-full border-2 border-dashed"
                content={{
                  allowedContent:
                    "Files accepted: .pdf, .docx, .pptx, .xlsx (up to 16MB)",
                }}
              />
              {isConverting && <Progress value={progress} className="w-full" />}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="text-center text-red-500">
            <p>Error: {error}</p>
          </div>
        )}

        {markdown && !isConverting && <MarkdownPreview markdown={markdown} />}
      </div>
    </div>
  );
}
