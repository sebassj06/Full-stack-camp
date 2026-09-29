import { allTheJobs, agregarTrabajos } from "./fetch-data.js";

export let textoBusqueda = "";
export let filtroTecnologia = "";
export let filtroLocation = "";
export let filtroExperience = "";
export let paginaActual = 1;
export const trabajosPorPagina = 3;
export let totalPaginas = 1;

export function actualizarVista() {
  let resultado = allTheJobs;

  if (textoBusqueda) {
    resultado = resultado.filter(
      (job) =>
        job.titulo.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        job.empresa.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        job.ubicacion.toLowerCase().includes(textoBusqueda.toLowerCase()),
    );
  }

  if (filtroTecnologia) {
    resultado = resultado.filter((job) =>
      job.data.tecnologia.includes(filtroTecnologia),
    );
  }
  if (filtroLocation) {
    resultado = resultado.filter((job) => job.data.location === filtroLocation);
  }
  if (filtroExperience) {
    resultado = resultado.filter(
      (job) => job.data.experience === filtroExperience,
    );
  }

  totalPaginas = Math.ceil(resultado.length / trabajosPorPagina);

  const inicio = (paginaActual - 1) * trabajosPorPagina;
  const fin = paginaActual * trabajosPorPagina;
  resultado = resultado.slice(inicio, fin);

  agregarTrabajos(resultado);
}

export function setTextoBusqueda(EventValue) {
  textoBusqueda = EventValue;
  paginaActual = 1;
  actualizarVista();
}

export function setFiltroTecnologia(EventValue) {
  filtroTecnologia = EventValue;
  paginaActual = 1;
  actualizarVista();
}

export function setFiltroLocation(EventValue) {
  filtroLocation = EventValue;
  paginaActual = 1;
  actualizarVista();
}
export function setFiltroExperience(EventValue) {
  filtroExperience = EventValue;
  paginaActual = 1;
  actualizarVista();
}
export function irAPagina(dataValue) {
  paginaActual = dataValue;
  actualizarVista();
}

export function LimpiarFiltros() {
  textoBusqueda = "";
  filtroTecnologia = "";
  filtroLocation = "";
  filtroExperience = "";
  paginaActual = 1;
  actualizarVista();
}
