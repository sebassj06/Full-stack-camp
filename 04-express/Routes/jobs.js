import { Router } from "express";
import { jobsController } from "../controllers/jobs.js";
import { validateJob, validatePartialJob } from "../Schemas/jobs.js";

const jobRouter = Router();

function validateCreate(req, res, next) {
  const result = validateJob(req.body);
  if (result.success) {
    req.body = result.data;
    res.status(201);
    return next();
  }

  return res
    .status(400)
    .json({ error: "Invalid Request", details: result.error.errors });
}

function validateUpdate(req, res, next) {
  const result = validatePartialJob(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  }

  return res
    .status(400)
    .json({ error: "Invalid Request", details: result.error.errors });
}

jobRouter.get("/", jobsController.getAll);
jobRouter.get("/:id", jobsController.getID);

jobRouter.post("/", validateCreate, jobsController.create);
jobRouter.patch("/:id", validateUpdate, jobsController.partialUpdate);

jobRouter.put("/:id", jobsController.update);
jobRouter.delete("/:id", jobsController.delete);

export default jobRouter;
