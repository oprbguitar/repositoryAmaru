import {
  Cpu,
  ExternalLink,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import {
  DEVICE_TARGETS,
  type DeviceId,
  type DeviceTarget,
  fitsDevice,
  readyFor,
} from "../../../lib/models/devices";
import type { HubModel } from "../../../lib/models/hub";

export const DEVICE_ICONS: Record<DeviceId, typeof Monitor> = {
  pc: Monitor,
  android: Smartphone,
  ios: Tablet,
  web: Globe,
  edge: Cpu,
};

/** Quiet, collapsible note: what the chosen device needs and which apps. */
export function DeviceStrip({ device }: { device: DeviceTarget }) {
  const Icon = DEVICE_ICONS[device.id];
  return (
    <details className="mh-device-strip">
      <summary>
        <Icon aria-hidden />
        <span>
          <strong>{device.label}</strong> · modelos de {device.sizes}
        </span>
        <small>Requisitos y apps</small>
      </summary>
      <p>{device.needs}</p>
      <ul>
        {device.apps.map((app) => (
          <li key={app.name}>
            <a href={app.url} target="_blank" rel="noreferrer">
              {app.name} <ExternalLink aria-hidden />
            </a>
            <small>{app.note}</small>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** «Dónde funciona»: one chip per device class for a model. */
export function DeviceChips({ model }: { model: HubModel }) {
  return (
    <ul className="mh-device-chips" aria-label="Dónde funciona">
      {DEVICE_TARGETS.map((device) => {
        const Icon = DEVICE_ICONS[device.id];
        const fits = fitsDevice(model, device);
        const ready = readyFor(model, device);
        const state = !fits ? "no" : ready ? "ready" : "convert";
        const title = !fits
          ? model.estimatedPackageBytes === null
            ? `${device.label}: sin tamaño publicado para estimar.`
            : `${device.label}: demasiado grande (límite orientativo ${device.sizes}).`
          : ready
            ? `${device.label}: cabe y el repositorio ya trae un formato compatible.`
            : `${device.label}: cabe, pero necesitas una conversión (${device.formats.join(" / ").toUpperCase()}).`;
        return (
          <li key={device.id} data-state={state} title={title}>
            <Icon aria-hidden />
            <span>{device.short}</span>
            <span className="mh-visually-hidden">{title}</span>
          </li>
        );
      })}
    </ul>
  );
}
