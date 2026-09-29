import styles from "./Pagination.module.css";

export function Pagination({ currentPage = 1, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePrevClick = (event) => {
    event.preventDefault();

    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = (event) => {
    event.preventDefault();

    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handleChangePage = (event, page) => {
    event.preventDefault();

    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  const buildPageUrl = (page) => {
    const url = new URL(window.location);
    url.searchParams.set("page", page);
    return `${url.pathname}?${url.searchParams.toString()}`;
  };

  return (
    <>
      <nav className={styles.pagination}>
        <ul className={styles.navPageList}>
          <a href={buildPageUrl(currentPage - 1)} onClick={handlePrevClick}>
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m15 19-7-7 7-7"
              />
            </svg>
          </a>

          {pages.map((page) => (
            <a
              key={page}
              href={buildPageUrl(page)}
              className={currentPage === page ? styles.isActive : ""}
              onClick={(event) => handleChangePage(event, page)}
            >
              {page}
            </a>
          ))}

          <a href={buildPageUrl(currentPage + 1)} onClick={handleNextClick}>
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m9 5 7 7-7 7"
              />
            </svg>
          </a>
        </ul>
      </nav>
    </>
  );
}
