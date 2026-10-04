import express from "express";
import jobRouter from "./Routes/jobs.js";
import { corsMiddleware } from "./middlewares/cors.js";
import { DEFAULTS } from "./config.js";
import { aiRouter } from "./Routes/OpenAI.js";
import { healthRouter } from "./Routes/health.js";

const PORT = process.env.PORT ?? DEFAULTS.PORT;
const app = express();

app.set("trust proxy", 1);

app.use(corsMiddleware());
app.use(express.json());

app.use("/jobs", jobRouter);
app.use("/ai", aiRouter);
app.use("/health", healthRouter);

if (!process.env.NODE_ENV) {
  app.listen(PORT, () => {
    console.log(`Servidor levantado en http://localhost:${PORT}`);
  });
}

export default app;
