import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let's parse large payloads since audio can be large
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  let ai: GoogleGenAI | null = null;
  function getGeminiSDK() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please configure your Gemini API Key in the Secrets panel.");
    }
    if (!ai) {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
    return ai;
  }

  // API end points FIRST
  app.post("/api/transcribe-sermon", async (req, res) => {
    try {
      const { audio, mimeType, customPrompt } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "No audio data provided." });
      }

      const client = getGeminiSDK();
      
      const audioPart = {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audio, // base64 encoded
        }
      };

      const systemPrompt = `You are a professional scribe and theologian helping a church transcribe and summarize Sunday sermon audio.
You will receive sermon audio. Please transcribe the audio with high accuracy and then generate structured summaries, scriptures, key lessons, and a set of beautifully structured text slides for social media.
Make slide details extremely impactful, spiritual, and perfect for social media quote cards. Slide titles should be very short and neat (max 4-5 words).`;

      const promptUser = customPrompt || "Analyze this sermon audio. Transcribe the spoken text exactly, then produce a detailed pastoral summary, key scriptures referenced or fitting, list of 4-5 key lessons for the congregation, and 5 highly-sharable slide cards for social media.";

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          audioPart,
          { text: promptUser }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING, description: "Exactly transcribe the sermon content as clearly as possible." },
              topic: { type: Type.STRING, description: "Main topic/title of the sermon." },
              keyScripture: { type: Type.STRING, description: "The major Bible verses referenced (e.g. John 3:16, Philippians 4:13) or suitable for this topic." },
              summary: { type: Type.STRING, description: "A highly detailed, pastoral, paragraph-by-paragraph sermon summary in Markdown format." },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4-5 main points or action steps for Christians to apply this week."
              },
              socialSlides: {
                type: Type.ARRAY,
                description: "A deck of 4 to 6 slides perfect for Instagram or status updates.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING, description: "Catchy modern slide title (3-5 words)." },
                    subTitle: { type: Type.STRING, description: "A supporting caption or scriptural context." },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Max 2 short, crisp, highly visual bullet points (or quotes)."
                    },
                    scripture: { type: Type.STRING, description: "Bible verse citation (e.g., Romans 8:28) related to this particular slide's focus." },
                    quote: { type: Type.STRING, description: "A central impactful 'pastor quote' extracted from the transcript or summarized perfectly." },
                    theme: { type: Type.STRING, description: "A theme name: 'midnight' (dark charcoal & gold), 'warm-sunset' (coral & white), 'royal-gold' (navy & gold), 'olive-branch' (sage & cream), or 'ambient-teal'." }
                  },
                  required: ["slideNumber", "title", "bullets", "quote", "theme"]
                }
              }
            },
            required: ["transcript", "topic", "keyScripture", "summary", "keyTakeaways", "socialSlides"]
          }
        }
      });

      const dataResult = response.text;
      if (!dataResult) {
        return res.status(500).json({ error: "Gemini returned empty content." });
      }

      res.json(JSON.parse(dataResult));

    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ 
        error: error.message || "An unexpected error occurred during transcription."
      });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

startServer();
