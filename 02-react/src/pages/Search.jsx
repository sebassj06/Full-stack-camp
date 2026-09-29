import { JobList } from "../Components/JobList";
import { Pagination } from "../Components/pagination";
import { SearchFormSection } from "../Components/SearchFormSection";
import "../index.css";
import { useEffect } from "react";
import { useFilters } from "../hooks/useFilters";

export function SearchPage() {
  const {
    jobs,
    total,
    loading,
    currentPage,
    totalPages,
    handleClick,
    filterJobs,
    handleClearFilters,
    hasActiveFilters,
    textToFilter,
  } = useFilters();

  useEffect(() => {
    document.title = `Resultados: ${total}, Pagina: ${currentPage} - DevJobs`;
  }, [total, currentPage]);

  return (
    <>
      <main>
        <SearchFormSection
          initialText={textToFilter}
          filtersCheck={hasActiveFilters}
          onSearch={filterJobs}
          onClearFilters={handleClearFilters}
        />
        {loading ? <p>Cargando empleos...</p> : <JobList jobs={jobs} />}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handleClick}
        />
      </main>
    </>
  );
}
