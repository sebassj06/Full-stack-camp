import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", async (req, res) => {
  try {
    const healthData = {
      status: "OK",
      timestamp: Date.now(),
      uptime: process.uptime(),
      enviroment: process.env.NODE_ENV || "Development",
    };

    return res.status(200).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      message: error.message,
      timestamp: Date.now(),
    });
  }
});
