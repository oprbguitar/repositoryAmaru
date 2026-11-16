import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAdminSession } from "./adminApi";
import "./admin.css";

/**
 * Sections that spend the owner's API credit are visible only to the
 * administrator in the public deployment; visitors get a short explanation
 * and the free alternative instead of a page full of failing requests.
 */
export function AdminOnly({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const session = useAdminSession();
  if (session.isLoading || session.data?.authenticated !== false)
    return <>{children}</>;
  return (
    <div className="adm-center">
      <div className="adm-login">
        <Lock aria-hidden="true" className="adm-login-icon" />
        <h1>{title}</h1>
        <p>
          Esta sección es una herramienta interna del administrador y solo está
          disponible con su sesión. Mientras tanto, puedes practicar con la IA
          gratuita en «Prompts y agentes».
        </p>
        <Link className="adm-link-button" to="/prompts">
          Ir a Prompts y agentes
        </Link>
        <Link className="adm-link-quiet" to="/admin">
          Soy el administrador
        </Link>
      </div>
    </div>
  );
}
