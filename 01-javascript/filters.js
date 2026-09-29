import {
  setFiltroExperience,
  setFiltroTecnologia,
  setFiltroLocation,
  LimpiarFiltros,
} from "./actualizar-vista.js";

const filterTech = document.querySelector("#filter-technology");
const filterLocation = document.querySelector("#filter-location");
const filterExperience = document.querySelector("#filter-experience");

filterTech.addEventListener("change", (e) => {
  setFiltroTecnologia(e.target.value);
});

filterLocation.addEventListener("change", (e) => {
  setFiltroLocation(e.target.value);
});

filterExperience.addEventListener("change", (e) => {
  setFiltroExperience(e.target.value);
});

const btnRestablecer = document.querySelector("#btn-restablecer");
btnRestablecer.addEventListener("click", (e) => {
  e.preventDefault();
  filterTech.value = "";
  filterLocation.value = "";
  filterExperience.value = "";
  LimpiarFiltros();
});
