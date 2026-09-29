import { setTextoBusqueda } from "./actualizar-vista.js";

const searchBar = document.querySelector("#search-bar");

searchBar.addEventListener("input", (e) => {
  setTextoBusqueda(e.target.value);
});
