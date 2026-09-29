import { useRef } from "react";

export function useSearchForm({
  idText,
  idTechnology,
  idLocation,
  idExperience,
  onSearch,
}) {
  let timeoutId = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const filters = {
      search: formData.get(idText),
      technology: formData.get(idTechnology),
      location: formData.get(idLocation),
      experience: formData.get(idExperience),
    };

    const isTextFilter = event.target.name === idText;

    if (isTextFilter) {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(() => {
        onSearch(filters);
      }, 500);
    } else {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      onSearch(filters);
    }
  };

  return {
    handleSubmit,
  };
}
