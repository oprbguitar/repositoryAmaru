import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronRight,
  Coins,
  FileText,
  HardDrive,
  Search,
  Sheet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { revealOnMobile } from "../../components/layout/mobile";
import { CaseSheet } from "./CaseSheet";
import { DocsGuide, LocalGuide, OfficeGuide, PlansGuide } from "./Guides";
import {
  countCases,
  GROUPS,
  PROFESSIONS,
  type Profession,
  professionById,
  searchCases,
} from "./professions";
import { FxContext, PROFESSION_ICONS } from "./shared";
import { TASKS } from "./tools";
import { useFx } from "./useFx";
import "./in-action.css";

const TABS = [
  { id: "profesiones", label: "Por profesión", icon: BriefcaseBusiness },
  { id: "planes", label: "Planes en soles", icon: Coins },
  { id: "oficina", label: "Oficina con IA", icon: Sheet },
  { id: "local", label: "IA local y tu PC", icon: HardDrive },
  { id: "documentos", label: "Documentos y tokens", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function InActionPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "profesiones";
  const fx = useFx();
  const [manualRate, setManualRate] = useState<number | null | undefined>(
    undefined,
  );
  const rate =
    manualRate === undefined ? (fx.reading?.rate ?? null) : manualRate;

  const patch = (next: Record<string, string | null>) => {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) copy.delete(key);
      else copy.set(key, value);
    }
    setParams(copy, { replace: false });
  };

  return (
    <FxContext.Provider value={rate}>
      <div className="ia-page scroll-region" data-guide="in-action">
        <header className="page-heading">
          <div>
            <h1>
              <BriefcaseBusiness aria-hidden="true" /> IA en acción
            </h1>
            <p>
              De la teoría a la práctica profesional: elige tu profesión, un
              caso real y mira cómo resolverlo con IA comercial o local, cuánto
              cuesta en soles y qué equipo necesitas.
            </p>
          </div>
        </header>

        <div
          className="ia-tabs"
          role="tablist"
          aria-label="Secciones de IA en acción"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`ia-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`ia-panel-${item.id}`}
                onClick={() =>
                  patch({ tab: item.id === "profesiones" ? null : item.id })
                }
              >
                <Icon aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`ia-panel-${tab}`}
          aria-labelledby={`ia-tab-${tab}`}
          className="ia-panel"
        >
          {tab === "profesiones" ? (
            <Explorer
              professionId={params.get("p")}
              caseId={params.get("c")}
              onPick={(p, c) => patch({ p, c })}
            />
          ) : null}
          {tab === "planes" ? (
            <PlansGuide
              rate={rate}
              period={
                manualRate === undefined ? (fx.reading?.period ?? null) : null
              }
              onRate={setManualRate}
            />
          ) : null}
          {tab === "oficina" ? <OfficeGuide /> : null}
          {tab === "local" ? <LocalGuide /> : null}
          {tab === "documentos" ? <DocsGuide /> : null}
        </div>
      </div>
    </FxContext.Provider>
  );
}

/* ------------------------------------------------------------------------ */

const EXAMPLES = [
  "Quiero analizar planos",
  "Necesito investigar jurisprudencia",
  "Conciliar cuentas en Excel",
  "Crear un asistente con mis libros",
];

function Explorer({
  professionId,
  caseId,
  onPick,
}: {
  professionId: string | null;
  caseId: string | null;
  onPick: (profession: string | null, item: string | null) => void;
}) {
  const profession = professionById(professionId);
  if (!profession) return <ProfessionPicker onPick={onPick} />;
  return (
    <ProfessionView profession={profession} caseId={caseId} onPick={onPick} />
  );
}

function ProfessionPicker({
  onPick,
}: {
  onPick: (profession: string | null, item: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => searchCases(query), [query]);

  return (
    <div className="ia-picker">
      <section className="ia-ask" aria-labelledby="ia-ask-title">
        <h2 id="ia-ask-title" className="ia-h2">
          ¿Qué necesitas resolver?
        </h2>
        <label className="ia-search">
          <Search aria-hidden="true" />
          <span className="ia-visually-hidden">Describe tu necesidad</span>
          <input
            type="search"
            value={query}
            placeholder="Ej.: quiero revisar un contrato, hacer un boletín epidemiológico…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="ia-examples">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
            >
              {example}
            </button>
          ))}
        </div>
        {query.trim() ? (
          hits.length ? (
            <ul className="ia-hits" aria-label="Casos sugeridos">
              {hits.map((hit) => (
                <li key={`${hit.profession.id}-${hit.item.id}`}>
                  <button
                    type="button"
                    onClick={() => onPick(hit.profession.id, hit.item.id)}
                  >
                    <span className="ia-hit-meta">
                      {hit.profession.label} · {hit.specialty.label}
                    </span>
                    <strong>{hit.item.title}</strong>
                    <small>{TASKS[hit.item.kind].label}</small>
                    <ChevronRight aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ia-empty">
              No encontré un caso parecido. Prueba con otras palabras o elige tu
              profesión abajo.
            </p>
          )
        ) : null}
      </section>

      <section aria-labelledby="ia-prof-title">
        <h2 id="ia-prof-title" className="ia-h2">
          O elige tu profesión
        </h2>
        {GROUPS.map((group) => {
          const items = PROFESSIONS.filter((p) => p.group === group.id);
          return (
            <div key={group.id} className="ia-group">
              <h3 className="ia-group-title">{group.label}</h3>
              <ul className="ia-prof-grid">
                {items.map((item, index) => {
                  const Icon = PROFESSION_ICONS[item.icon] ?? BriefcaseBusiness;
                  return (
                    <li
                      key={item.id}
                      style={{
                        animationDelay: `calc(var(--stagger) * ${index})`,
                      }}
                    >
                      <button
                        type="button"
                        className="ia-prof"
                        data-group={group.id}
                        onClick={() => onPick(item.id, null)}
                      >
                        <span className="ia-prof-icon">
                          <Icon aria-hidden="true" />
                        </span>
                        <span className="ia-prof-body">
                          <strong>{item.label}</strong>
                          <small>{item.summary}</small>
                        </span>
                        <span className="ia-prof-count">
                          {countCases(item)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ProfessionView({
  profession,
  caseId,
  onPick,
}: {
  profession: Profession;
  caseId: string | null;
  onPick: (profession: string | null, item: string | null) => void;
}) {
  const all = profession.specialties.flatMap((specialty) =>
    specialty.cases.map((item) => ({ specialty, item })),
  );
  const selected =
    all.find((entry) => entry.item.id === caseId) ?? all[0] ?? null;
  const Icon = PROFESSION_ICONS[profession.icon] ?? BriefcaseBusiness;

  useEffect(() => {
    if (caseId) revealOnMobile(".ia-sheet");
  }, [caseId]);

  return (
    <div className="ia-profession">
      <nav className="ia-crumbs" aria-label="Ruta">
        <button type="button" onClick={() => onPick(null, null)}>
          <ArrowLeft aria-hidden="true" /> Profesiones
        </button>
        <ChevronRight aria-hidden="true" />
        <span>{profession.label}</span>
        {selected ? (
          <>
            <ChevronRight aria-hidden="true" />
            <span>{selected.specialty.label}</span>
          </>
        ) : null}
      </nav>

      <div className="ia-layout">
        <aside className="ia-cases" aria-label={`Casos de ${profession.label}`}>
          <header className="ia-cases-head" data-group={profession.group}>
            <span className="ia-prof-icon">
              <Icon aria-hidden="true" />
            </span>
            <div>
              <h2>{profession.label}</h2>
              <p>{profession.summary}</p>
            </div>
          </header>
          {profession.specialties.map((specialty) => (
            <section key={specialty.id} className="ia-specialty">
              <h3>{specialty.label}</h3>
              <ul>
                {specialty.cases.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={selected?.item.id === item.id}
                      onClick={() => onPick(profession.id, item.id)}
                    >
                      <strong>{item.title}</strong>
                      <small>{TASKS[item.kind].label}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>

        {selected ? (
          <CaseSheet
            key={selected.item.id}
            profession={profession}
            specialty={selected.specialty}
            item={selected.item}
          />
        ) : null}
      </div>
    </div>
  );
}
