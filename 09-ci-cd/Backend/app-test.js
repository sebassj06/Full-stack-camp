import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import app from "./app.js";

let server;
const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

// antes de todos los tests, se ejecuta UNA vez, para levantar el servidor
before(async () => {
  return new Promise((resolve, reject) => {
    server = app.listen(PORT, () => resolve());
    server.on("error", reject);
  });
});

// después de todos los tests, se ejecuta UNA vez, para cerrar el servidor
after(async () => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

describe("GET /jobs", () => {
  test("debe responder con 200 y un array de trabajos", async () => {
    const response = await fetch(`${BASE_URL}/jobs`);
    assert.strictEqual(response.status, 200);

    const json = await response.json();
    assert.ok(Array.isArray(json.data), "La respuesta debe ser un array");
  });

  test("debe filtrar trabajos por tecnología", async () => {
    const tech = "react";
    const response = await fetch(`${BASE_URL}/jobs?technology=${tech}`);
    assert.strictEqual(response.status, 200);

    const json = await response.json();
    console.log(json);
    assert.ok(
      json.data.every((job) => job.data.technology.includes(tech)),
      `Todos los trabajos deben incluir la tecnología ${tech}`,
    );
  });
});

describe("POST /jobs", () => {
  test("Debe responder con 200 y el trabajo agregado", async () => {
    const newJob = {
      titulo: "BIEEEEEEEEEEN",
      empresa: "Tech Solutions Inc.",
      ubicacion: "Remoto",
      descripcion:
        "Buscamos un ingeniero de software con experiencia en desarrollo web y conocimientos en JavaScript, React y Node.js. El candidato ideal debe ser capaz de trabajar en equipo y tener buenas habilidades de comunicación.",
      data: {
        technology: ["react", "node", "javascript"],
        modalidad: "remoto",
        nivel: "senior",
      },
    };
    const response = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJob),
    });

    const json = await response.json();
    console.log("=== RESPUESTA POST ===", json);
    assert.strictEqual(response.status, 201);
    assert.ok(json.id, "El backend debe otorgar un id");
    assert.strictEqual(json.titulo, newJob.titulo);
  });
});
