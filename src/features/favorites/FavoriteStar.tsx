import { Star } from "lucide-react";
import "./favorites.css";
import { type Favorite, toggleFavorite, useFavorites } from "./favorites";

/** Star toggle for any model or repository. */
export function FavoriteStar(props: Omit<Favorite, "savedAt">) {
  const favorites = useFavorites();
  const on = favorites.some((f) => f.kind === props.kind && f.id === props.id);
  return (
    // biome-ignore lint/a11y/useSemanticElements: span avoids nesting buttons inside clickable rows
    <span
      role="button"
      tabIndex={0}
      className="fav-star"
      aria-pressed={on}
      aria-label={
        on
          ? `Quitar ${props.label} de favoritos`
          : `Guardar ${props.label} en favoritos`
      }
      title={on ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite(props);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          toggleFavorite(props);
        }
      }}
    >
      <Star aria-hidden fill={on ? "currentColor" : "none"} />
    </span>
  );
}
