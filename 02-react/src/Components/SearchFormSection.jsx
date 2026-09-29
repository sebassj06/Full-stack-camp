import { useId, useRef } from "react";
import { useSearchForm } from "../hooks/useSearchForm";

export function SearchFormSection({
  onSearch,
  onClearFilters,
  filtersCheck,
  initialText,
}) {
  const idText = useId();
  const idTechnology = useId();
  const idExperience = useId();
  const idLocation = useId();
  const inputRef = useRef();
  const { handleSubmit } = useSearchForm({
    idText,
    idTechnology,
    idLocation,
    idExperience,
    onSearch,
  });

  const handleReset = (event) => {
    event.preventDefault();
    onClearFilters("");
    event.currentTarget.form.reset();
  };

  const handleClearInput = (event) => {
    event.preventDefault();

    if (inputRef.current) {
      inputRef.current.value = "";
      const form = inputRef.current.form;

      if (form) {
        const formData = new FormData(form);

        onSearch({
          search: "",
          technology: formData.get(idTechnology) || "",
          location: formData.get(idLocation),
          experience: formData.get(idExperience),
        });
      }
    }
  };

  return (
    <>
      <section className="job-search">
        <img src="background.webp" width="200" />
        <h1>Encuentra tu proximo trabajo</h1>
        <p>Explora miles de oportunidades en el sector tecnologico</p>

        <form onChange={handleSubmit} role="search">
          <div className="search-bar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-search"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
              <path d="M21 21l-6 -6" />
            </svg>
            <input
              ref={inputRef}
              name={idText}
              type="text"
              placeholder="Buscar trabajos, empresas o habilidades"
              defaultValue={initialText}
            />
            <button
              style={{ backgroundColor: "transparent", outline: "none" }}
              type="button"
              onClick={handleClearInput}
            >
              ✕
            </button>
          </div>

          <div className="search-filters">
            <select name={idTechnology} id="filter-technology">
              <option value="">Tecnología</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="react">React</option>
              <option value="node">Node.js</option>
            </select>

            <select name={idLocation} id="filter-location">
              <option value="">Ubicación</option>
              <option value="remoto">Remoto</option>
              <option value="cdmx">Ciudad de México</option>
              <option value="guadalajara">Guadalajara</option>
              <option value="monterrey">Monterrey</option>
              <option value="barcelona">Barcelona</option>
            </select>

            <select name={idExperience} id="filter-experience">
              <option value="">Nivel de experiencia</option>
              <option value="trainee">Trainee</option>
              <option value="junior">Junior</option>
              <option value="semi-senior">Semi-Senior</option>
              <option value="senior">Senior</option>
              <option value="lead">Tech Lead</option>
            </select>
          </div>

          {filtersCheck && (
            <button type="button" onClick={handleReset} id="btn-restablecer">
              Restablecer filtros
            </button>
          )}
        </form>
        <span id="filter-selected-value"></span>
      </section>
    </>
  );
}
