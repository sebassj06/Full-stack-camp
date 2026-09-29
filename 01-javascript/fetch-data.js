import { actualizarVista } from "./actualizar-vista.js";

const job_listings = document.querySelector(".jobs-listings");

export let allTheJobs = [];

export function agregarTrabajos(jobs) {
  job_listings.innerHTML = "";
  jobs.forEach((job) => {
    const article = document.createElement("article");
    article.className = "job-card";

    article.dataset.tecnologia = job.data.tecnologia;
    article.dataset.location = job.data.location;
    article.dataset.experience = job.data.experience;

    article.innerHTML = `
      <div>
        <h3>${job.titulo}</h3>
        <small>${job.empresa} | ${job.ubicacion}</small>
        <p>${job.descripcion}</p>
      </div>
      <button value="false" class="btn-aplicar">Aplicar</button>
      `;
    job_listings.appendChild(article);
  });
}

fetch("./data.json")
  .then((res) => {
    return res.json();
  })
  .then((jobs) => {
    allTheJobs = jobs;
    agregarTrabajos(jobs);
    actualizarVista();
  });
