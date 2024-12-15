"use client"

import { useState } from "react"
import { Check, Copy } from 'lucide-react'
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

export function MarkdownDisplay({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generated Markdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={markdown}
          readOnly
          className="min-h-[200px] font-mono"
        />
      </CardContent>
      <CardFooter className="justify-end">
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
      </CardFooter>
    </Card>
  )
}

