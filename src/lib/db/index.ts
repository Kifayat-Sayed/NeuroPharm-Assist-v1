import { LocalStorageRepository } from "./localStorageRepository";
import type { ClinicalRepository } from "./repository";

/**
 * Single swap point for persistence.
 * Replace this instance with a SupabaseRepository implementing the same
 * ClinicalRepository interface — no UI change required.
 */
export const repository: ClinicalRepository = new LocalStorageRepository();

export type { ClinicalRepository } from "./repository";
