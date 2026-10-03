import { useState } from "react";
import { Link } from "react-router";
import { FaRegStar, FaStar } from "react-icons/fa";
import "../index.css";
import styles from "./JobCard.module.css";
import { useFavoriteStore } from "../store/useFavoriteStore";
import { useAuthStore } from "../store/AuthStore";

export function JobCardButtons({ jobId }) {
  const { isLoggedIn } = useAuthStore();
  const [isApplied, setIsApplied] = useState(false);
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  const buttonAppliedText = isApplied ? "Aplicado" : "Aplicar";

  return (
    <>
      <div className={styles.containerButtons}>
        <button disabled={!isLoggedIn} onClick={() => setIsApplied(!isApplied)}>
          {buttonAppliedText}
        </button>
        <button
          className={styles.buttonFavorite}
          onClick={() => toggleFavorite(jobId)}
        >
          {isLoggedIn && isFavorite(jobId) ? (
            <FaStar className={`${styles.star} ${styles.starActive}`} />
          ) : (
            <FaRegStar
              disabled={isLoggedIn}
              className={`${styles.star} ${styles.starInactive}`}
            />
          )}
        </button>
      </div>
    </>
  );
}

export function JobCard({ job }) {
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
          <div>
            <Link className={styles.linkTitle} to={`/jobs/${job.id}`}>
              <h3>{job.titulo}</h3>
            </Link>
          </div>
          <small>
            {job.empresa} | {job.ubicacion}
          </small>
          <p>{job.descripcion}</p>
        </div>
        <JobCardButtons jobId={job.id} />
      </article>
    </>
  );
}
