"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useReducer, useState } from "react";

import type {
  ConvertErrorCode,
  ConvertRequest,
  ConvertResponse,
} from "@/lib/contracts/convert";
import { isSupportedUploadFile, SUPPORTED_UPLOAD_FORMATS_LABEL } from "@/lib/upload/supported-formats";

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

export type UploadFileHandler = (file: File) => Promise<UploadedReference>;

type PrototypePhase = "idle" | "uploading" | "converting" | "succeeded" | "failed";

type PrototypeState = {
  convertResponse: ConvertResponse | null;
  errorMessage: string | null;
  phase: PrototypePhase;
  selectedFile: File | null;
  uploadedReference: UploadedReference | null;
};

type PrototypeAction =
  | { type: "file-selected"; file: File | null }
  | { type: "upload-started" }
  | { type: "upload-succeeded"; reference: UploadedReference }
  | { type: "convert-succeeded"; response: ConvertResponse }
  | { type: "request-failed"; message: string };

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
const MOCK_UPLOAD_DRIVER = "mock";
const UploadConvertPanelWithUploadThing = dynamic(
  () =>
    import("./upload-convert-panel-uploadthing").then((module) => ({
      default: module.UploadConvertPanelWithUploadThing,
    })),
  { ssr: false },
);

const CONVERT_ERROR_MESSAGES: Record<ConvertErrorCode, string> = {
  unsupported_format: "This prototype only supports DOCX, PPTX, XLSX, and PDF files.",
  missing_dependency: "The converter is missing a required server dependency.",
  payload_too_large: "This file is too large for the current prototype limit.",
  conversion_failed: "The converter could not extract markdown from this file.",
  storage_read_failed: "The uploaded file could not be read back from storage.",
  timeout: "The conversion took too long and timed out.",
  rate_limited: "Too many conversion requests are in flight. Try again shortly.",
  invalid_file: "The uploaded file metadata or request payload was invalid.",
};

const initialState: PrototypeState = {
  convertResponse: null,
  errorMessage: null,
  phase: "idle",
  selectedFile: null,
  uploadedReference: null,
};

function makeIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `upload-${Date.now()}`;
}

function prototypeReducer(state: PrototypeState, action: PrototypeAction): PrototypeState {
  switch (action.type) {
    case "file-selected":
      return {
        convertResponse: null,
        errorMessage: null,
        phase: "idle",
        selectedFile: action.file,
        uploadedReference: null,
      };
    case "upload-started":
      return {
        ...state,
        convertResponse: null,
        errorMessage: null,
        phase: "uploading",
        uploadedReference: null,
      };
    case "upload-succeeded":
      return {
        ...state,
        errorMessage: null,
        phase: "converting",
        uploadedReference: action.reference,
      };
    case "convert-succeeded":
      return {
        ...state,
        convertResponse: action.response,
        errorMessage: null,
        phase: "succeeded",
      };
    case "request-failed":
      return {
        ...state,
        convertResponse: null,
        errorMessage: action.message,
        phase: "failed",
      };
    default:
      return state;
  }
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

function getUserFacingConvertError(
  payload: ConvertApiError | ConvertResponse | null,
  status: number,
): string {
  if (payload && typeof payload === "object" && "errorCode" in payload && payload.errorCode) {
    return CONVERT_ERROR_MESSAGES[payload.errorCode] ?? `Conversion failed with status ${status}.`;
  }

  if (payload && typeof payload === "object" && "message" in payload && payload.message) {
    return payload.message;
  }

  return `Conversion failed with status ${status}.`;
}

export function UploadConvertPanel() {
  if (process.env.NEXT_PUBLIC_PROTOTYPE_UPLOAD_DRIVER === MOCK_UPLOAD_DRIVER) {
    return <UploadConvertPanelMock />;
  }

  return <UploadConvertPanelWithUploadThing />;
}

function UploadConvertPanelMock() {
  const uploadFile: UploadFileHandler = async (file) => ({
    fileKey: `mock-${file.name.replace(/\s+/g, "-").toLowerCase()}`,
    mimeType: file.type || "application/octet-stream",
    originalFilename: file.name,
    sizeBytes: file.size,
  });

  return <UploadConvertPanelBody uploadFile={uploadFile} />;
}

export function UploadConvertPanelBody({ uploadFile }: { uploadFile: UploadFileHandler }) {
  const [state, dispatch] = useReducer(prototypeReducer, initialState);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const isSubmitting = state.phase === "uploading" || state.phase === "converting";
  const buttonLabel = useMemo(() => {
    if (state.phase === "uploading") {
      return "Uploading...";
    }
    if (state.phase === "converting") {
      return "Converting...";
    }
    return "Upload and send reference to convert API";
  }, [state.phase]);

  const renderedMarkdown = useMemo(() => {
    if (!state.uploadedReference) {
      return "";
    }

    return buildPrototypeMarkdown(state.uploadedReference, state.convertResponse);
  }, [state.convertResponse, state.uploadedReference]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopyStatus(null);

    if (!state.selectedFile) {
      dispatch({ type: "request-failed", message: "Select a file before submitting." });
      return;
    }

    if (!isSupportedUploadFile(state.selectedFile.name, state.selectedFile.type)) {
      dispatch({
        type: "request-failed",
        message: `Unsupported file format. Supported formats: ${SUPPORTED_UPLOAD_FORMATS_LABEL}.`,
      });
      return;
    }

    dispatch({ type: "upload-started" });
    try {
      const uploadedReference = await uploadFile(state.selectedFile);
      dispatch({ type: "upload-succeeded", reference: uploadedReference });

      const convertPayload: ConvertRequest = {
        fileKey: uploadedReference.fileKey,
        idempotencyKey: makeIdempotencyKey(),
        mimeType: uploadedReference.mimeType,
        originalFilename: uploadedReference.originalFilename,
        sizeBytes: uploadedReference.sizeBytes,
      };

      const response = await fetch("/api/convert", {
        body: JSON.stringify(convertPayload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as ConvertResponse | ConvertApiError | null;
      if (!response.ok) {
        if (response.status === 501 && payload && typeof payload === "object" && "markdown" in payload) {
          dispatch({ type: "convert-succeeded", response: payload as ConvertResponse });
          return;
        }

        dispatch({
          type: "request-failed",
          message: getUserFacingConvertError(payload, response.status),
        });
        return;
      }

      if (!payload || typeof payload !== "object" || !("markdown" in payload)) {
        dispatch({
          type: "request-failed",
          message: "Conversion response did not match the expected contract.",
        });
        return;
      }

      dispatch({ type: "convert-succeeded", response: payload as ConvertResponse });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected conversion failure.";
      dispatch({ type: "request-failed", message });
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
    if (!renderedMarkdown || !state.uploadedReference) {
      return;
    }

    const blob = new Blob([renderedMarkdown], { type: "text/markdown;charset=utf-8" });
    const fileBaseName = state.uploadedReference.originalFilename.replace(/\.[^.]+$/, "") || "conversion";
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
              dispatch({ type: "file-selected", file });
              setCopyStatus(null);
            }}
            type="file"
          />
          <button disabled={isSubmitting || !state.selectedFile} type="submit">
            {buttonLabel}
          </button>
        </form>

        {state.errorMessage ? (
          <p className="error-text" role="alert">
            Prototype error: {state.errorMessage}
          </p>
        ) : null}

        {state.uploadedReference ? (
          <div className="result-block">
            <h3>Uploaded reference</h3>
            <dl>
              <dt>fileKey</dt>
              <dd>{state.uploadedReference.fileKey}</dd>
              <dt>originalFilename</dt>
              <dd>{state.uploadedReference.originalFilename}</dd>
              <dt>mimeType</dt>
              <dd>{state.uploadedReference.mimeType}</dd>
              <dt>sizeBytes</dt>
              <dd>{state.uploadedReference.sizeBytes}</dd>
            </dl>
          </div>
        ) : null}
      </div>

      <div className="panel panel-dark">
        <div className="result-header">
          <div>
            <h2>Markdown preview</h2>
            <p className="helper-text helper-text-inverse">
              {state.convertResponse?.markdown ? "Live response from convert API." : EMPTY_MARKDOWN_MESSAGE}
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
        {!copyStatus && state.phase === "uploading" ? <p className="status-text">Uploading reference...</p> : null}
        {!copyStatus && state.phase === "converting" ? <p className="status-text">Waiting for markdown...</p> : null}

        {state.convertResponse ? (
          <div className="result-meta">
            <p>detectedFormat: {state.convertResponse.detectedFormat}</p>
            <p>inputFormat: {state.convertResponse.inputFormat}</p>
            <p>
              timings: download {state.convertResponse.timings.downloadMs ?? 0}ms / convert{" "}
              {state.convertResponse.timings.convertMs ?? 0}ms / total {state.convertResponse.timings.totalMs ?? 0}ms
            </p>
            <p>warnings:</p>
            {state.convertResponse.warnings.length > 0 ? (
              <ul className="warning-list">
                {state.convertResponse.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p>none</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
