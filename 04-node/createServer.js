import { createServer } from "node:http";
import { json } from "node:stream/consumers";
import { randomUUID } from "node:crypto";
import { uptime } from "node:process";

process.loadEnvFile(); // Lee automaticamente el archivo .env
const port = process.env.PORT ?? 3000;

const sendJson = (res, statusCode, data) => {
  res.statusCode = statusCode;
  res.setHeader("Content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
};

const users = [
  {
    id: 123,
    name: "Sebastian",
  },
  {
    id: 122,
    name: "Jose",
  },
  {
    id: "6493117b-1564-4b12-84ba-d8a3370d5a03",
    name: "Stephanny",
  },
  {
    id: "e257cb8a-40e1-45af-9b17-ac416a0bbfca",
    name: "Karina",
  },
  {
    id: "c999b98c-c912-43f2-b04f-771f5f959013",
    name: "Dad",
  },
];

const server = createServer(async (req, res) => {
  const { method, url } = req;

  const [pathname, queryString] = url.split("?");
  const searchParams = new URLSearchParams(queryString);
  console.log(queryString);
  console.log(pathname);
  console.log(searchParams);

  if (method === "GET") {
    if (pathname === "/") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("Hola desde Node 🦖");
    }

    if (pathname === "/users") {
      const limit = Number(searchParams.get("limit")) || users.length;
      const offset = Number(searchParams.get("offset")) || 0;
      console.log(limit, offset);

      const paginatedUsers = users.slice(offset, offset + limit);

      return sendJson(res, 200, paginatedUsers);
    }

    if (pathname === "/health") {
      return sendJson(res, 200, { status: "ok", uptime: process.uptime() });
    }
  }

  if (method === "POST") {
    if (pathname === "/users") {
      const body = await json(req);
      console.log(body);

      const newUser = {
        id: randomUUID(),
        name: body.name,
      };

      users.push(newUser);
    }

    return sendJson(res, 201, { message: "Usuario creado" });
  }

  if (method === "DELETE") {
    if (pathname === "/users") {
    }
  }

  return sendJson(res, 404, { error: "Not Found" });
});

server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
