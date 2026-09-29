import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import styles from "./Detail.module.css";
import snarkdown from "snarkdown";
import { useAuthStore } from "../store/AuthStore";
import { useFavoriteStore } from "../store/useFavoriteStore";
import { FaRegStar, FaStar } from "react-icons/fa";

export function JobSection({ title, content }) {
  const html = snarkdown(content);

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>

        <div
          className={`${styles.sectionContent} prose`}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </section>
    </>
  );
}

export function JobDetailFavoriteButton({ jobId }) {
  const { isLoggedIn } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  return (
    <>
      <button
        className={styles.buttonFavorite}
        onClick={() => toggleFavorite(jobId)}
      >
        {isLoggedIn && isFavorite(jobId) ? (
          <FaStar className={`${styles.star} ${styles.starActive}`} />
        ) : (
          <FaRegStar className={`${styles.star} ${styles.starInactive}`} />
        )}
      </button>
    </>
  );
}

export default function JobDetail() {
  const { isLoggedIn } = useAuthStore();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    fetch(`https://jscamp-api.vercel.app/api/jobs/${jobId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Trabajo no encontrado");
        return response.json();
      })
      .then((json) => {
        setJob(json);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jobId]);

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
        <div className={styles.loading}>
          <p className={styles.textLoading}>Cargando empleos...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
        <div className={styles.error}>
          <h2 className={styles.errorText}>Oferta no encontrada</h2>
          <button
            className={styles.errorButton}
            onClick={() => navigate("/search")}
          >
            Regresar al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.breadcrumbContainer}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb}>
            <Link to="/search">Empleos</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>{job.titulo}</span>
          </nav>
        </div>
      </div>

      <div className={styles.containerCard}>
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <h2 className={styles.title}>{job.titulo}</h2>
            <span className={styles.meta}>
              {job.empresa} - {job.ubicacion}
            </span>
          </div>

          <div className={styles.containerButtonDetail}>
            <button
              disabled={!isLoggedIn}
              onClick={() => setIsApplied(!isApplied)}
              className={isApplied ? styles.buttonApplied : styles.applyButton}
            >
              {isLoggedIn
                ? isApplied
                  ? "Aplicado"
                  : "Aplicar ahora"
                : "Inicia sesion para aplicar"}
            </button>
            <JobDetailFavoriteButton jobId={job.id} />
          </div>
        </header>

        <JobSection
          title="Descripcion del Puesto"
          content={job.content.description}
        />
        <JobSection
          title="Responsabilidades"
          content={job.content.responsibilities}
        />
        <JobSection title="Requisitos" content={job.content.requirements} />
        <JobSection title="Acerca de la empresa" content={job.content.about} />
      </div>
    </>
  );
}
