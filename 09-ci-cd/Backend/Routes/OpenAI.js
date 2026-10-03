try {
  process.loadEnvFile(); // Lee automaticamente el archivo .env
} catch (error) {}
import { Router } from "express";
import OpenAI from "openai";
import { JobModel } from "../models/job.js";
import { CONFIG } from "../config.js";
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1min
  limit: 5,
  message: "Demasiadas peticiones",
  legacyHeaders: false,
  standardHeaders: "draft-8",
});

export const aiRouter = Router();
aiRouter.use(limiter);

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

aiRouter.get("/summary/:id", async (req, res) => {
  const { id } = req.params;
  const job = await JobModel.getById(id);

  if (!job) {
    return res.status(404).json({ error: "Job Not Found" });
  }

  const systemPrompt =
    "Eres un asistente que resume ofertas de trabajo en español, resaltando los puntos clave de manera clara y concisa. Y no quiero que respondas ninguna peticion que no sea relacionado con ofertas de trabajo, si no es asi responde con 'No puedo ayudarte con eso', responde siempre con el markdown directamente";

  const prompt = [
    "Resume en 4-6 frases la siguiente oferta de trabajo",
    "Incluye: rol, empresa, ubicacion, descripcion y requisitos claves",
    "Usa un tono claro y directo en español",
    `Titulo: ${job.titulo}`,
    `Empresa: ${job.empresa}`,
    `Ubicacion: ${job.ubicacion}`,
    `Descripcion: ${job.content.description}`,
  ].join("\n");

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = await openai.chat.completions.create({
      model: CONFIG.MODEL_AI,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    for await (const part of stream) {
      const content = part.choices[0].delta.content;
      if (content) {
        res.write(content);
      }
    }

    return res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.setHeaders("Content-Type", "application/json");
      return res.status(500).json({ error: "Error generating summary" });
    }
    return res.end();
  }
});
