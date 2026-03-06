"use client";

import { FormEvent, useMemo, useState } from "react";

import type {
  ConvertErrorCode,
  ConvertRequest,
  ConvertResponse,
} from "@/lib/contracts/convert";
import { isSupportedUploadFile, SUPPORTED_UPLOAD_FORMATS_LABEL } from "@/lib/upload/supported-formats";
import { useUploadThing } from "@/lib/uploadthing";

type UploadedReference = {
  fileKey: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
};

type ConvertApiError = {
  errorCode?: ConvertErrorCode;
  message?: string;
};

const ACCEPTED_FILE_TYPES = [
  ".docx",
  ".pptx",
  ".xlsx",
  ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
].join(",");

const EMPTY_MARKDOWN_MESSAGE = "Conversion API responded with empty markdown (expected while stub is active).";

function makeIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `upload-${Date.now()}`;
}

function buildPrototypeMarkdown(
  reference: UploadedReference,
  response: ConvertResponse | null,
): string {
  const markdown = response?.markdown ?? "";
  if (markdown.trim()) {
    return markdown;
  }

  const warnings = response?.warnings.length ? response.warnings.join(", ") : "none";

  return [
    "# Prototype Conversion Preview",
    "",
    `- Filename: ${reference.originalFilename}`,
    `- Mime type: ${reference.mimeType}`,
    `- Size bytes: ${reference.sizeBytes}`,
    `- File key: ${reference.fileKey}`,
    `- Detected format: ${response?.detectedFormat ?? "unknown"}`,
    `- Warnings: ${warnings}`,
    "",
    "> The current backend stub returned no markdown. This placeholder keeps the",
    "> prototype copy and download actions testable until the real converter lands.",
  ].join("\n");
}

export function UploadConvertPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [uploadedReference, setUploadedReference] = useState<UploadedReference | null>(null);
  const [convertResponse, setConvertResponse] = useState<ConvertResponse | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const { isUploading, startUpload } = useUploadThing("officeDocument", {
    onUploadError: (error) => {
      setUploadError(error.message || "Upload failed.");
    },
  });

  const isSubmitting = isUploading || isConverting;
  const buttonLabel = useMemo(() => {
    if (isUploading) {
      return "Uploading...";
    }
    if (isConverting) {
      return "Converting...";
    }
    return "Upload and send reference to convert API";
  }, [isConverting, isUploading]);

  const renderedMarkdown = useMemo(() => {
    if (!uploadedReference) {
      return "";
    }

    return buildPrototypeMarkdown(uploadedReference, convertResponse);
  }, [convertResponse, uploadedReference]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setUploadError(null);
    setConvertError(null);
    setUploadedReference(null);
    setConvertResponse(null);
    setCopyStatus(null);

    if (!selectedFile) {
      setUploadError("Select a file before submitting.");
      return;
    }

    if (!isSupportedUploadFile(selectedFile.name, selectedFile.type)) {
      setUploadError(`Unsupported file format. Supported formats: ${SUPPORTED_UPLOAD_FORMATS_LABEL}.`);
      return;
    }

    const uploadResult = await startUpload([selectedFile]);
    if (!uploadResult || uploadResult.length === 0) {
      setUploadError((currentMessage) => currentMessage ?? "Upload did not return a file reference.");
      return;
    }

    const uploadedFile = uploadResult[0];
    const reference = uploadedFile.serverData;
    if (!reference) {
      setUploadError("Upload completed without server reference metadata.");
      return;
    }

    const uploadedFileReference: UploadedReference = {
      fileKey: reference.fileKey,
      mimeType: reference.mimeType,
      originalFilename: reference.originalFilename,
      sizeBytes: reference.sizeBytes,
    };
    setUploadedReference(uploadedFileReference);

    const convertPayload: ConvertRequest = {
      fileKey: uploadedFileReference.fileKey,
      idempotencyKey: makeIdempotencyKey(),
      mimeType: uploadedFileReference.mimeType,
      originalFilename: uploadedFileReference.originalFilename,
      sizeBytes: uploadedFileReference.sizeBytes,
    };

    setIsConverting(true);
    try {
      const response = await fetch("/api/convert", {
        body: JSON.stringify(convertPayload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as ConvertResponse | ConvertApiError | null;
      if (!response.ok) {
        if (response.status === 501 && payload && typeof payload === "object" && "markdown" in payload) {
          setConvertResponse(payload as ConvertResponse);
          return;
        }

        const message =
          payload && typeof payload === "object" && "message" in payload
            ? payload.message
            : `Conversion failed with status ${response.status}.`;
        setConvertError(message || `Conversion failed with status ${response.status}.`);
        return;
      }

      if (!payload || typeof payload !== "object" || !("markdown" in payload)) {
        setConvertError("Conversion response did not match the expected contract.");
        return;
      }

      setConvertResponse(payload as ConvertResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected conversion failure.";
      setConvertError(message);
    } finally {
      setIsConverting(false);
    }
  }

  async function handleCopyMarkdown() {
    if (!renderedMarkdown) {
      return;
    }

    try {
      await navigator.clipboard.writeText(renderedMarkdown);
      setCopyStatus("Markdown copied.");
    } catch {
      setCopyStatus("Clipboard write failed.");
    }
  }

  function handleDownloadMarkdown() {
    if (!renderedMarkdown || !uploadedReference) {
      return;
    }

    const blob = new Blob([renderedMarkdown], { type: "text/markdown;charset=utf-8" });
    const fileBaseName = uploadedReference.originalFilename.replace(/\.[^.]+$/, "") || "conversion";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileBaseName}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="prototype-grid">
      <div className="panel panel-accent">
        <h2>Prototype upload flow</h2>
        <p className="helper-text">
          Upload a single document, forward only the file reference to the convert API, then preview the markdown
          result.
        </p>
        <p className="helper-text">Supported formats: {SUPPORTED_UPLOAD_FORMATS_LABEL}</p>

        <form className="upload-form" onSubmit={handleSubmit}>
          <label htmlFor="office-file">Office file</label>
          <input
            accept={ACCEPTED_FILE_TYPES}
            id="office-file"
            name="office-file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              setSelectedFile(file);
              setUploadError(null);
              setConvertError(null);
              setCopyStatus(null);
            }}
            type="file"
          />
          <button disabled={isSubmitting || !selectedFile} type="submit">
            {buttonLabel}
          </button>
        </form>

        {uploadError ? (
          <p className="error-text" role="alert">
            Upload error: {uploadError}
          </p>
        ) : null}

        {convertError ? (
          <p className="error-text" role="alert">
            Convert error: {convertError}
          </p>
        ) : null}

        {uploadedReference ? (
          <div className="result-block">
            <h3>Uploaded reference</h3>
            <dl>
              <dt>fileKey</dt>
              <dd>{uploadedReference.fileKey}</dd>
              <dt>originalFilename</dt>
              <dd>{uploadedReference.originalFilename}</dd>
              <dt>mimeType</dt>
              <dd>{uploadedReference.mimeType}</dd>
              <dt>sizeBytes</dt>
              <dd>{uploadedReference.sizeBytes}</dd>
            </dl>
          </div>
        ) : null}
      </div>

      <div className="panel panel-dark">
        <div className="result-header">
          <div>
            <h2>Markdown preview</h2>
            <p className="helper-text helper-text-inverse">
              {convertResponse?.markdown ? "Live response from convert API." : EMPTY_MARKDOWN_MESSAGE}
            </p>
          </div>
          <div className="action-row">
            <button disabled={!renderedMarkdown} onClick={handleCopyMarkdown} type="button">
              Copy markdown
            </button>
            <button disabled={!renderedMarkdown} onClick={handleDownloadMarkdown} type="button">
              Download .md
            </button>
          </div>
        </div>

        <div className="markdown-card">
          <pre>{renderedMarkdown || "Upload a supported file to generate a markdown preview."}</pre>
        </div>

        {copyStatus ? <p className="status-text">{copyStatus}</p> : null}

        {convertResponse ? (
          <div className="result-meta">
            <p>detectedFormat: {convertResponse.detectedFormat}</p>
            <p>inputFormat: {convertResponse.inputFormat}</p>
            <p>warnings: {convertResponse.warnings.join(", ") || "none"}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
