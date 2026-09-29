import { JobCard } from "./JobCard";
import styles from "./JobList.module.css";

export function JobList({ jobs }) {
  return (
    <>
      <h2>Resultados de Busqueda</h2>

      <section className="jobs-section">
        <div className={styles.jobList}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </>
  );
}
