export interface EmailVariant {
  subject: string;
  content: string;
  approach: string;
}

export interface LinkedInMessages {
  connectionRequest: string;
  followUpMessage: string;
}

export interface CallScript {
  opener: string;
  valueStatement: string;
  discoveryQuestions: string[];
  objectionHandling: Array<{ objection: string; response: string }>;
  closeForNext: string;
}

export interface SequenceStepMessage {
  step: number;
  day: number;
  channel: "EMAIL" | "LINKEDIN" | "PHONE";
  type: string;
  phase: "value" | "proof" | "competitor" | "breakup";
  content: string;
  subject?: string;
  subjectVariants?: string[];
  voicemail?: string;
  callScript?: CallScript;
}
