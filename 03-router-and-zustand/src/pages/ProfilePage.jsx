import styles from "./Profile.module.css";

export function ImagenUser({ service, username }) {
  const url = `https://unavatar.io/${service}/${username}`;

  return (
    <>
      <img src={url} alt="Foto de perfil" className={styles.profileAvatar} />
    </>
  );
}

export default function ProfilePage() {
  return (
    <>
      <div className={styles.profileContainer}>
        {/* Banner Superior */}
        <div className={styles.profileHeader}></div>

        {/* Cuerpo del Perfil */}
        <div className={styles.profileBody}>
          {/* Avatar y Estado */}
          <div className={styles.profileAvatarWrapper}>
            <ImagenUser service="x" username="ibaillanos" />
            <span className={styles.statusBadge}>Disponible para trabajar</span>
          </div>

          {/* Información Principal */}
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>Ibai Llanos</h1>
            <p className={styles.profileTitle}>
              Desarrolladora Frontend Senior
            </p>
            <div className={styles.profileLocation}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Madrid, España (Remoto)</span>
            </div>
          </div>

          {/* Sobre mí / Biografía */}
          <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>Sobre mí</h2>
            <p className={styles.profileBio}>
              Desarrolladora apasionada con más de 5 años de experiencia creando
              interfaces de usuario escalables y accesibles. Especializada en el
              ecosistema de React, optimización de rendimiento web y diseño de
              sistemas UI/UX.
            </p>
          </div>

          {/* Habilidades */}
          <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>Habilidades principales</h2>
            <div className={styles.skillsContainer}>
              <span className={styles.skillTag}>React.js</span>
              <span className={styles.skillTag}>JavaScript (ES6+)</span>
              <span className={styles.skillTag}>TypeScript</span>
              <span className={styles.skillTag}>HTML5 & CSS3</span>
              <span className={styles.skillTag}>Tailwind CSS</span>
              <span className={styles.skillTag}>Git & GitHub</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className={styles.profileActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>
              Editar Perfil
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary}`}>
              Descargar CV
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
