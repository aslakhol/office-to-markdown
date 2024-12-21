import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { convertToMarkdown } from "~/server/converter";
import path from "path";
import os from "os";

interface ConvertRequest {
  fileUrl: string;
}

export async function POST(req: Request) {
  let tempFilePath: string | undefined;

  try {
    const data = (await req.json()) as ConvertRequest;

    if (!data.fileUrl) {
      return NextResponse.json(
        { error: "No file URL provided" },
        { status: 400 },
      );
    }

    // Download the file from the URL
    const response = await fetch(data.fileUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 },
      );
    }

    // Create a temporary file path using os.tmpdir()
    tempFilePath = path.join(
      os.tmpdir(),
      `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );

    // Save the file
    const buffer = await response.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(buffer));

    // Convert the file
    const result = await convertToMarkdown(tempFilePath);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ markdown: result.markdown });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    // Clean up the temporary file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error("Failed to clean up temporary file:", error);
      }
    }
  }
}
