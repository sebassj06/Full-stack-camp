import { useEffect, useState } from "react";
import { useRouter } from "./useRouter";

export function useFilters() {
  const ResultPerPage = 6;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get("text"),
      technology: params.get("technology"),
      location: params.get("type"),
      experience: params.get("level"),
    };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const { navigateTo } = useRouter();

  const textToFilter = filters.search;

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const handleClearFilters = () => {
    setFilters({
      search: "",
      technology: "",
      location: "",
      experience: "",
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (filters.search) params.append("text", filters.search);
        if (filters.technology) params.append("technology", filters.technology);
        if (filters.location) params.append("type", filters.location);
        if (filters.experience) params.append("level", filters.experience);

        const offset = (currentPage - 1) * ResultPerPage;
        const limit = ResultPerPage;
        params.append("limit", limit);
        params.append("offset", offset);
        console.log(params);

        const queryParams = params.toString();
        console.log(queryParams);
        // Delay 5s
        // await new Promise((resolve) => setTimeout(resolve, 5000));
        const response = await fetch(
          `https://jscamp-api.vercel.app/api/jobs?${queryParams}`,
        );
        const json = await response.json();

        setJobs(json.data);
        setTotal(json.total);
      } catch (error) {
        console.log("Error fetching jobs", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filters, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.append("text", filters.search);
    if (filters.technology) params.append("technology", filters.technology);
    if (filters.location) params.append("modalidad", filters.location);
    if (filters.experience) params.append("nivel", filters.experience);

    if (currentPage > 1) params.append("page", currentPage);

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    navigateTo(newUrl);
  }, [filters, currentPage, navigateTo]);

  const totalPages = Math.ceil(total / ResultPerPage);

  const handleClick = (page) => {
    console.log("Pagina: ", page);
    setCurrentPage(page);
  };

  const filterJobs = (filters) => {
    setFilters(filters);
    setCurrentPage(1);
  };

  return {
    total,
    loading,
    jobs,
    textToFilter,
    currentPage,
    totalPages,
    handleClick,
    filterJobs,
    handleClearFilters,
    hasActiveFilters,
  };
}
