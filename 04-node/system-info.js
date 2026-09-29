import os from "node:os";
import ms from "ms";

const TotalMem = os.totalmem();
const FreeMem = os.freemem();

const totalMemGB = (TotalMem / (1024 * 1024 * 1024)).toFixed(2);
const freeMemGB = (FreeMem / (1024 * 1024 * 1024)).toFixed(2);

const uptimeSeconds = os.uptime();
const uptimeHours = (uptimeSeconds / 3600).toFixed(2);

console.log("Todas las funciones del módulo os:");
console.log("Plataforma:", os.platform());
console.log("Arquitectura:", os.arch());
console.log("Número de CPUs:", os.cpus().length);
console.log("Memoria total:", totalMemGB, "GB");
console.log("Memoria libre:", freeMemGB, "GB");
console.log("Directorio temporal:", os.tmpdir());

console.log("Mas funciones del modulo os:");
console.log("Nombre de usuario:", os.userInfo().username);
console.log("Directorio home:", os.homedir());
console.log(
  "Tiempo de actividad del sistema:",
  ms(os.uptime() * 1000, { long: true }),
);
