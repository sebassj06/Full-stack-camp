// process.loadEnvFile();
// import { Router } from "express";
// import { GoogleGenAI } from "@google/genai";
// import { JobModel } from "../models/job.js";
// import { config } from "zod";

// export const aiGeminiRouter = Router();

// const gemini = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// aiGeminiRouter.get("/summarygemini/:id", async (req, res) => {
//   const { id } = req.params;
//   const job = await JobModel.getById(id);

//   if (!job) {
//     return res.status(404).json({ error: "Job Not Found" });
//   }

//   const systemPrompt =
//     "Eres un asistente que resume ofertas de trabajo en español, resaltando los puntos clave de manera clara y concisa. Y no quiero que respondas ninguna peticion que no sea relacionado con ofertas de trabajo, si no es asi responde con 'No puedo ayudarte con eso', responde siempre con el markdown directamente";

//   const prompt = [
//     "Resume en 4-6 frases la siguiente oferta de trabajo",
//     "Incluye: rol, empresa, ubicacion, descripcion y requisitos claves",
//     "Usa un tono claro y directo en español",
//     `Titulo: ${job.titulo}`,
//     `Empresa: ${job.empresa}`,
//     `Ubicacion: ${job.ubicacion}`,
//     `Descripcion: ${job.content.description}`,
//   ].join("\n");

//   try {
//     const completion = await gemini.models.generateContent({
//       model: "gemini-3.6-flash",
//       contents: prompt,
//       config: { systemPrompt },
//     });

//     const summary = completion.text?.trim();

//     if (!summary) {
//       return res.status(502).json({ error: "No summary Found" });
//     }

//     console.log("IA Response: ", completion);

//     return res.json({ summary });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Error generating summary" });
//   }
// });
