import { spawn } from "child_process";
import path from "path";

interface ConversionResult {
  success: boolean;
  markdown: string | null;
  error: string | null;
}

export async function convertToMarkdown(
  filePath: string,
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const projectRoot = process.cwd();
    const scriptPath = path.join(
      projectRoot,
      "src",
      "server",
      "python",
      "converter.py",
    );
    const pythonPath =
      process.platform === "win32"
        ? path.join(projectRoot, ".venv", "Scripts", "python.exe")
        : path.join(projectRoot, ".venv", "bin", "python");

    const pythonProcess = spawn(pythonPath, [scriptPath, filePath]);

    let outputData = "";
    let errorData = "";

    if (pythonProcess.stdout) {
      pythonProcess.stdout.setEncoding("utf-8");
      pythonProcess.stdout.on("data", (chunk: string) => {
        outputData += chunk;
      });
    }

    if (pythonProcess.stderr) {
      pythonProcess.stderr.setEncoding("utf-8");
      pythonProcess.stderr.on("data", (chunk: string) => {
        errorData += chunk;
      });
    }

    pythonProcess.on("close", (code: number | null) => {
      if (code !== 0) {
        resolve({
          success: false,
          markdown: null,
          error: errorData || "Python process failed",
        });
        return;
      }

      try {
        const result = JSON.parse(outputData) as ConversionResult;
        resolve(result);
      } catch (e) {
        console.error("Failed to parse Python output:", e);
        resolve({
          success: false,
          markdown: null,
          error: "Failed to parse Python output",
        });
      }
    });
  });
}
