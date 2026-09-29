import { irAPagina, paginaActual, totalPaginas } from "./actualizar-vista.js";

const botonesPagina = document.querySelectorAll(".btn-numero");
const botonAnterior = document.querySelector("#btn-anterior");
const botonSiguiente = document.querySelector("#btn-siguiente");

botonesPagina.forEach((boton) => {
  boton.addEventListener("click", (e) => {
    irAPagina(Number(e.target.dataset.value));
  });
});

botonAnterior.addEventListener("click", () => {
  if (paginaActual > 1) {
    irAPagina(paginaActual - 1);
  }
});

botonSiguiente.addEventListener("click", () => {
  if (paginaActual < totalPaginas) {
    irAPagina(paginaActual + 1);
  }
});
