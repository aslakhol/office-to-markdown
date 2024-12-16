"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import prettier from "prettier/standalone";
import markdownParser from "prettier/parser-markdown";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Generated Markdown</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="w-[100px]"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="raw" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="raw">Markdown</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="raw">
            <div className="relative">
              <SyntaxHighlighter
                language="markdown"
                style={vscDarkPlus}
                className="!m-0 rounded-md !bg-gray-900"
              >
                {formattedMarkdown}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <div className="prose prose-sm max-w-none rounded-md border p-4 dark:prose-invert">
              <ReactMarkdown>{formattedMarkdown}</ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
