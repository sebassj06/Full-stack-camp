import { JobModel } from "../models/job.js";

export class jobsController {
  static async getAll(req, res) {
    const { level, text, technology, type, limit = 10, offset = 0 } = req.query;

    const { jobs, total } = await JobModel.getAll({
      level,
      text,
      technology,
      type,
      limit,
      offset,
    });

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    return res.json({
      data: jobs,
      total: total,
      limit: limitNumber,
      offset: offsetNumber,
    });
  }

  static async getID(req, res) {
    const { id } = req.params;
    const job = await JobModel.getById(id);

    if (!job) {
      return res.status(404).json({ error: "Job Not Found" });
    }

    return res.json(job);
  }

  static async create(req, res) {
    const { titulo, empresa, ubicacion, data } = req.body;

    const newJob = await JobModel.create({ titulo, empresa, ubicacion, data });

    // lo haremos en una db con un INSERT
    return res.status(201).json(newJob);
  }

  static async update(req, res) {
    const { id } = req.params;
    const { titulo, empresa, ubicacion, data, descripcion } = req.body;

    // 2. Validar que vengan los datos obligatorios (para un PUT estricto)
    if (!titulo || !empresa || !ubicacion) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const job = await JobModel.update({
      id,
      titulo,
      empresa,
      ubicacion,
      descripcion,
      data,
    });

    if (!job) {
      return res.status(404).json({ message: "Trabajo no encontrado" });
    }

    // 4. Retornar el objeto actualizado (buena práctica REST)
    return res.status(200).json(job);
  }

  static async partialUpdate(req, res) {
    const { id } = req.params;
    const { titulo, empresa, ubicacion, descripcion, data } = req.body;

    const job = await JobModel.partialUpdate({
      id,
      titulo,
      empresa,
      ubicacion,
      descripcion,
      data,
    });

    if (!job) {
      return res.status(404).json({ message: "Trabajo no encontrado" });
    }

    // 4. Retornar el recurso actualizado
    return res.status(200).json(job);
  }

  static async delete(req, res) {
    const { id } = req.params;

    const deleteJob = await JobModel.delete({ id });

    if (!deleteJob) {
      return res.status(404).json({ error: "Este trabajo no existe" });
    }

    return res.status(200).json({ message: "Trabajo borrado exitosamente" });
  }
}
