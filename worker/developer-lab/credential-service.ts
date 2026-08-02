import {
  type CredentialState,
  DEVELOPER_LAB_PROVIDERS,
  getDeveloperLabProvider,
} from "../../lib/developer-lab/registry";
import type {
  CredentialMetadata,
  CredentialStorage,
} from "../../lib/developer-lab/types";
import { openSecret, sealSecret } from "../secret-box";

export type DeveloperLabCredentialEnv = {
  DB: D1Database;
  CACHE: KVNamespace;
  DEVELOPER_LAB_ENCRYPTION_KEY?: string;
  [key: string]: unknown;
};

type StoredCredential = {
  provider_id: string;
  credential_alias: string;
  credential_last_four: string;
  encrypted_credential: string;
  encryption_iv: string;
  credential_state: CredentialState;
  verified_at: string | null;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
};

type TemporaryCredential = {
  alias: string;
  lastFour: string;
  encryptedCredential: string;
  iv: string;
  state: CredentialState;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  lastTestedAt: string | null;
};

async function encrypt(
  value: string,
  env: DeveloperLabCredentialEnv,
): Promise<{ encryptedCredential: string; iv: string }> {
  const sealed = await sealSecret(value, env.DEVELOPER_LAB_ENCRYPTION_KEY);
  return { encryptedCredential: sealed.encryptedValue, iv: sealed.iv };
}

async function decrypt(
  encryptedCredential: string,
  iv: string,
  env: DeveloperLabCredentialEnv,
): Promise<string> {
  return openSecret(
    { encryptedValue: encryptedCredential, iv },
    env.DEVELOPER_LAB_ENCRYPTION_KEY,
  );
}

function temporaryKey(providerId: string): string {
  return `developer-lab:credential:${providerId}`;
}

function environmentCredential(
  providerId: string,
  env: DeveloperLabCredentialEnv,
): CredentialMetadata | null {
  const provider = getDeveloperLabProvider(providerId);
  const binding = provider?.credentialBinding;
  const value = binding ? env[binding] : null;
  if (typeof value !== "string" || value.length < 4) return null;
  return {
    providerId,
    alias: binding ?? "Entorno",
    lastFour: value.slice(-4),
    state: "configured",
    storage: "environment",
    verifiedAt: null,
    lastTestedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function rowMetadata(row: StoredCredential): CredentialMetadata {
  return {
    providerId: row.provider_id,
    alias: row.credential_alias,
    lastFour: row.credential_last_four,
    state: row.credential_state,
    storage: "local_encrypted",
    verifiedAt: row.verified_at,
    lastTestedAt: row.last_tested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function temporaryMetadata(
  providerId: string,
  item: TemporaryCredential,
): CredentialMetadata {
  return {
    providerId,
    alias: item.alias,
    lastFour: item.lastFour,
    state: item.state,
    storage: "temporary_encrypted",
    verifiedAt: item.verifiedAt,
    lastTestedAt: item.lastTestedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export class ProviderCredentialService {
  constructor(private readonly env: DeveloperLabCredentialEnv) {}

  async configureCredential(input: {
    providerId: string;
    credential: string;
    alias?: string;
    storage: "temporary" | "local";
  }): Promise<CredentialMetadata> {
    const provider = getDeveloperLabProvider(input.providerId);
    if (!provider?.credentialBinding)
      throw new Error("Este proveedor no usa una credencial configurable.");
    const credential = input.credential.trim();
    if (credential.length < 8)
      throw new Error("La credencial no tiene una longitud válida.");
    const alias = input.alias?.trim().slice(0, 80) || provider.name;
    const now = new Date().toISOString();
    const encrypted = await encrypt(credential, this.env);
    if (input.storage === "temporary") {
      const item: TemporaryCredential = {
        alias,
        lastFour: credential.slice(-4),
        encryptedCredential: encrypted.encryptedCredential,
        iv: encrypted.iv,
        state: "configured",
        createdAt: now,
        updatedAt: now,
        verifiedAt: null,
        lastTestedAt: null,
      };
      await this.env.CACHE.put(
        temporaryKey(input.providerId),
        JSON.stringify(item),
        {
          expirationTtl: 60 * 60 * 8,
        },
      );
      return temporaryMetadata(input.providerId, item);
    }
    await this.env.DB.prepare(`
      INSERT INTO developer_lab_provider_configs (
        provider_id, credential_alias, credential_last_four, encrypted_credential,
        encryption_iv, credential_state, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'configured', ?, ?)
      ON CONFLICT(provider_id) DO UPDATE SET
        credential_alias = excluded.credential_alias,
        credential_last_four = excluded.credential_last_four,
        encrypted_credential = excluded.encrypted_credential,
        encryption_iv = excluded.encryption_iv,
        credential_state = 'configured', verified_at = NULL, last_tested_at = NULL,
        updated_at = excluded.updated_at
    `)
      .bind(
        input.providerId,
        alias,
        credential.slice(-4),
        encrypted.encryptedCredential,
        encrypted.iv,
        now,
        now,
      )
      .run();
    const stored = await this.getStored(input.providerId);
    if (!stored) throw new Error("No se pudo guardar la credencial cifrada.");
    return rowMetadata(stored);
  }

  async resolveCredential(providerId: string): Promise<string> {
    const temporary = await this.env.CACHE.get<TemporaryCredential>(
      temporaryKey(providerId),
      "json",
    );
    if (temporary)
      return decrypt(temporary.encryptedCredential, temporary.iv, this.env);
    const stored = await this.getStored(providerId);
    if (stored)
      return decrypt(
        stored.encrypted_credential,
        stored.encryption_iv,
        this.env,
      );
    const provider = getDeveloperLabProvider(providerId);
    const value = provider?.credentialBinding
      ? this.env[provider.credentialBinding]
      : null;
    if (typeof value === "string" && value.trim()) return value.trim();
    throw new Error("Credencial no configurada.");
  }

  async deleteCredential(
    providerId: string,
  ): Promise<CredentialStorage | null> {
    const temporary = await this.env.CACHE.get(temporaryKey(providerId));
    if (temporary) {
      await this.env.CACHE.delete(temporaryKey(providerId));
      return "temporary_encrypted";
    }
    const result = await this.env.DB.prepare(
      "DELETE FROM developer_lab_provider_configs WHERE provider_id = ?",
    )
      .bind(providerId)
      .run();
    if (result.meta.changes) return "local_encrypted";
    return environmentCredential(providerId, this.env)?.storage ?? null;
  }

  async listCredentialMetadata(): Promise<CredentialMetadata[]> {
    const rows = await this.env.DB.prepare(
      "SELECT * FROM developer_lab_provider_configs",
    ).all<StoredCredential>();
    const stored = new Map(rows.results.map((row) => [row.provider_id, row]));
    const metadata: CredentialMetadata[] = [];
    for (const provider of DEVELOPER_LAB_PROVIDERS) {
      const temporary = await this.env.CACHE.get<TemporaryCredential>(
        temporaryKey(provider.id),
        "json",
      );
      if (temporary) metadata.push(temporaryMetadata(provider.id, temporary));
      else if (stored.has(provider.id))
        metadata.push(rowMetadata(stored.get(provider.id) as StoredCredential));
      else {
        const item = environmentCredential(provider.id, this.env);
        if (item) metadata.push(item);
      }
    }
    return metadata;
  }

  async updateTestState(
    providerId: string,
    state: CredentialState,
    testedAt: string,
    details: {
      httpStatus: number | null;
      latencyMs: number;
      modelCount: number | null;
      message: string;
    },
  ): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO developer_lab_provider_status (
        provider_id, credential_state, last_http_status, last_latency_ms,
        discovered_model_count, last_message, last_tested_at, last_success_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'connection_verified' THEN ? ELSE NULL END, ?)
      ON CONFLICT(provider_id) DO UPDATE SET credential_state = excluded.credential_state,
        last_http_status = excluded.last_http_status, last_latency_ms = excluded.last_latency_ms,
        discovered_model_count = excluded.discovered_model_count, last_message = excluded.last_message,
        last_tested_at = excluded.last_tested_at,
        last_success_at = CASE WHEN excluded.credential_state = 'connection_verified'
          THEN excluded.last_tested_at ELSE developer_lab_provider_status.last_success_at END,
        updated_at = excluded.updated_at
    `)
      .bind(
        providerId,
        state,
        details.httpStatus,
        details.latencyMs,
        details.modelCount,
        details.message.slice(0, 240),
        testedAt,
        state,
        testedAt,
        testedAt,
      )
      .run();
    const temporary = await this.env.CACHE.get<TemporaryCredential>(
      temporaryKey(providerId),
      "json",
    );
    if (temporary) {
      const next = {
        ...temporary,
        state,
        lastTestedAt: testedAt,
        verifiedAt:
          state === "connection_verified" ? testedAt : temporary.verifiedAt,
        updatedAt: testedAt,
      };
      await this.env.CACHE.put(temporaryKey(providerId), JSON.stringify(next), {
        expirationTtl: 60 * 60 * 8,
      });
      return;
    }
    await this.env.DB.prepare(`
      UPDATE developer_lab_provider_configs SET credential_state = ?, last_tested_at = ?,
        verified_at = CASE WHEN ? = 'connection_verified' THEN ? ELSE verified_at END,
        updated_at = ? WHERE provider_id = ?
    `)
      .bind(state, testedAt, state, testedAt, testedAt, providerId)
      .run();
  }

  private async getStored(
    providerId: string,
  ): Promise<StoredCredential | null> {
    return this.env.DB.prepare(
      "SELECT * FROM developer_lab_provider_configs WHERE provider_id = ?",
    )
      .bind(providerId)
      .first<StoredCredential>();
  }
}
