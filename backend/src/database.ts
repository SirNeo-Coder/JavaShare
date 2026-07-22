import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DatabaseMode = "supabase-local" | "supabase-online";

export type DatabaseHealth = {
  mode: DatabaseMode;
  connected: boolean;
  repositoryStatus: "ready";
  detail?: string;
};

export interface DatabaseProvider {
  readonly mode: DatabaseMode;
  connect(): Promise<void>;
  health(): Promise<DatabaseHealth>;
}

function readDatabaseMode(): DatabaseMode {
  const value = process.env.DATABASE_MODE?.trim() || "supabase-online";
  if (value === "supabase-local" || value === "supabase-online") return value;
  throw new Error(`Invalid DATABASE_MODE "${value}". Use supabase-local or supabase-online.`);
}

class SupabaseDatabaseProvider implements DatabaseProvider {
  private client: SupabaseClient | null = null;

  constructor(readonly mode: "supabase-local" | "supabase-online") {}

  private getClient() {
    if (this.client) return this.client;
    const url = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceRoleKey) {
      throw new Error(`SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DATABASE_MODE=${this.mode}.`);
    }
    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.client;
  }

  async connect() {
    const { error } = await this.getClient().from("profiles").select("id").limit(1);
    if (error) throw new Error(`Supabase connection failed: ${error.message}`);
  }

  async health(): Promise<DatabaseHealth> {
    try {
      const { error } = await this.getClient().from("profiles").select("id").limit(1);
      return {
        mode: this.mode,
        connected: !error,
        repositoryStatus: "ready",
        ...(error ? { detail: error.message } : {}),
      };
    } catch (error) {
      return {
        mode: this.mode,
        connected: false,
        repositoryStatus: "ready",
        detail: error instanceof Error ? error.message : "Supabase health check failed",
      };
    }
  }

  adminClient() {
    return this.getClient();
  }
}

export const database = new SupabaseDatabaseProvider(readDatabaseMode());

export function getSupabaseAdmin() {
  return database.adminClient();
}

export function createSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required for Supabase authentication.");
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
