import cors from "cors";

const ACCEPTED_ORIGINS = [
  "http://localhost:5173",
  "https://04-express-sooty.vercel.app",
];

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => {
  // Sin header `Origin` no hay navegador detrás: curl, apps móviles,
  // server-to-server e image-cron de Vercel. Esos clientes siempre pasan.
  const isOriginAllowed = (origin) =>
    acceptedOrigins.includes(origin) || !origin;

  const corsOptions = cors({
    origin: (origin, callback) => {
      // `callback(null, false)` no setea el header Access-Control-Allow-Origin,
      // así que el navegador bloquea la respuesta. `callback(new Error(...))`
      // NO sirve: el Error llega al error handler de Express y sale un 500 HTML.
      return callback(null, isOriginAllowed(origin));
    },
  });

  return function corsOriginGuard(req, res, next) {
    if (!isOriginAllowed(req.headers.origin)) {
      // Cortamos aquí, antes de tocar los routers, para no gastar trabajo de
      // servidor con un origen que el navegador va a descartar igual.
      return res.status(403).json({ error: "Origen no permitido" });
    }

    return corsOptions(req, res, next);
  };
};
