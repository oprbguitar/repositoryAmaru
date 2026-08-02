/**
 * Compact numbered pagination: first, last, and the current page's neighbours,
 * with ellipsis gaps. Styling comes from the shared `.resource-pagination`
 * rules so every catalogue pages the same way.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  label,
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
  label: string;
}) {
  if (pageCount <= 1) return null;
  const numbers = Array.from(
    { length: pageCount },
    (_, index) => index + 1,
  ).filter(
    (number) =>
      number === 1 || number === pageCount || Math.abs(number - page) <= 1,
  );
  return (
    <nav className="resource-pagination" aria-label={label}>
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        ‹
      </button>
      {numbers.map((number, index) => (
        <span key={number} className="resource-page-slot">
          {index > 0 && number - numbers[index - 1] > 1 ? (
            <span className="resource-page-gap">…</span>
          ) : null}
          <button
            type="button"
            className={number === page ? "active" : ""}
            aria-current={number === page ? "page" : undefined}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        </span>
      ))}
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  );
}
