import {
  Apple,
  BarChart3,
  Brain,
  Briefcase,
  Calculator,
  Check,
  Code2,
  Cog,
  Copy,
  Dna,
  Factory,
  FlaskConical,
  GraduationCap,
  HardHat,
  HeartPulse,
  Landmark,
  Leaf,
  Megaphone,
  Mic,
  Mountain,
  PawPrint,
  Pill,
  Ruler,
  Scale,
  Smile,
  Sprout,
  Stethoscope,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { createContext, useContext, useState } from "react";
import { type Assistant, solesWithIgv } from "./tools";

export const PROFESSION_ICONS: Record<string, typeof Apple> = {
  Apple,
  BarChart3,
  Brain,
  Briefcase,
  Calculator,
  Code2,
  Cog,
  Dna,
  Factory,
  FlaskConical,
  GraduationCap,
  HardHat,
  HeartPulse,
  Landmark,
  Leaf,
  Megaphone,
  Mic,
  Mountain,
  PawPrint,
  Pill,
  Ruler,
  Scale,
  Smile,
  Sprout,
  Stethoscope,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
};

/** Tipo de cambio en uso (BCRP o el que escriba el visitante). */
export const FxContext = createContext<number | null>(null);

export function useRate() {
  return useContext(FxContext);
}

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

export function formatUsd(value: number) {
  return `US$ ${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

/** «US$ 20 · ≈ S/ 80 con IGV» o «varía por país». */
export function PriceTag({ usd }: { usd: number | null }) {
  const rate = useRate();
  if (usd === null) return <span className="ia-price">varía por país</span>;
  if (usd === 0)
    return (
      <span className="ia-price" data-free="true">
        Gratis
      </span>
    );
  return (
    <span className="ia-price">
      <span>{formatUsd(usd)}</span>
      {rate ? (
        <strong title="Precio de lista × tipo de cambio × 1,18 (IGV)">
          ≈ {soles.format(solesWithIgv(usd, rate))} <small>c/IGV</small>
        </strong>
      ) : null}
    </span>
  );
}

/** Primer plan pagado: el «siguiente paso» habitual. */
export function entryPaidPlan(assistant: Assistant) {
  return (
    assistant.plans.find((plan) => (plan.usd ?? 0) > 0) ??
    assistant.plans.find((plan) => plan.usd !== 0) ??
    null
  );
}

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }
  return { copied, copy };
}

export function CopyButton({
  text,
  id,
  label = "Copiar",
}: {
  text: string;
  id: string;
  label?: string;
}) {
  const { copied, copy } = useCopy();
  const done = copied === id;
  return (
    <button type="button" className="ia-button" onClick={() => copy(id, text)}>
      {done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {done ? "Copiado" : label}
    </button>
  );
}
