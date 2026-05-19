import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { exec } from "child_process";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API: Virtual Compile C Code (AI-Powered)
  app.post("/api/compile", async (req, res) => {
    const { code, config, studentProfile } = req.body; // ← add studentProfile

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const configStr = config ? `
      - Strict Mode: ${config.strictMode ? 'ON (flag all non-standard or dangerous patterns)' : 'OFF'}
      - Show Warnings: ${config.showWarnings ? 'ON' : 'OFF'}
      - Indentation Preference: ${config.indentSize} spaces
    ` : '';

    // Adaptive ML: inject student error profile if available
    const adaptiveSection = studentProfile
      ? `\n\n${studentProfile}\n`
      : '';

    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        config: {
          systemInstruction: `You are the ALEDCS Virtual C Compiler & Tutor. Your job is to provide deep analysis of C code for beginner students.
           Linter Configuration: ${configStr}
           ${adaptiveSection}
           IMPORTANT: Communicate your 'explanation' in a friendly, encouraging English tone when guiding beginners. Do not use Tagalog.
           
           1. Compilation:
              - Identify syntax, lexical, and logical errors.
              - Return simulated GCC errors in 'stderr'.
              - Return output in 'stdout'.
           
           2. Markers:
              - Return 'markers' with exact line and column numbers.
              - Be precise. If a semicolon is missing at line 5 column 20, say exactly that.
              
           3. Explanation:
              - Provide targeted suggestions. Use specific code snippets in your explanation.
              - Explain the logic, not just the fix. Make it easy for beginners to understand.
              - If an ADAPTIVE STUDENT PROFILE was provided above, tailor your explanation
                to specifically address those recurring weaknesses.
              
           4. Debugging (Trace):
              - Provide a 'debugSteps' array. Each step is an object:
                { "line": number, "variables": { "varName": "value" }, "output": "incremental output", "callStack": [{ "name": "string", "line": number }], "insight": "Beginner-friendly explanation of why this line is executing and what the variables mean right now. Look for potential logical bugs." }
              - Trace the execution loop by loop, line by line. Include the call stack for nested function calls.
           
           Return JSON:
           {
             "success": boolean,
             "stdout": "string",
             "stderr": "string",
             "explanation": "markdown string",
             "markers": [{ "message": "string", "severity": 8|4, "startLineNumber": n, "startColumn": n, "endLineNumber": n, "endColumn": n }],
             "debugSteps": [...] 
           }`,
        },
        contents: `Analyze this C code and provide a full execution trace (debugSteps):\n\n\`\`\`c\n${code}\n\`\`\``,
      });

      let result;
      try {
        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        result = JSON.parse(jsonString);
      } catch (parseErr) {
        console.error("AI JSON Parse failed", parseErr, response.text);
        result = {
          success: false,
          stdout: "",
          stderr: "Virtual Compiler Error: Internal parsing error.",
          explanation: "I attempted to analyze your code but the output format was unexpected. Try simplifying your code."
        };
      }
      res.json(result);
    } catch (err: any) {
      console.error("Virtual Compilation failed", err);
      let errorMessage = "AI Analysis failed.";
      if (err.message) {
        try {
          // If the error message is a JSON string from Gemini, try to extract the useful message
          const parsed = JSON.parse(err.message);
          errorMessage = parsed.error?.message || err.message;
        } catch {
          errorMessage = err.message;
        }
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // API: Explain Error (Manual queries)
  app.post("/api/explain", async (req, res) => {
    const { error, code, history = [] } = req.body;
    try {
      const contents = history.map((m: any) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      contents.push({
        role: "user",
        parts: [{ text: `I have this C code:\n\n\`\`\`c\n${code}\n\`\`\`\n\nThe compiler gave me this error (or question):\n\n\`\`\`\n${error}\n\`\`\`\n\nCan you explain what went wrong and how I can fix it? If I asked you to generate code or a snippet, please provide it using Markdown code blocks (\`\`\`c).` }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        config: {
          systemInstruction: "You are an expert C programming tutor for absolute beginners. Your goal is to explain compiler errors in simple, non-intimidating English language. Do not use Tagalog. Do not just give the code fix, explain WHY it happened and what concepts the student should look at. Use a friendly, encouraging tone (like a mentor). Use Markdown for formatting.",
        },
        contents,
      });

      res.json({ explanation: response.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Generate Tests
  app.post("/api/generate-tests", async (req, res) => {
    const { code } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        config: {
          systemInstruction: "You are an expert C testing engineer. Given a C program, write basic unit tests for its functions. If it contains a `main` function, you may rename it or just provide a test suite using `assert` from `<assert.h>` to encourage good testing practices. Assume standard C libraries. Provide a brief explanation and the test code inside a Markdown code block (\`\`\`c) so it can be inserted.",
        },
        contents: `Please generate unit tests for this C code:\n\n\`\`\`c\n${code}\n\`\`\``,
      });

      res.json({ tests: response.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Format C Code (AI-Powered)
  app.post("/api/format", async (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        config: {
          systemInstruction: "You are a C code formatter. Format the provided C code according to standard K&R or Allman style (be consistent). Return ONLY the formatted code without any explanations or markdown blocks.",
        },
        contents: code,
      });

      res.json({ formattedCode: response.text });
    } catch (err: any) {
      console.error("Formatting failed", err);
      res.status(500).json({ error: "Formatting failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ALEDCS Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
