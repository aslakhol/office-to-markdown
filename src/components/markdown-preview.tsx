"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import * as Tabs from "@radix-ui/react-tabs";
import { Copy, Check } from "lucide-react";
import prettier from "prettier/standalone";
import markdownParser from "prettier/parser-markdown";

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [formattedMarkdown, setFormattedMarkdown] = useState(markdown);

  useEffect(() => {
    const formatMarkdown = async () => {
      try {
        const formatted = await prettier.format(markdown, {
          parser: "markdown",
          plugins: [markdownParser],
        });
        setFormattedMarkdown(formatted);
      } catch (err) {
        console.error("Failed to format markdown:", err);
        setFormattedMarkdown(markdown); // Fallback to unformatted markdown
      }
    };

    formatMarkdown();
  }, [markdown]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
      <Tabs.Root defaultValue="raw" className="w-full">
        <div className="flex items-center justify-between border-b bg-gray-100 px-4 py-2">
          <Tabs.List className="flex gap-2">
            <Tabs.Trigger
              value="raw"
              className="rounded-md px-3 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Markdown
            </Tabs.Trigger>
            <Tabs.Trigger
              value="preview"
              className="rounded-md px-3 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Preview
            </Tabs.Trigger>
          </Tabs.List>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy markdown</span>
              </>
            )}
          </button>
        </div>

        <Tabs.Content value="raw" className="p-4">
          <SyntaxHighlighter
            language="markdown"
            style={vscDarkPlus}
            className="!m-0 rounded-md !bg-gray-900"
          >
            {formattedMarkdown}
          </SyntaxHighlighter>
        </Tabs.Content>

        <Tabs.Content
          value="preview"
          className="prose prose-sm dark:prose-invert max-w-none p-4"
        >
          <ReactMarkdown>{formattedMarkdown}</ReactMarkdown>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
