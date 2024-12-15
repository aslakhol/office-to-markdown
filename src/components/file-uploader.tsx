"use client"

import { useState } from "react"
import { Upload } from 'lucide-react'
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

const SUPPORTED_FILES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/*",
  "audio/*",
  "text/*",
]

export function FileUploader({ onFileProcessed }: { onFileProcessed: (markdown: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      // Simulate file processing with progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // In a real implementation, you would send the file to your API here
      const mockMarkdown = `# ${file.name}\n\nThis is a preview of the converted markdown content.`
      onFileProcessed(mockMarkdown)
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Convert to Markdown</CardTitle>
        <CardDescription>
          Upload your document to convert it to markdown format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="grid w-full gap-4">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 mb-2" />
                <p className="mb-2 text-sm">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, XLSX, PPTX, images, audio, and more
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={SUPPORTED_FILES.join(",")}
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
            {isUploading && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

