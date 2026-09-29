import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";

import { Header, Footer } from "./Components/header&footer";
import "./index.css";
import { ProtectedRoute } from "./pages/ProtectedRoute.jsx";

const HomePage = lazy(() => import("./pages/Home.jsx"));
const SearchPage = lazy(() => import("./pages/Search.jsx"));
const NotFoundPage = lazy(() => import("./pages/404.jsx"));
const JobDetail = lazy(() => import("./pages/JobDetails.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));

function App() {
  return (
    <>
      <Header />

      <Suspense
        fallback={
          <div
            style={{ mawWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}
          >
            {" "}
            Cargando...{" "}
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute route="/">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default App;
