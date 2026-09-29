import jobs from "../jobs.json" with { type: "json" };

export class JobModel {
  static async getAll({ level, text, technology, type, limit, offset }) {
    let filteredJobs = jobs;

    if (text) {
      const searchParams = text.toLowerCase();
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.titulo?.toLowerCase().includes(searchParams) ||
          job.descripcion?.toLowerCase().includes(searchParams) ||
          job.empresa?.toLowerCase().includes(searchParams),
      );
    }

    if (technology) {
      filteredJobs = filteredJobs.filter((job) =>
        job.data.technology.includes(technology),
      );
    }

    if (type) {
      filteredJobs = filteredJobs.filter((job) =>
        job.data.modalidad.includes(type),
      );
    }

    if (level) {
      filteredJobs = filteredJobs.filter((job) =>
        job.data.nivel.includes(level),
      );
    }

    const total = filteredJobs.length;

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    const paginatedJobs = filteredJobs.slice(
      offsetNumber,
      offsetNumber + limitNumber,
    );

    return {
      jobs: paginatedJobs,
      total: total,
    };
  }

  static async getById(id) {
    const job = jobs.find((job) => {
      return job.id === id;
    });
    return job;
  }

  static async create({ titulo, empresa, ubicacion, data }) {
    const newJob = {
      id: crypto.randomUUID(),
      titulo,
      empresa,
      ubicacion,
      data,
    };

    jobs.push(newJob);

    return newJob;
  }

  static async update({ id, titulo, empresa, ubicacion, descripcion, data }) {
    // 1. Validar que el recurso existe
    const job = jobs.find((j) => String(j.id) === String(id));

    // 3. Reemplazar o actualizar propiedades
    job.titulo = titulo;
    job.empresa = empresa;
    job.ubicacion = ubicacion;
    job.descripcion = descripcion ?? job.descripcion;
    job.data = data ?? job.data;

    return job;
  }

  static async partialUpdate({
    id,
    titulo,
    empresa,
    ubicacion,
    descripcion,
    data,
  }) {
    const job = jobs.find((j) => String(j.id) === String(id));

    if (!job) return null;

    if (titulo !== undefined) job.titulo = titulo;
    if (empresa !== undefined) job.empresa = empresa;
    if (ubicacion !== undefined) job.ubicacion = ubicacion;
    if (descripcion !== undefined) job.descripcion = descripcion;
    if (data !== undefined) job.data = data;

    return job;
  }
}
