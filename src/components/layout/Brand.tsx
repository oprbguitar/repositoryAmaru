import { Link } from "react-router-dom";

/**
 * Logo mark (A with a dragon head) plus wordmark. The image carries the
 * accessible name "AMARU"; the visible wordmark repeats it, so the copy is
 * hidden from assistive tech to avoid announcing it twice.
 */
export function Brand({ asLink = false }: { asLink?: boolean }) {
  const content = (
    <>
      <img
        className="brand-mark"
        src="/logo-mark.webp"
        srcSet="/logo-mark.webp 1x, /logo-mark@2x.webp 2x"
        width={128}
        height={128}
        alt="AMARU"
        decoding="async"
      />
      <span className="brand-copy" aria-hidden="true">
        <strong>AMARU</strong>
        <span>AI Observatory</span>
      </span>
    </>
  );
  return asLink ? (
    <Link className="brand" to="/today">
      {content}
    </Link>
  ) : (
    <div className="brand">{content}</div>
  );
}
