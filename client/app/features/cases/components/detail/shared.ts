import { HttpError } from "../../../../lib/http";
import type { BadgeTone } from "../../../../components/ui";
import type { CaseStage } from "../../types";

export const isConflict = (error: unknown) => error instanceof HttpError && error.status === 409;

export const stageTone: Record<CaseStage, BadgeTone> = {
  Intake: "neutral",
  Preparation: "info",
  Filed: "info",
  Hearings: "accent",
  Judgment: "warning",
  Appeal: "warning",
  Enforcement: "success",
};

/** "" → null, trimmed. The API turns blank optional strings into null anyway. */
export const orNull = (value: string) => (value.trim() ? value.trim() : null);
