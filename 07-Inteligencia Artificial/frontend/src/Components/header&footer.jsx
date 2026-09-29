import { NavLink } from "react-router";
import { Link } from "./Link";
import { useAuthStore } from "../store/AuthStore";
import { useFavoriteStore } from "../store/useFavoriteStore";

export function Header() {
  const { isLoggedIn, login, logout } = useAuthStore();
  const { countFavorites } = useFavoriteStore();

  const numberOfFavorites = countFavorites();

  return (
    <>
      <header>
        <Link href="/" style={{ textDecoration: "none" }}>
          <h1 style={{ color: "#fff" }}>
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            DevJobs
          </h1>
        </Link>

        <nav>
          <NavLink
            className={({ isActive }) => (isActive ? "nav-link-active" : "")}
            to="/search"
          >
            Empleos
          </NavLink>

          {isLoggedIn && (
            <NavLink to="/profile">Perfil ( {numberOfFavorites} )</NavLink>
          )}
        </nav>

        {isLoggedIn ? (
          <button onClick={logout}>Cerrar Sesion</button>
        ) : (
          <button onClick={login}>Iniciar Sesion</button>
        )}
      </header>
    </>
  );
}

export function Footer() {
  return (
    <>
      <footer>
        <small>&copy; 2025 DevJobs. Todos los derechos reservados.</small>
      </footer>
    </>
  );
}
