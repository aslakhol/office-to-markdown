"use client"

import { useState } from "react"
import { SiteHeader } from "~/components/site-header"
import { FileUploader } from "~/components/file-uploader"
import { MarkdownDisplay } from "~/components/markdown-display"
import { Features } from "~/components/features"

export default function Home() {
  const [markdown, setMarkdown] = useState<string>("")

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8 grid gap-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Convert Office Files to Markdown
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Upload your documents and convert them to clean, formatted markdown in seconds
          </p>
        </div>
        <FileUploader onFileProcessed={setMarkdown} />
        {markdown && <MarkdownDisplay markdown={markdown} />}
        <div className="border-t pt-12">
          <Features />
        </div>
      </main>
    </div>
  )
}

