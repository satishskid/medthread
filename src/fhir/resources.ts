export interface Patient {
  resourceType: 'Patient';
  id: string;
  name: { family?: string; given: string[] };
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
}

export interface Observation {
  resourceType: 'Observation';
  id: string;
  code: { coding: { system: string; code: string; display: string }[] };
  valueQuantity?: { value: number; unit: string };
  issued: string;
}

export interface Condition {
  resourceType: 'Condition';
  id: string;
  subject: { reference: string };
  code: { coding: { system: string; code: string; display: string }[] };
  onsetDateTime?: string;
  recordedDate: string;
}

export interface DocumentReference {
  resourceType: 'DocumentReference';
  id: string;
  subject: { reference: string };
  content: {
    attachment: {
      contentType: string;
      data?: string;
      url?: string;
      title?: string;
    };
  }[];
  date: string;
}

export interface Task {
  resourceType: 'Task';
  id: string;
  status: 'draft' | 'requested' | 'received' | 'accepted' | 'rejected' | 'ready' | 'cancelled' | 'in-progress' | 'on-hold' | 'failed' | 'completed' | 'entered-in-error';
  intent: 'unknown' | 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  description?: string;
  for?: { reference: string };
  authoredOn: string;
  lastModified?: string;
  owner?: { reference: string };
}

// Utility types for common FHIR elements
export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Quantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}