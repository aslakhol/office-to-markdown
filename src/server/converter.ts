import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";

interface ConversionResult {
  success: boolean;
  markdown: string | null;
  error: string | null;
}

function findPythonPath(): string {
  console.log("Environment:", process.env.VERCEL ? "Vercel" : "Local");

  if (!process.env.VERCEL) {
    return ".venv/bin/python";
  }

  try {
    // Try to find Python using 'which'
    const whichPython = execSync("which python3").toString().trim();
    console.log("Python path from which:", whichPython);
    return whichPython;
  } catch (e) {
    console.log("Error finding Python with 'which':", e);
  }

  // List common Python paths and check if they exist
  const commonPaths = [
    "/var/lang/bin/python3",
    "/usr/bin/python3",
    "/usr/local/bin/python3",
    "/opt/python/python3",
    process.env.PYTHON_PATH,
  ].filter(Boolean);

  console.log("Checking these Python paths:", commonPaths);

  for (const pythonPath of commonPaths) {
    try {
      if (pythonPath && fs.existsSync(pythonPath)) {
        console.log("Found existing Python path:", pythonPath);
        return pythonPath;
      }
    } catch (e) {
      console.log("Error checking path:", pythonPath, e);
    }
  }

  // List contents of some common directories
  const dirsToCheck = ["/var/lang/bin", "/usr/bin", "/usr/local/bin"];
  for (const dir of dirsToCheck) {
    try {
      const files = fs.readdirSync(dir);
      console.log(
        `Contents of ${dir}:`,
        files.filter((f) => f.includes("python")),
      );
    } catch (e) {
      console.log(`Error reading directory ${dir}:`, e);
    }
  }

  console.log("Falling back to 'python3' and letting PATH resolve it");
  return "python3";
}

export async function convertToMarkdown(
  filePath: string,
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const projectRoot = process.cwd();
    console.log("Project root:", projectRoot);

    const scriptPath = path.join(
      projectRoot,
      "src",
      "server",
      "python",
      "converter.py",
    );
    console.log("Script path:", scriptPath);

    const pythonPath = findPythonPath();
    console.log("Selected Python path:", pythonPath);

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

    pythonProcess.on("error", (err) => {
      console.error("Python process error:", err);
      resolve({
        success: false,
        markdown: null,
        error: `Failed to start Python process: ${err.message}`,
      });
    });
  });
}
