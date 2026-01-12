// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Spiele {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    spieler_x_vorname?: string;
    spieler_x_nachname?: string;
    spieler_o_vorname?: string;
    spieler_o_nachname?: string;
    startzeit?: string; // Format: YYYY-MM-DD oder ISO String
    spielfeld_status?: string;
  };
}

export interface Spielzuege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    spiel?: string; // applookup -> URL zu 'Spiele' Record
    zugnummer?: number;
    spieler?: string;
    position?: 'pos_1' | 'pos_2' | 'pos_3' | 'pos_4' | 'pos_5' | 'pos_6' | 'pos_7' | 'pos_8' | 'pos_9';
    zeitstempel?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Spielergebnisse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    spiel?: string; // applookup -> URL zu 'Spiele' Record
    ergebnis_typ?: string;
    gewinnkombination?: string;
    abschlusszeit?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface NeuesSpielStarten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    spieler_x_vorname?: string;
    spieler_x_nachname?: string;
    spieler_o_vorname?: string;
    spieler_o_nachname?: string;
  };
}

export const APP_IDS = {
  SPIELE: '6964cfc206171dabddb09843',
  SPIELZUEGE: '6964cfdfce3141177669c2e3',
  SPIELERGEBNISSE: '6964cfdfb4cd8a71412f8a2d',
  NEUES_SPIEL_STARTEN: '6964cfe025e723424f4f8ddd',
} as const;

// Helper Types for creating new records
export type CreateSpiele = Spiele['fields'];
export type CreateSpielzuege = Spielzuege['fields'];
export type CreateSpielergebnisse = Spielergebnisse['fields'];
export type CreateNeuesSpielStarten = NeuesSpielStarten['fields'];