export type Severity = "HIGH" | "MEDIUM" | "LOW" | "ERROR";

export type TellMethod = "regex" | "stat" | "llm-only";

/** Convenience alias for the three possible tell lifecycle states. */
export type TellStatus = "active" | "stub" | "planned";

/** Shared fields present on every tell regardless of status. */
interface TellBase {
  id: string;
  title: string;
  category: "surface" | "rhythm" | "king";
  method: TellMethod;
  defaultSeverity: Severity;
  summary: string;
  bad?: string;
  fix?: string;
  source?: string;
  params?: Record<string, unknown>;
}

/**
 * A voice tell from the registry.
 *
 * The union on `status` makes illegal states unrepresentable:
 * - `"planned"` tells carry a `planned:`-prefixed detector string; no runnable fn exists yet.
 * - `"active"` and `"stub"` tells carry a plain detector function name.
 *
 * `method:"llm-only"` tells may appear with any status but are rejected at runtime by
 * `resolveDetector`; they must never reach the deterministic linter core.
 */
export type Tell =
  | (TellBase & { status: "planned"; detector: `planned:${string}` })
  | (TellBase & { status: "stub";    detector: string })
  | (TellBase & { status: "active";  detector: string });

export interface Finding {
  ruleId: string;
  severity: Severity;
  line?: number;
  match?: string;
  message: string;
}

/** Registry-based rule shape: references a tell by stable id. */
export interface Rule {
  tellId: string;
  enabled: boolean;
  severity: Severity;
  params?: Record<string, unknown>;
}

export interface Profile {
  name: string;
  channel?: string;
  lang?: string;
  persona?: string;
  description?: string;
  registry?: string;
  rules: Rule[];
  /** Step-4 stub: reserved for King-operationalized rewrite steps. Not yet populated. */
  procedure?: never[];
}
