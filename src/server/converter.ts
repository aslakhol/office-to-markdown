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
    // Path to the Python script and virtual environment
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

    console.log("Converting file:", filePath);
    console.log("Using Python path:", pythonPath);
    console.log("Using script path:", scriptPath);

    // Spawn Python process from virtual environment
    const pythonProcess = spawn(pythonPath, [scriptPath, filePath]);

    let outputData = "";
    let errorData = "";

    // Collect stdout data
    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      console.log("Python stdout:", chunk);
      outputData += chunk;
    });

    // Collect stderr data
    pythonProcess.stderr.on("data", (data) => {
      const chunk = data.toString();
      console.error("Python stderr:", chunk);
      errorData += chunk;
    });

    // Handle process completion
    pythonProcess.on("close", (code) => {
      console.log("Python process exited with code:", code);

      if (code !== 0) {
        console.error("Python process failed:", errorData);
        resolve({
          success: false,
          markdown: null,
          error: errorData || "Python process failed",
        });
        return;
      }

      try {
        console.log("Raw Python output:", outputData);
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
