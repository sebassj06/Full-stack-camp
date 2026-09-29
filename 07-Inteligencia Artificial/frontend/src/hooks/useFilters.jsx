import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export function useFilters() {
  const ResultPerPage = 10;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => {
    return {
      search: searchParams.get("text"),
      technology: searchParams.get("technology"),
      location: searchParams.get("type"),
      experience: searchParams.get("level"),
    };
  });
  const [currentPage, setCurrentPage] = useState(1);

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
          `https://04-express-sooty.vercel.app/jobs?${queryParams}`,
        );
        const json = await response.json();

        setJobs(json.data);
        setTotal(json.total);
        console.log(json);
      } catch (error) {
        console.log("Error fetching jobs", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filters, currentPage]);

  useEffect(() => {
    setSearchParams(() => {
      const newParams = new URLSearchParams();

      if (filters.search) newParams.set("text", filters.search);
      if (filters.technology) newParams.set("technology", filters.technology);
      if (filters.location) newParams.set("type", filters.location);
      if (filters.experience) newParams.set("level", filters.experience);

      if (currentPage > 1) newParams.append("page", currentPage);

      return newParams;
    });
  }, [filters, currentPage, setSearchParams]);

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
    filters,
    setFilters,
  };
}
