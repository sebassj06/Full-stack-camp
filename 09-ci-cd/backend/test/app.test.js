/**
 * =============================================================================
 *  Suite de pruebas del Backend (Express 5) — integración + unitarias
 * =============================================================================
 *
 *  CÓMO EJECUTAR (desde Backend/)
 *  --------------------------------
 *    node --test test/app.test.js        # sólo esta suite (recomendado)
 *    node --test "test/*.test.js"        # cualquier suite que se añada en test/
 *
 *  NO ejecutar `node --test` a secas ni `node --test test/`: en Node 24 eso
 *  rompe o bien arrastra el `app-test.js` legacy del root, que se cuelga (nota 1)
 *  y bloquea el pipeline de CI.
 * =============================================================================
 *
 *  NOTAS DE ARRANQUE
 *  -----------------
 *  1) `process.env.NODE_ENV = "test"` DEBE ejecutarse ANTES de importar app.js.
 *     `app.js` hace `if (!process.env.NODE_ENV) app.listen(PORT)`, así que sin
 *     esa variable el módulo abre el puerto 1234, nadie lo cierra y el proceso
 *     de test no termina nunca (justo lo que pasa con el app-test.js legacy).
 *     Por eso app.js se importa de forma *dinámica* (`await import`), ya que un
 *     `import` estático se evalúa por encima de este assignment.
 *
 *  2) El "store" es `Backend/jobs.json` importado como módulo JSON: es un array
 *     vivo en memoria. Las mutaciones de los tests (POST/PATCH/PUT/DELETE)
 *     persisten durante el proceso, por eso los bloques de sólo lectura se
 *     declaran primero y las aserciones de paginación comparan contra un
 *     `master` leído dentro del mismo test.
 *
 *  3) `requestJson` nunca lanza: si la respuesta no es JSON devuelve body: null.
 *     Express 5 devuelve HTML en los errores no controlados, y hay tests que
 *     sólo miran el status.
 *
 *  BUGS CONOCIDOS DE LA APP (marcados como todo(), no se tocan porque los tests
 *  viven en test/ y no deben modificar el código de producción):
 *     1) Zod v4           -> `result.error.errors` ya no existe (es `.issues`),
 *                             así que el 400 nunca incluye `details`.
 *     2) JobModel.getById / JobModel.delete comparan con `===`, por eso el job de
 *                             jobs.json con id numérico 123 es inalcanzable por
 *                             HTTP (req.params.id siempre es string).
 *     3) GET /ai/summary/:id necesita OPENROUTER_API_KEY: no se testea el
 *                             streaming contra la API real.
 *
 *  YA CORREGIDOS (estaban como todo() y ahora son tests reales):
 *     - CORS: un Origin no permitido ya responde 403 JSON en vez de 500 HTML.
 *     - DELETE /jobs/:id: existe JobModel.delete y el controller ya no usa la
 *       variable `jobs` suelta -> 200 { message: 'Trabajo borrado exitosamente' }
 *       y 404 { error: 'Este trabajo no existe' }.
 *     - PUT /jobs/:id: JobModel.update devuelve null si el id no existe ->
 *       404 { message: 'Trabajo no encontrado' } en vez de un TypeError 500.
 * =============================================================================
 */

process.env.NODE_ENV = "test";

import { describe, test, todo, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";

const { default: app } = await import("../app.js");
const { default: jobRouter } = await import("../Routes/jobs.js");
const { JobModel } = await import("../models/job.js");
const { validateJob, validatePartialJob } = await import("../Schemas/jobs.js");
const { corsMiddleware } = await import("../middlewares/cors.js");
const { DEFAULTS, CONFIG } = await import("../config.js");

// El "store" vivo: el mismo array que usa JobModel (importa jobs.json).
// Sólo se muta para reponer fixtures que el test anterior borró.
const { default: jobsStore } = await import("../jobs.json", {
  with: { type: "json" },
});

// ---------------------------------------------------------------------------
// Constantes y helpers
// ---------------------------------------------------------------------------

const HOST = "127.0.0.1";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";
const JSON_HEADERS = { "Content-Type": "application/json" };

let server; // servidor principal (app.js)
let corsServer; // mini servidor para unit-testear el factory de corsMiddleware
let BASE_URL;
let CORS_BASE_URL;

/** Levanta un express app en un puerto efímero (0 = el SO elige uno libre). */
function listen(targetApp) {
  return new Promise((resolve, reject) => {
    const instance = targetApp.listen(0, HOST, () => resolve(instance));
    instance.on("error", reject);
  });
}

/** Cierra el servidor destruyendo además las conexiones keep-alive del fetch. */
function closeServer(instance) {
  return new Promise((resolve, reject) => {
    if (!instance) return resolve();
    instance.close((err) => (err ? reject(err) : resolve()));
    instance.closeAllConnections?.();
  });
}

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, options);
}

/** Request + parseo JSON tolerante (body: null si la respuesta no es JSON). */
async function requestJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const body = await response.json().catch(() => null);
  return { status: response.status, body, headers: response.headers };
}

async function requestJsonOn(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => null);
  return { status: response.status, body, headers: response.headers };
}

/** Construye las opciones de una request con body JSON. */
function jsonOptions(payload, method = "POST") {
  return { method, headers: JSON_HEADERS, body: JSON.stringify(payload) };
}

/** Job válido para POST, con overrides puntuales. */
function validJob(overrides = {}) {
  return {
    titulo: "Desarrollador de pruebas automatizadas",
    empresa: "QA Automation Labs",
    ubicacion: "Remoto",
    descripcion: "Oferta creada por la suite de pruebas.",
    data: {
      technology: ["testing", "javascript", "node"],
      modalidad: "remoto",
      nivel: "senior",
    },
    ...overrides,
  };
}

/** Copia un objeto sin las claves indicadas (para armar payloads inválidos). */
function omit(source, keys) {
  const copy = { ...source };
  for (const key of keys) delete copy[key];
  return copy;
}

/** Payload mínimo válido, usado como base de las tablas de casos inválidos. */
function baseValidJob() {
  return {
    titulo: "Titulo valido",
    empresa: "Empresa valida",
    ubicacion: "Remoto",
    data: {
      technology: ["react", "node"],
      modalidad: "remoto",
      nivel: "senior",
    },
  };
}

/** Réplica del filtro `text` de JobModel.getAll, para verificar sus resultados. */
function matchesText(job, text) {
  const needle = String(text).toLowerCase();
  return [job.titulo, job.descripcion, job.empresa].some(
    (field) =>
      typeof field === "string" && field.toLowerCase().includes(needle),
  );
}

/** Crea un job vía HTTP y devuelve su body. */
async function createJob(overrides = {}) {
  const { status, body } = await requestJson(
    "/jobs",
    jsonOptions(validJob(overrides)),
  );
  assert.equal(status, 201, "no se pudo crear el job fixture");
  return body;
}

before(async () => {
  server = await listen(app);
  BASE_URL = `http://${HOST}:${server.address().port}`;

  // App aislada para probar el factory de cors con orígenes propios.
  const customCorsApp = express();
  customCorsApp.use(
    corsMiddleware({ acceptedOrigins: ["http://localhost:9999"] }),
  );
  customCorsApp.get("/ping", (_req, res) => res.json({ ok: true }));
  corsServer = await listen(customCorsApp);
  CORS_BASE_URL = `http://${HOST}:${corsServer.address().port}`;
});

after(async () => {
  await closeServer(server);
  await closeServer(corsServer);
});

// ===========================================================================
// 1. Infraestructura / configuración
// ===========================================================================

describe("Infraestructura de la aplicación", () => {
  test("app.js exporta una instancia de express (un middleware)", () => {
    assert.equal(typeof app, "function");
  });

  test("configura 'trust proxy' en 1 (necesario detrás de Vercel / proxies)", () => {
    assert.equal(app.get("trust proxy"), 1);
  });

  test("el servidor de pruebas levanta y responde", async () => {
    const { status } = await requestJson("/jobs");
    assert.equal(status, 200);
  });

  test("config.js expone los defaults esperados", () => {
    assert.equal(DEFAULTS.LIMIT_PAGINATION, 10);
    assert.equal(DEFAULTS.LIMIT_OFFSET, 0);
    assert.equal(DEFAULTS.PORT, 1234);
  });

  test("config.js resuelve CONFIG.MODEL_AI con valor por defecto", () => {
    assert.equal(typeof CONFIG.MODEL_AI, "string");
    assert.ok(CONFIG.MODEL_AI.length > 0, "MODEL_AI no debe quedar vacío");
  });
});

// ===========================================================================
// 2. GET /jobs  (sólo lectura: va primero porque no muta el store)
// ===========================================================================

describe("GET /jobs", () => {
  test("responde 200 con content-type JSON", async () => {
    const response = await request("/jobs");

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/json/);
  });

  test("devuelve la forma { data, total, limit, offset }", async () => {
    const { status, body } = await requestJson("/jobs");

    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data), "data debe ser un array");
    assert.equal(typeof body.total, "number");
    assert.equal(typeof body.limit, "number");
    assert.equal(typeof body.offset, "number");
  });

  test("aplica limit=10 y offset=0 por defecto", async () => {
    const { body } = await requestJson("/jobs");

    assert.equal(body.limit, DEFAULTS.LIMIT_PAGINATION);
    assert.equal(body.offset, DEFAULTS.LIMIT_OFFSET);
    assert.equal(body.data.length, DEFAULTS.LIMIT_PAGINATION);
  });

  test("'total' refleja la cantidad total de jobs almacenados", async () => {
    const master = await requestJson("/jobs?limit=999");

    assert.equal(master.body.total, master.body.data.length);
    assert.ok(master.body.total >= DEFAULTS.LIMIT_PAGINATION);
  });

  test("cada job de la lista tiene la forma esperada", async () => {
    const { body } = await requestJson("/jobs?limit=5");

    assert.ok(body.data.length > 0);
    for (const job of body.data) {
      assert.ok("id" in job);
      assert.equal(typeof job.titulo, "string");
      assert.equal(typeof job.empresa, "string");
      assert.equal(typeof job.ubicacion, "string");
      assert.ok(Array.isArray(job.data.technology));
      assert.equal(typeof job.data.modalidad, "string");
      assert.equal(typeof job.data.nivel, "string");
    }
  });

  test("pagina correctamente con limit y offset", async () => {
    const master = await requestJson("/jobs?limit=999");
    const page1 = await requestJson("/jobs?limit=3&offset=0");
    const page2 = await requestJson("/jobs?limit=3&offset=3");

    assert.deepEqual(page1.body.data, master.body.data.slice(0, 3));
    assert.deepEqual(page2.body.data, master.body.data.slice(3, 6));
    assert.equal(page2.body.limit, 3);
    assert.equal(page2.body.offset, 3);
  });

  test("las páginas consecutivas no se solapan", async () => {
    const page1 = await requestJson("/jobs?limit=3&offset=0");
    const page2 = await requestJson("/jobs?limit=3&offset=3");

    const ids1 = page1.body.data.map((job) => String(job.id));
    const ids2 = page2.body.data.map((job) => String(job.id));

    assert.equal(
      ids1.some((id) => ids2.includes(id)),
      false,
    );
  });

  test("un offset mayor que el total devuelve data vacío", async () => {
    const master = await requestJson("/jobs?limit=999");
    const { status, body } = await requestJson(
      `/jobs?limit=5&offset=${master.body.total + 50}`,
    );

    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
    assert.equal(body.total, master.body.total);
  });

  test("limit=0 devuelve data vacío pero conserva el total", async () => {
    const master = await requestJson("/jobs?limit=999");
    const { status, body } = await requestJson("/jobs?limit=0");

    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
    assert.equal(body.limit, 0);
    assert.equal(body.total, master.body.total);
  });

  test("limit no numérico devuelve data vacío y limit null (NaN -> null)", async () => {
    const { status, body } = await requestJson("/jobs?limit=abc");

    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
    assert.equal(body.limit, null);
  });

  test("filtra por technology", async () => {
    const tech = "react";
    const { status, body } = await requestJson(
      `/jobs?technology=${tech}&limit=999`,
    );

    assert.equal(status, 200);
    assert.ok(body.total > 0, "debería encontrar jobs con react");
    assert.ok(
      body.data.every((job) => job.data.technology.includes(tech)),
      `todos los jobs deben incluir la tecnología ${tech}`,
    );
  });

  test("filtra por level", async () => {
    const { status, body } = await requestJson("/jobs?level=junior&limit=999");

    assert.equal(status, 200);
    assert.ok(body.total > 0, "debería encontrar jobs junior");
    assert.ok(body.data.every((job) => job.data.nivel.includes("junior")));
  });

  test("filtra por type (modalidad)", async () => {
    const { status, body } = await requestJson("/jobs?type=remoto&limit=999");

    assert.equal(status, 200);
    assert.ok(body.total > 0, "debería encontrar jobs remotos");
    assert.ok(body.data.every((job) => job.data.modalidad.includes("remoto")));
  });

  test("filtra por text sobre titulo, descripcion o empresa", async () => {
    const text = "devops";
    const { status, body } = await requestJson(`/jobs?text=${text}&limit=999`);

    assert.equal(status, 200);
    assert.ok(body.total > 0, "debería encontrar coincidencias");
    assert.ok(
      body.data.every((job) => matchesText(job, text)),
      "todos los jobs deben coincidir en titulo, descripcion o empresa",
    );
  });

  test("el filtro text es case-insensitive", async () => {
    const lower = await requestJson("/jobs?text=devops&limit=999");
    const upper = await requestJson("/jobs?text=DEVOPS&limit=999");

    assert.equal(upper.body.total, lower.body.total);
    assert.deepEqual(
      upper.body.data.map((job) => job.id),
      lower.body.data.map((job) => job.id),
    );
  });

  test("combina varios filtros a la vez", async () => {
    const { status, body } = await requestJson(
      "/jobs?level=senior&technology=react&type=remoto&limit=999",
    );

    assert.equal(status, 200);
    assert.ok(
      body.data.every(
        (job) =>
          job.data.nivel.includes("senior") &&
          job.data.technology.includes("react") &&
          job.data.modalidad.includes("remoto"),
      ),
      "todos los jobs deben cumplir los tres filtros",
    );
  });

  test("sin coincidencias devuelve data vacío y total 0", async () => {
    const { status, body } = await requestJson(
      "/jobs?technology=tecnologia-inexistente-xyz",
    );

    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
    assert.equal(body.total, 0);
  });
});

// ===========================================================================
// 3. GET /jobs/:id
// ===========================================================================

describe("GET /jobs/:id", () => {
  test("devuelve 200 con el job solicitado", async () => {
    const master = await requestJson("/jobs?limit=1");
    const seed = master.body.data[0];

    const { status, body } = await requestJson(`/jobs/${seed.id}`);

    assert.equal(status, 200);
    assert.equal(body.id, seed.id);
    assert.equal(body.titulo, seed.titulo);
    assert.equal(body.empresa, seed.empresa);
    assert.equal(body.ubicacion, seed.ubicacion);
    assert.deepEqual(body.data, seed.data);
  });

  test("devuelve 404 con 'Job Not Found' si el id no existe", async () => {
    const { status, body } = await requestJson(`/jobs/${UNKNOWN_ID}`);

    assert.equal(status, 404);
    assert.deepEqual(body, { error: "Job Not Found" });
  });

  test("devuelve 404 para un id arbitrario no numérico", async () => {
    const { status, body } = await requestJson("/jobs/no-existe-este-id");

    assert.equal(status, 404);
    assert.deepEqual(body, { error: "Job Not Found" });
  });

  test("devuelve 404 para el job con id numérico 123 (bug: comparación estricta)", async () => {
    // JobModel.getById usa `job.id === id` y req.params.id siempre es string,
    // así que el id 123 (número en jobs.json) no se puede resolver por HTTP.
    const master = await requestJson("/jobs?limit=999");
    assert.ok(
      master.body.data.some((job) => job.id === 123),
      "jobs.json debería contener el job con id 123",
    );

    const { status, body } = await requestJson("/jobs/123");

    assert.equal(status, 404);
    assert.deepEqual(body, { error: "Job Not Found" });
  });

  test("no matchea rutas más profundas bajo /jobs/:id", async () => {
    const { status } = await requestJson("/jobs/123/extra");
    assert.equal(status, 404);
  });
});

// ===========================================================================
// 4. POST /jobs
// ===========================================================================

describe("POST /jobs", () => {
  test("responde 201 con el job creado y un id UUID", async () => {
    const payload = validJob();
    const { status, body } = await requestJson("/jobs", jsonOptions(payload));

    assert.equal(status, 201);
    assert.match(body.id, UUID_REGEX);
    assert.equal(body.titulo, payload.titulo);
    assert.equal(body.empresa, payload.empresa);
    assert.equal(body.ubicacion, payload.ubicacion);
    assert.deepEqual(body.data, payload.data);
  });

  test("el job creado se puede consultar luego por GET /jobs/:id", async () => {
    const payload = validJob({ titulo: "Backend Engineer para tests" });
    const created = await requestJson("/jobs", jsonOptions(payload));

    const fetched = await requestJson(`/jobs/${created.body.id}`);

    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.id, created.body.id);
    assert.equal(fetched.body.titulo, payload.titulo);
  });

  test("el total de jobs aumenta en 1 tras crear", async () => {
    const before = await requestJson("/jobs?limit=999");
    const created = await requestJson("/jobs", jsonOptions(validJob()));
    const after = await requestJson("/jobs?limit=999");

    assert.equal(created.status, 201);
    assert.equal(after.body.total, before.body.total + 1);
  });

  test("descripcion no se persiste: el controller create no la reenvía al model", async () => {
    const { body } = await requestJson(
      "/jobs",
      jsonOptions(validJob({ descripcion: "Esta descripcion se descarta" })),
    );

    // El controller create sólo pasa { titulo, empresa, ubicacion, data } a
    // JobModel.create, así que `descripcion` se pierde por el camino.
    assert.equal("descripcion" in body, false);
  });

  test("pero sí se puede guardar después con un PATCH", async () => {
    const created = await requestJson("/jobs", jsonOptions(validJob()));
    const patched = await requestJson(
      `/jobs/${created.body.id}`,
      jsonOptions({ descripcion: "Ahora sí guardada" }, "PATCH"),
    );

    assert.equal(patched.status, 200);
    assert.equal(patched.body.descripcion, "Ahora sí guardada");
  });

  const invalidCreateCases = [
    ["payload vacío", {}],
    ["sin titulo", omit(baseValidJob(), ["titulo"])],
    ["sin empresa", omit(baseValidJob(), ["empresa"])],
    ["sin ubicacion", omit(baseValidJob(), ["ubicacion"])],
    ["sin data", omit(baseValidJob(), ["data"])],
    ["data vacío", { ...baseValidJob(), data: {} }],
    ["titulo de menos de 3 caracteres", { ...baseValidJob(), titulo: "ab" }],
    [
      "titulo de más de 100 caracteres",
      { ...baseValidJob(), titulo: "a".repeat(101) },
    ],
    ["titulo numérico", { ...baseValidJob(), titulo: "123456" }],
    ["titulo de tipo number", { ...baseValidJob(), titulo: 12345 }],
    [
      "data.technology como string",
      {
        ...baseValidJob(),
        data: { technology: "react", modalidad: "remoto", nivel: "senior" },
      },
    ],
    [
      "data incompleto (sin nivel)",
      {
        ...baseValidJob(),
        data: { technology: ["react"], modalidad: "remoto" },
      },
    ],
    ["body como array", []],
  ];

  for (const [label, payload] of invalidCreateCases) {
    test(`responde 400 con payload inválido: ${label}`, async () => {
      const { status, body } = await requestJson("/jobs", jsonOptions(payload));

      assert.equal(status, 400);
      // Ojo: `details` no viaja porque en Zod v4 `error.errors` no existe
      // (es `error.issues`), así que el middleware manda `details: undefined`.
      assert.equal(body.error, "Invalid Request");
    });
  }

  test("responde 400 si no se envía Content-Type application/json", async () => {
    const { status, body } = await requestJson("/jobs", {
      method: "POST",
      body: JSON.stringify(validJob()),
    });

    assert.equal(status, 400);
    assert.equal(body.error, "Invalid Request");
  });

  test("responde 400 si el body no es JSON válido", async () => {
    const { status } = await requestJson("/jobs", {
      method: "POST",
      headers: JSON_HEADERS,
      body: "{esto-no-es-json",
    });

    assert.equal(status, 400);
  });

  test("responde 400 si el JSON de primer nivel no es objeto ni array", async () => {
    // express.json() corre en strict:true, así que un string o un number sueltos
    // se rechazan en el body-parser (HTML) antes de llegar a zod.
    for (const raw of ['"no soy un objeto"', "42", "null"]) {
      const { status, body } = await requestJson("/jobs", {
        method: "POST",
        headers: JSON_HEADERS,
        body: raw,
      });

      assert.equal(status, 400, `esperaba 400 para el body ${raw}`);
      assert.equal(body, null, `esperaba respuesta no-JSON para ${raw}`);
    }
  });

  test("no persiste nada cuando la validación falla", async () => {
    const before = await requestJson("/jobs?limit=999");
    const invalid = await requestJson(
      "/jobs",
      jsonOptions({ ...validJob(), titulo: "ab" }),
    );
    const after = await requestJson("/jobs?limit=999");

    assert.equal(invalid.status, 400);
    assert.equal(after.body.total, before.body.total);
  });
});

// ===========================================================================
// 5. PATCH /jobs/:id
// ===========================================================================

describe("PATCH /jobs/:id", () => {
  let jobId;

  before(async () => {
    jobId = (await createJob()).id;
  });

  test("responde 200 y actualiza sólo los campos enviados", async () => {
    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions({ titulo: "Titulo actualizado" }, "PATCH"),
    );

    assert.equal(status, 200);
    assert.equal(body.id, jobId);
    assert.equal(body.titulo, "Titulo actualizado");
    // el resto de campos debe quedar intacto
    assert.equal(body.empresa, validJob().empresa);
    assert.equal(body.ubicacion, validJob().ubicacion);
    assert.deepEqual(body.data, validJob().data);
  });

  test("permite actualizar la descripcion", async () => {
    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions({ descripcion: "Nueva descripcion" }, "PATCH"),
    );

    assert.equal(status, 200);
    assert.equal(body.descripcion, "Nueva descripcion");
    assert.equal(body.titulo, "Titulo actualizado");
  });

  test("reemplaza data cuando se envía completo", async () => {
    const newData = {
      technology: ["go", "docker"],
      modalidad: "madrid",
      nivel: "junior",
    };

    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions({ data: newData }, "PATCH"),
    );

    assert.equal(status, 200);
    assert.deepEqual(body.data, newData);
  });

  test("con body vacío responde 200 sin cambiar nada", async () => {
    const before = await requestJson(`/jobs/${jobId}`);
    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions({}, "PATCH"),
    );

    assert.equal(status, 200);
    assert.deepEqual(body, before.body);
  });

  test("responde 404 con body válido si el job no existe", async () => {
    const { status, body } = await requestJson(
      `/jobs/${UNKNOWN_ID}`,
      jsonOptions({ titulo: "Titulo valido" }, "PATCH"),
    );

    assert.equal(status, 404);
    assert.deepEqual(body, { message: "Trabajo no encontrado" });
  });

  const invalidPatchCases = [
    ["titulo de tipo number", { titulo: 12345 }],
    ["titulo demasiado corto", { titulo: "ab" }],
    ["titulo numérico", { titulo: "999999" }],
    [
      "data.technology no es array",
      {
        titulo: "Titulo valido",
        data: { technology: "react", modalidad: "remoto", nivel: "senior" },
      },
    ],
  ];

  for (const [label, payload] of invalidPatchCases) {
    test(`responde 400 con body inválido: ${label}`, async () => {
      const { status, body } = await requestJson(
        `/jobs/${jobId}`,
        jsonOptions(payload, "PATCH"),
      );

      assert.equal(status, 400);
      assert.equal(body.error, "Invalid Request");
    });
  }

  test("la validación corre antes que el controller (el job no se toca)", async () => {
    const before = await requestJson(`/jobs/${jobId}`);
    await requestJson(`/jobs/${jobId}`, jsonOptions({ titulo: "ab" }, "PATCH"));
    const after = await requestJson(`/jobs/${jobId}`);

    assert.deepEqual(after.body, before.body);
  });
});

// ===========================================================================
// 6. PUT /jobs/:id
// ===========================================================================

describe("PUT /jobs/:id", () => {
  let jobId;

  before(async () => {
    jobId = (await createJob()).id;
    // POST no guarda descripcion; la seteamos con PATCH para poder verificar
    // que PUT la preserva cuando no se envía.
    await requestJson(
      `/jobs/${jobId}`,
      jsonOptions({ descripcion: "Descripcion original" }, "PATCH"),
    );
  });

  test("responde 200 reemplazando titulo, empresa y ubicacion", async () => {
    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions(
        {
          titulo: "Titulo con PUT",
          empresa: "Empresa con PUT",
          ubicacion: "Bogota",
        },
        "PUT",
      ),
    );

    assert.equal(status, 200);
    assert.equal(body.titulo, "Titulo con PUT");
    assert.equal(body.empresa, "Empresa con PUT");
    assert.equal(body.ubicacion, "Bogota");
  });

  test("conserva descripcion y data si no se envían", async () => {
    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions(
        {
          titulo: "Otro titulo",
          empresa: "Otra empresa",
          ubicacion: "Madrid",
        },
        "PUT",
      ),
    );

    assert.equal(status, 200);
    assert.equal(body.descripcion, "Descripcion original");
    assert.deepEqual(body.data, validJob().data);
  });

  test("reemplaza data cuando se envía", async () => {
    const newData = {
      technology: ["rust"],
      modalidad: "valencia",
      nivel: "mid-level",
    };

    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions(
        {
          titulo: "Titulo",
          empresa: "Empresa",
          ubicacion: "Valencia",
          data: newData,
        },
        "PUT",
      ),
    );

    assert.equal(status, 200);
    assert.deepEqual(body.data, newData);
  });

  const missingFieldCases = [
    ["titulo", { empresa: "E", ubicacion: "U" }],
    ["empresa", { titulo: "Titulo valido", ubicacion: "U" }],
    ["ubicacion", { titulo: "Titulo valido", empresa: "E" }],
  ];

  for (const [field, payload] of missingFieldCases) {
    test(`responde 400 si falta el campo obligatorio: ${field}`, async () => {
      const { status, body } = await requestJson(
        `/jobs/${jobId}`,
        jsonOptions(payload, "PUT"),
      );

      assert.equal(status, 400);
      assert.deepEqual(body, { message: "Faltan campos obligatorios" });
    });
  }

  test("responde 404 con 'Trabajo no encontrado' si el id no existe", async () => {
    const { status, body } = await requestJson(
      `/jobs/${UNKNOWN_ID}`,
      jsonOptions(
        { titulo: "Titulo", empresa: "Empresa", ubicacion: "Ubicacion" },
        "PUT",
      ),
    );

    assert.equal(status, 404);
    assert.deepEqual(body, { message: "Trabajo no encontrado" });
  });

  test("un PUT con id inexistente no crea un job fantasma", async () => {
    const before = await requestJson("/jobs?limit=999");
    const failed = await requestJson(
      `/jobs/${UNKNOWN_ID}`,
      jsonOptions(
        { titulo: "Titulo", empresa: "Empresa", ubicacion: "Ubicacion" },
        "PUT",
      ),
    );
    const after = await requestJson("/jobs?limit=999");

    assert.equal(failed.status, 404);
    assert.equal(after.body.total, before.body.total);
  });

  test("PUT no pasa por el schema zod, sólo valida el controller", async () => {
    // El controller exige que titulo/empresa/ubicacion sean truthy, así que un
    // string de 1 carácter (que zod rechazaría con min(3)) sí se acepta.
    const { status, body } = await requestJson(
      `/jobs/${jobId}`,
      jsonOptions({ titulo: "x", empresa: "y", ubicacion: "z" }, "PUT"),
    );

    assert.equal(status, 200);
    assert.equal(body.titulo, "x");
  });
});

// ===========================================================================
// 7. DELETE /jobs/:id
// ===========================================================================

describe("DELETE /jobs/:id", () => {
  test("responde 200 con el mensaje de borrado", async () => {
    const job = await createJob({ titulo: "Job que se va a borrar" });

    const { status, body } = await requestJson(`/jobs/${job.id}`, {
      method: "DELETE",
    });

    assert.equal(status, 200);
    assert.deepEqual(body, { message: "Trabajo borrado exitosamente" });
  });

  test("elimina el job del store: luego GET devuelve 404", async () => {
    const job = await createJob();

    const before = await requestJson("/jobs?limit=999");
    const deleted = await requestJson(`/jobs/${job.id}`, { method: "DELETE" });
    const after = await requestJson("/jobs?limit=999");
    const fetched = await requestJson(`/jobs/${job.id}`);

    assert.equal(deleted.status, 200);
    assert.equal(after.body.total, before.body.total - 1);
    assert.equal(
      after.body.data.some((j) => String(j.id) === job.id),
      false,
      "el job borrado no debe seguir en el listado",
    );
    assert.equal(fetched.status, 404);
    assert.deepEqual(fetched.body, { error: "Job Not Found" });
  });

  test("no afecta a los demás jobs del store", async () => {
    const keep = await createJob({ titulo: "Este debe sobrevivir" });
    const drop = await createJob({ titulo: "Este se borra" });

    await requestJson(`/jobs/${drop.id}`, { method: "DELETE" });

    const survivor = await requestJson(`/jobs/${keep.id}`);
    assert.equal(survivor.status, 200);
    assert.equal(survivor.body.titulo, "Este debe sobrevivir");
  });

  test("responde 404 con 'Este trabajo no existe' si el id no existe", async () => {
    const { status, body } = await requestJson(`/jobs/${UNKNOWN_ID}`, {
      method: "DELETE",
    });

    assert.equal(status, 404);
    assert.deepEqual(body, { error: "Este trabajo no existe" });
  });

  test("borrar dos veces el mismo id responde 200 y luego 404", async () => {
    const job = await createJob();

    const first = await requestJson(`/jobs/${job.id}`, { method: "DELETE" });
    const second = await requestJson(`/jobs/${job.id}`, { method: "DELETE" });

    assert.equal(first.status, 200);
    assert.equal(second.status, 404);
    assert.deepEqual(second.body, { error: "Este trabajo no existe" });
  });

  test("devuelve 404 para el id numérico 123 (bug: comparación estricta)", async () => {
    // JobModel.delete usa `j.id === id` y req.params.id siempre llega como
    // string, así que el job con id 123 (número en jobs.json) no se puede borrar
    // por HTTP. Ojo: el total NO debe variar, el job sigue ahí.
    const before = await requestJson("/jobs?limit=999");
    assert.ok(
      before.body.data.some((job) => job.id === 123),
      "jobs.json debería contener el job con id 123",
    );

    const { status, body } = await requestJson("/jobs/123", {
      method: "DELETE",
    });
    const after = await requestJson("/jobs?limit=999");

    assert.equal(status, 404);
    assert.deepEqual(body, { error: "Este trabajo no existe" });
    assert.equal(after.body.total, before.body.total);
    assert.ok(
      after.body.data.some((job) => job.id === 123),
      "el job 123 no debería haberse borrado",
    );
  });
});

// ===========================================================================
// 8. Rutas inexistentes
// ===========================================================================

describe("Rutas inexistentes", () => {
  test("responde 404 para una ruta desconocida", async () => {
    const { status } = await request("/ruta-que-no-existe");
    assert.equal(status, 404);
  });

  test("responde 404 en la raíz del backend", async () => {
    const { status } = await request("/");
    assert.equal(status, 404);
  });
});

// ===========================================================================
// 9. CORS
// ===========================================================================

describe("Middleware de CORS", () => {
  test("acepta el origen del frontend local (http://localhost:5173)", async () => {
    const { status, headers } = await requestJson("/jobs", {
      headers: { Origin: "http://localhost:5173" },
    });

    assert.equal(status, 200);
    assert.equal(
      headers.get("access-control-allow-origin"),
      "http://localhost:5173",
    );
  });

  test("acepta el origen de producción configurado", async () => {
    const origin = "https://04-express-sooty.vercel.app";
    const { status, headers } = await requestJson("/jobs", {
      headers: { Origin: origin },
    });

    assert.equal(status, 200);
    assert.equal(headers.get("access-control-allow-origin"), origin);
  });

  test("permite peticiones sin header Origin (curl, server-to-server)", async () => {
    const { status } = await requestJson("/jobs");
    assert.equal(status, 200);
  });

  test("responde 204 al preflight OPTIONS con origen permitido", async () => {
    const response = await request("/jobs", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:5173",
    );
  });

  test("rechaza un Origin no permitido con 403 y JSON", async () => {
    const { status, body, headers } = await requestJson("/jobs", {
      headers: { Origin: "http://origen-no-permitido.com" },
    });

    assert.equal(status, 403);
    assert.deepEqual(body, { error: "Origen no permitido" });
    assert.equal(
      headers.get("access-control-allow-origin"),
      null,
      "no debe:setearse el header CORS en un origen rechazado",
    );
  });

  test("el 403 de CORS es JSON, no una página HTML de error de Express", async () => {
    const response = await request("/jobs", {
      headers: { Origin: "http://origen-no-permitido.com" },
    });

    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.doesNotMatch(await response.text(), /<!DOCTYPE html>/);
  });

  test("el 403 corta antes de los routers: no devuelve la lista de jobs", async () => {
    const { body } = await requestJson("/jobs", {
      headers: { Origin: "http://origen-no-permitido.com" },
    });

    assert.equal(body.data, undefined);
    assert.equal(body.error, "Origen no permitido");
  });

  test("rechaza también el preflight OPTIONS de un Origin no permitido", async () => {
    const response = await request("/jobs", {
      method: "OPTIONS",
      headers: {
        Origin: "http://origen-no-permitido.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(response.status, 403);
  });

  test("corsMiddleware() con orígenes propios acepta ese origen", async () => {
    const { status, headers, body } = await requestJsonOn(
      CORS_BASE_URL,
      "/ping",
      { headers: { Origin: "http://localhost:9999" } },
    );

    assert.equal(status, 200);
    assert.deepEqual(body, { ok: true });
    assert.equal(
      headers.get("access-control-allow-origin"),
      "http://localhost:9999",
    );
  });

  test("corsMiddleware() con orígenes propios rechaza los demás", async () => {
    const { status, body } = await requestJsonOn(CORS_BASE_URL, "/ping", {
      headers: { Origin: "http://localhost:5173" },
    });

    assert.equal(status, 403);
    assert.deepEqual(body, { error: "Origen no permitido" });
  });

  test("corsMiddleware() devuelve siempre un middleware de 3 argumentos", () => {
    for (const options of [
      undefined,
      {},
      { acceptedOrigins: ["http://x.test"] },
    ]) {
      const middleware = corsMiddleware(options);

      assert.equal(typeof middleware, "function");
      assert.equal(middleware.length, 3, "Express exige (req, res, next)");
    }
  });
});

// ===========================================================================
// 10. Unit · Schemas/jobs.js (zod) — validateJob
// ===========================================================================

describe("Unidad · Schemas/jobs.js · validateJob", () => {
  test("acepta un payload completo y devuelve los datos parseados", () => {
    const payload = validJob();
    const result = validateJob(payload);

    assert.equal(result.success, true);
    assert.equal(result.data.titulo, payload.titulo);
    assert.equal(result.data.empresa, payload.empresa);
    assert.equal(result.data.ubicacion, payload.ubicacion);
    assert.deepEqual(result.data.data, payload.data);
  });

  test("hace opcional la descripcion", () => {
    const payload = validJob();
    delete payload.descripcion;

    const result = validateJob(payload);

    assert.equal(result.success, true);
    assert.equal("descripcion" in result.data, false);
  });

  test("descarta las claves desconocidas (strip por defecto de zod)", () => {
    const result = validateJob({ ...validJob(), campoExtra: "ignorado" });

    assert.equal(result.success, true);
    assert.equal("campoExtra" in result.data, false);
  });

  test("acepta los límites exactos: 3 y 100 caracteres", () => {
    const min = validateJob({ ...validJob(), titulo: "abc" });
    const max = validateJob({ ...validJob(), titulo: "a".repeat(100) });

    assert.equal(min.success, true);
    assert.equal(max.success, true);
  });

  const invalidCases = [
    ["payload vacío", {}],
    ["sin titulo", omit(baseValidJob(), ["titulo"])],
    ["sin empresa", omit(baseValidJob(), ["empresa"])],
    ["sin ubicacion", omit(baseValidJob(), ["ubicacion"])],
    ["sin data", omit(baseValidJob(), ["data"])],
    ["data vacío", { ...baseValidJob(), data: {} }],
    ["titulo de 1 carácter", { ...baseValidJob(), titulo: "a" }],
    ["titulo de 2 caracteres", { ...baseValidJob(), titulo: "ab" }],
    [
      "titulo de 101 caracteres",
      { ...baseValidJob(), titulo: "a".repeat(101) },
    ],
    ["titulo numérico como texto", { ...baseValidJob(), titulo: "12345" }],
    ["titulo de tipo number", { ...baseValidJob(), titulo: 12345 }],
    ["titulo null", { ...baseValidJob(), titulo: null }],
    ["empresa de tipo number", { ...baseValidJob(), empresa: 42 }],
    [
      "data.technology como string",
      {
        ...baseValidJob(),
        data: { technology: "react", modalidad: "remoto", nivel: "senior" },
      },
    ],
    [
      "data incompleto (sin nivel)",
      {
        ...baseValidJob(),
        data: { technology: ["react"], modalidad: "remoto" },
      },
    ],
    ["body como array", []],
    ["body como string", "no soy un objeto"],
    ["body como null", null],
  ];

  for (const [label, input] of invalidCases) {
    test(`rechaza: ${label}`, () => {
      const result = validateJob(input);

      assert.equal(result.success, false, `debería fallar: ${label}`);
      assert.ok(Array.isArray(result.error.issues));
      assert.ok(result.error.issues.length > 0);
    });
  }

  test("los issues apuntan al campo problemático", () => {
    const result = validateJob({ ...baseValidJob(), titulo: "ab" });
    const paths = result.error.issues.map((issue) => issue.path.join("."));

    assert.deepEqual(paths, ["titulo"]);
  });
});

// ===========================================================================
// 11. Unit · Schemas/jobs.js (zod) — validatePartialJob
// ===========================================================================

describe("Unidad · Schemas/jobs.js · validatePartialJob", () => {
  test("acepta un objeto vacío", () => {
    const result = validatePartialJob({});

    assert.equal(result.success, true);
    assert.deepEqual(result.data, {});
  });

  test("acepta un único campo", () => {
    const result = validatePartialJob({ titulo: "Titulo valido" });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, { titulo: "Titulo valido" });
  });

  test("acepta varios campos parciales", () => {
    const result = validatePartialJob({
      empresa: "Empresa",
      data: { technology: ["go"], modalidad: "remoto", nivel: "junior" },
    });

    assert.equal(result.success, true);
    assert.equal(result.data.empresa, "Empresa");
    assert.deepEqual(result.data.data.technology, ["go"]);
  });

  test("acepta sólo la descripcion", () => {
    const result = validatePartialJob({ descripcion: "Una descripcion" });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, { descripcion: "Una descripcion" });
  });

  const invalidCases = [
    ["titulo demasiado corto", { titulo: "ab" }],
    ["titulo de tipo number", { titulo: 12345 }],
    ["titulo numérico como texto", { titulo: "123456" }],
    ["empresa de tipo number", { empresa: 42 }],
    ["ubicacion de tipo boolean", { ubicacion: true }],
    ["body como array", []],
  ];

  for (const [label, input] of invalidCases) {
    test(`rechaza: ${label}`, () => {
      const result = validatePartialJob(input);

      assert.equal(result.success, false, `debería fallar: ${label}`);
    });
  }
});

// ===========================================================================
// 12. Unit · models/job.js (JobModel)
// ===========================================================================

describe("Unidad · models/job.js · JobModel.getAll", () => {
  test("devuelve { jobs, total }", async () => {
    const result = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.ok(Array.isArray(result.jobs));
    assert.equal(typeof result.total, "number");
    assert.equal(result.total, result.jobs.length);
  });

  test("pagina con limit y offset", async () => {
    const all = await JobModel.getAll({ limit: 999, offset: 0 });
    const page = await JobModel.getAll({ limit: 2, offset: 1 });

    assert.equal(page.jobs.length, 2);
    assert.equal(page.total, all.total);
    assert.deepEqual(page.jobs, all.jobs.slice(1, 3));
  });

  test("filtra por technology", async () => {
    const result = await JobModel.getAll({ technology: "react", limit: 999 });

    assert.ok(result.total > 0);
    assert.ok(result.jobs.every((j) => j.data.technology.includes("react")));
  });

  test("filtra por level", async () => {
    const result = await JobModel.getAll({ level: "junior", limit: 999 });

    assert.ok(result.total > 0);
    assert.ok(result.jobs.every((j) => j.data.nivel.includes("junior")));
  });

  test("filtra por type", async () => {
    const result = await JobModel.getAll({ type: "remoto", limit: 999 });

    assert.ok(result.total > 0);
    assert.ok(result.jobs.every((j) => j.data.modalidad.includes("remoto")));
  });

  test("filtra por text (case-insensitive) en titulo, descripcion o empresa", async () => {
    const result = await JobModel.getAll({ text: "DEVops", limit: 999 });

    assert.ok(result.total > 0);
    assert.ok(result.jobs.every((j) => matchesText(j, "devops")));
  });

  test("sin coincidencias devuelve lista vacía y total 0", async () => {
    const result = await JobModel.getAll({ technology: "no-existe-esta-tech" });

    assert.deepEqual(result.jobs, []);
    assert.equal(result.total, 0);
  });
});

describe("Unidad · models/job.js · JobModel.getById", () => {
  test("encuentra un job existente", async () => {
    const { jobs } = await JobModel.getAll({ limit: 1, offset: 0 });
    const job = await JobModel.getById(jobs[0].id);

    assert.ok(job);
    assert.equal(job.id, jobs[0].id);
    assert.equal(job.titulo, jobs[0].titulo);
  });

  test("devuelve undefined para un id inexistente", async () => {
    const job = await JobModel.getById(UNKNOWN_ID);
    assert.equal(job, undefined);
  });
});

describe("Unidad · models/job.js · JobModel.create", () => {
  test("genera un id UUID y lo agrega al final del store", async () => {
    const before = await JobModel.getAll({ limit: 999, offset: 0 });
    const created = await JobModel.create({
      titulo: "Job creado desde el modelo",
      empresa: "Model Corp",
      ubicacion: "Remoto",
      data: { technology: ["node"], modalidad: "remoto", nivel: "senior" },
    });
    const after = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.match(created.id, UUID_REGEX);
    assert.equal(after.total, before.total + 1);
    assert.equal(after.jobs.at(-1).id, created.id);
  });

  test("dos creations seguidas generan ids distintos", async () => {
    const base = {
      titulo: "Job A",
      empresa: "E",
      ubicacion: "U",
      data: { technology: ["node"], modalidad: "remoto", nivel: "junior" },
    };
    const first = await JobModel.create({ ...base, titulo: "Job A" });
    const second = await JobModel.create({ ...base, titulo: "Job B" });

    assert.notEqual(first.id, second.id);
    assert.equal(first.titulo, "Job A");
    assert.equal(second.titulo, "Job B");
  });
});

describe("Unidad · models/job.js · JobModel.partialUpdate", () => {
  test("cambia sólo los campos recibidos", async () => {
    const created = await JobModel.create({
      titulo: "Titulo original",
      empresa: "Empresa original",
      ubicacion: "Ubicacion original",
      data: { technology: ["a"], modalidad: "remoto", nivel: "junior" },
    });

    const updated = await JobModel.partialUpdate({
      id: created.id,
      empresa: "Empresa cambiada",
    });

    assert.equal(updated.empresa, "Empresa cambiada");
    assert.equal(updated.titulo, "Titulo original");
    assert.equal(updated.ubicacion, "Ubicacion original");
    assert.deepEqual(updated.data.technology, ["a"]);
  });

  test("no toca el store si el id no existe", async () => {
    const before = await JobModel.getAll({ limit: 999, offset: 0 });
    const updated = await JobModel.partialUpdate({
      id: UNKNOWN_ID,
      titulo: "No importa",
    });
    const after = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.equal(updated, null);
    assert.equal(after.total, before.total);
  });

  test("acepta como id un string o number indistinto (usa String())", async () => {
    const created = await JobModel.create({
      titulo: "Job numerico",
      empresa: "E",
      ubicacion: "U",
      data: { technology: ["node"], modalidad: "remoto", nivel: "junior" },
    });

    const updated = await JobModel.partialUpdate({
      id: String(created.id),
      titulo: "Actualizado via string",
    });

    assert.equal(updated.titulo, "Actualizado via string");
  });
});

describe("Unidad · models/job.js · JobModel.update", () => {
  test("reemplaza los campos obligatorios", async () => {
    const created = await JobModel.create({
      titulo: "Titulo viejo",
      empresa: "Empresa vieja",
      ubicacion: "Ubicacion vieja",
      data: { technology: ["a"], modalidad: "remoto", nivel: "junior" },
    });

    const updated = await JobModel.update({
      id: created.id,
      titulo: "Titulo nuevo",
      empresa: "Empresa nueva",
      ubicacion: "Ubicacion nueva",
    });

    assert.equal(updated.titulo, "Titulo nuevo");
    assert.equal(updated.empresa, "Empresa nueva");
    assert.equal(updated.ubicacion, "Ubicacion nueva");
    // data se conserva cuando no se envía
    assert.deepEqual(updated.data.technology, ["a"]);
  });

  test("devuelve null si el id no existe (no revienta con TypeError)", async () => {
    const updated = await JobModel.update({
      id: UNKNOWN_ID,
      titulo: "a",
      empresa: "b",
      ubicacion: "c",
    });

    assert.equal(updated, null);
  });

  test("devolver null no ensucia el store", async () => {
    const before = await JobModel.getAll({ limit: 999, offset: 0 });
    await JobModel.update({
      id: UNKNOWN_ID,
      titulo: "a",
      empresa: "b",
      ubicacion: "c",
    });
    const after = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.equal(after.total, before.total);
  });
});

describe("Unidad · models/job.js · JobModel.delete", () => {
  test("devuelve el job eliminado y lo quita del store", async () => {
    const created = await JobModel.create({
      titulo: "Job para borrar",
      empresa: "E",
      ubicacion: "U",
      data: { technology: ["node"], modalidad: "remoto", nivel: "junior" },
    });

    const before = await JobModel.getAll({ limit: 999, offset: 0 });
    const deleted = await JobModel.delete({ id: created.id });
    const after = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.equal(deleted.id, created.id);
    assert.equal(deleted.titulo, "Job para borrar");
    assert.equal(after.total, before.total - 1);
    assert.equal(
      after.jobs.some((j) => j.id === created.id),
      false,
    );
  });

  test("devuelve null si el id no existe y no toca el store", async () => {
    const before = await JobModel.getAll({ limit: 999, offset: 0 });
    const deleted = await JobModel.delete({ id: UNKNOWN_ID });
    const after = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.equal(deleted, null);
    assert.equal(after.total, before.total);
  });

  test("sólo elimina el job cuyo id coincide", async () => {
    const keep = await JobModel.create({
      titulo: "Debe sobrevivir",
      empresa: "E",
      ubicacion: "U",
      data: { technology: ["node"], modalidad: "remoto", nivel: "junior" },
    });
    const drop = await JobModel.create({
      titulo: "Se elimina",
      empresa: "E",
      ubicacion: "U",
      data: { technology: ["go"], modalidad: "remoto", nivel: "junior" },
    });

    await JobModel.delete({ id: drop.id });
    const { jobs } = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.ok(jobs.some((j) => j.id === keep.id));
    assert.equal(
      jobs.some((j) => j.id === drop.id),
      false,
    );
  });

  test("es idempotente: el segundo delete del mismo id devuelve null", async () => {
    const created = await JobModel.create({
      titulo: "Se borra una vez",
      empresa: "E",
      ubicacion: "U",
      data: { technology: ["node"], modalidad: "remoto", nivel: "junior" },
    });

    const first = await JobModel.delete({ id: created.id });
    const second = await JobModel.delete({ id: created.id });

    assert.equal(first.id, created.id);
    assert.equal(second, null);
  });

  test("con un id numérico sí encuentra el job 123 (comparación estricta)", async () => {
    // A nivel de modelo, pasar el 123 como número funciona. Por HTTP no, porque
    // req.params.id siempre es string (ver test de DELETE en la sección 7).
    const before = await JobModel.getAll({ limit: 999, offset: 0 });
    assert.ok(
      before.jobs.some((job) => job.id === 123),
      "jobs.json debería contener el job con id 123",
    );

    const deleted = await JobModel.delete({ id: 123 });
    const after = await JobModel.getAll({ limit: 999, offset: 0 });

    assert.equal(deleted.id, 123);
    assert.equal(after.total, before.total - 1);

    // lo reponemos para no arrastrar el cambio al resto de la suite
    jobsStore.push(deleted);
    assert.equal(
      (await JobModel.getAll({ limit: 999, offset: 0 })).total,
      before.total,
    );
  });
});

// ===========================================================================
// 13. Unit · Routes/jobs.js (contrato de rutas registradas)
// ===========================================================================

describe("Unidad · Routes/jobs.js · contrato de rutas", () => {
  // OJO: el router se monta en app.js con `app.use("/jobs", jobRouter)`, así que
  // las rutas internas son "/" y "/:id", NO "/jobs" y "/jobs/:id".
  const expectedRoutes = [
    ["get", "/"],
    ["get", "/:id"],
    ["post", "/"],
    ["patch", "/:id"],
    ["put", "/:id"],
    ["delete", "/:id"],
  ];

  test("el router expone una pila de capas", () => {
    assert.ok(Array.isArray(jobRouter.stack));
    assert.ok(jobRouter.stack.length > 0);
  });

  for (const [method, path] of expectedRoutes) {
    const mounted = path === "/" ? "/jobs" : `/jobs${path}`;

    test(`${method.toUpperCase()} ${mounted} está registrada con handlers`, () => {
      const layer = jobRouter.stack.find(
        (l) => l.route?.path === path && l.route?.methods?.[method] === true,
      );

      assert.ok(
        layer,
        `no se encontró la ruta interna ${method.toUpperCase()} ${path}`,
      );
      assert.ok(
        layer.route.stack.length >= 1,
        `${method.toUpperCase()} ${path} no tiene handlers`,
      );
    });
  }

  test("no hay rutas duplicadas para el mismo método y path", () => {
    const signatures = jobRouter.stack
      .filter((l) => l.route)
      .map((l) => `${Object.keys(l.route.methods).join(",")} ${l.route.path}`);
    const unique = new Set(signatures);

    assert.equal(signatures.length, unique.size);
  });

  test("POST / lleva el middleware de validación antes del controller", () => {
    const layer = jobRouter.stack.find(
      (l) => l.route?.path === "/" && l.route?.methods?.post === true,
    );
    const handlerNames = layer.route.stack.map((l) => l.handle.name);

    assert.ok(
      handlerNames.indexOf("validateCreate") < handlerNames.indexOf("create"),
      `orden inesperado de handlers: ${handlerNames.join(" -> ")}`,
    );
  });

  test("PATCH /:id lleva el middleware de validación antes del controller", () => {
    const layer = jobRouter.stack.find(
      (l) => l.route?.path === "/:id" && l.route?.methods?.patch === true,
    );
    const handlerNames = layer.route.stack.map((l) => l.handle.name);

    assert.ok(
      handlerNames.indexOf("validateUpdate") <
        handlerNames.indexOf("partialUpdate"),
      `orden inesperado de handlers: ${handlerNames.join(" -> ")}`,
    );
  });

  test("PUT /:id no lleva middleware de validación", () => {
    const layer = jobRouter.stack.find(
      (l) => l.route?.path === "/:id" && l.route?.methods?.put === true,
    );
    const handlerNames = layer.route.stack.map((l) => l.handle.name);

    assert.deepEqual(handlerNames, ["update"]);
  });
});

// ===========================================================================
// 14. Rate limiting en /ai  (va al final: consume el budget del limiter)
// ===========================================================================
