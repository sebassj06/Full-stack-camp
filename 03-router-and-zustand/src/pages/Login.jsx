import { useNavigate } from "react-router";
import styles from "./Login.module.css";
import { useAuthStore } from "../store/AuthStore";
import { useId } from "react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const userId = useId();
  const passwordId = useId();

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const user = formData.get(userId);
    const password = formData.get(passwordId);

    if (user && password) {
      login();
      navigate("/");
    }
  };

  return (
    <>
      <div className={styles.container}>
        <h2>Welcome Back</h2>
        <p>Log in to find your next opportunity</p>

        <form onSubmit={handleSubmit} className={styles.loginContainer}>
          <input
            name={userId}
            className={styles.inputLogin}
            type="text"
            placeholder="Usuario"
          />
          <input
            name={passwordId}
            className={styles.inputLogin}
            type="password"
            placeholder="Contrasena"
          />
          <div className={styles.containerOptions}>
            <label htmlFor="">
              <input
                style={{ marginRight: ".5rem" }}
                type="checkbox"
                name=""
                id=""
              ></input>
              Remember Me
            </label>
            <a href="">Forgot password?</a>
          </div>
          <button type="submit" style={{ width: "100%" }}>
            Log In
          </button>
          <span>------------ Don't have an account? ------------</span>
          <div className={styles.registerButtons}>
            <button onClick={() => navigate("/register")}>
              Sign up as a developer
            </button>
            <button onClick={() => navigate("/register")}>
              Sign up as a company
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
