import { useState } from "react";
import "../index.css";

export function JobCard({ job }) {
  const [isApplied, setIsApplied] = useState(false);

  const buttonAppliedText = isApplied ? "Aplicado" : "Aplicar";

  const tecnologiaData = Array.isArray(job.data?.tecnologia)
    ? job.data.tecnologia.join(" ")
    : job.data?.tecnologia || "";

  return (
    <>
      <article
        data-tecnologia={tecnologiaData}
        data-location={job.data.location}
        data-experience={job.data.experience}
        className="job-card"
      >
        <div>
          <h3>{job.titulo}</h3>
          <small>
            {job.empresa} | {job.ubicacion}
          </small>
          <p>{job.descripcion}</p>
        </div>
        <button onClick={() => setIsApplied(!isApplied)}>
          {buttonAppliedText}
        </button>
      </article>
    </>
  );
}
