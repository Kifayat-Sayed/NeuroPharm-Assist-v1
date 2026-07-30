// Standard DN4 questionnaire — 10 items across 4 sections.
// Score >= 4 / 10 suggests neuropathic pain.
// The 10 individual responses are the source of truth; the score is derived.

export type DN4ItemId =
  | "burning"
  | "painfulCold"
  | "electricShock"
  | "tingling"
  | "pricking"
  | "numbness"
  | "itching"
  | "touchHypoesthesia"
  | "prickingHypoesthesia"
  | "brushing";

export interface DN4Item {
  id: DN4ItemId;
  label: string;
}

export interface DN4Section {
  key: "interview" | "exam";
  number: 1 | 2 | 3 | 4;
  title: string;
  prompt: string;
  items: DN4Item[];
}

export const DN4_VERSION = "DN4 v1 (10-item)";

export const DN4_SECTIONS: DN4Section[] = [
  {
    key: "interview",
    number: 1,
    title: "Pain Characteristics",
    prompt: "Does the pain have one or more of the following characteristics?",
    items: [
      { id: "burning", label: "Burning" },
      { id: "painfulCold", label: "Painful Cold" },
      { id: "electricShock", label: "Electric Shock-like Pain" },
    ],
  },
  {
    key: "interview",
    number: 2,
    title: "Associated Symptoms",
    prompt: "Is the pain associated with one or more of these symptoms in the same area?",
    items: [
      { id: "tingling", label: "Tingling" },
      { id: "pricking", label: "Pricking" },
      { id: "numbness", label: "Numbness" },
      { id: "itching", label: "Itching" },
    ],
  },
  {
    key: "exam",
    number: 3,
    title: "Clinical Examination",
    prompt: "Examination of the painful area reveals:",
    items: [
      { id: "touchHypoesthesia", label: "Touch Hypoesthesia" },
      { id: "prickingHypoesthesia", label: "Pricking Hypoesthesia" },
    ],
  },
  {
    key: "exam",
    number: 4,
    title: "Provoked Pain",
    prompt: "Can the pain be caused or increased by:",
    items: [{ id: "brushing", label: "Pain Increased by Brushing" }],
  },
];

export const DN4_ITEMS: DN4Item[] = DN4_SECTIONS.flatMap((s) => s.items);

export type DN4Responses = Partial<Record<DN4ItemId, boolean>>;

export function dn4Label(id: DN4ItemId): string {
  return DN4_ITEMS.find((i) => i.id === id)?.label ?? id;
}

export function dn4Score(responses: DN4Responses | undefined): number {
  if (!responses) return 0;
  return DN4_ITEMS.reduce((n, it) => n + (responses[it.id] ? 1 : 0), 0);
}

export function dn4AnsweredCount(responses: DN4Responses | undefined): number {
  if (!responses) return 0;
  return DN4_ITEMS.reduce((n, it) => n + (responses[it.id] === undefined ? 0 : 1), 0);
}

export function dn4Interpretation(score: number): {
  label: string;
  short: string;
  detail: string;
  tone: "success" | "warning" | "critical";
} {
  if (score >= 7) {
    return {
      label: "Neuropathic Pain Likely",
      short: "Strongly suggestive of neuropathic pain",
      detail:
        "Score >= 7/10 — high probability of a neuropathic mechanism. Prioritise first-line neuropathic agents and close follow-up.",
      tone: "critical",
    };
  }
  if (score >= 4) {
    return {
      label: "Neuropathic Pain Likely",
      short: "Suggestive of neuropathic pain",
      detail:
        "Score >= 4/10 — a neuropathic mechanism is likely. Consider first-line neuropathic therapy and review current analgesia.",
      tone: "warning",
    };
  }
  return {
    label: "Neuropathic Pain Unlikely",
    short: "Neuropathic pain unlikely",
    detail:
      "Score < 4/10 — a neuropathic mechanism is unlikely. Reassess if the symptom pattern evolves.",
    tone: "success",
  };
}

export function severityFromScore(score: number): "mild" | "moderate" | "severe" {
  if (score >= 7) return "severe";
  if (score >= 4) return "moderate";
  return "mild";
}
