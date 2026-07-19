export function Brand() {
  return (
    <div className="brand">
      <svg
        className="brand-mark"
        viewBox="0 0 52 44"
        role="img"
        aria-label="Símbolo de montañas de AMARU"
      >
        <path d="M2 39 17 6l11 21 7-13 15 25H2Z" fill="#16c4cf" />
        <path d="m17 6 5 10-5-3-4 4 4-11Z" fill="#c7f6f8" />
        <path d="m35 14 15 25H25l10-25Z" fill="#087b9b" />
        <path d="m35 14 5 9-5-2-4 3 4-10Z" fill="#f0b54b" />
      </svg>
      <div className="brand-copy">
        <strong>AMARU AI Observatory</strong>
        <span>
          Global AI Intelligence, Research, Markets &amp; Innovation Radar
        </span>
      </div>
    </div>
  );
}
