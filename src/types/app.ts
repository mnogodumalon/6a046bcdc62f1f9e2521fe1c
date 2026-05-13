// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Test {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    email?: string;
    bemerkung?: string;
    vorname?: string;
    nachname?: string;
  };
}

export const APP_IDS = {
  TEST: '6a046ba1d1f583d7742ef7aa',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'test': {
    'email': 'string/email',
    'bemerkung': 'string/textarea',
    'vorname': 'string/text',
    'nachname': 'string/text',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateTest = StripLookup<Test['fields']>;