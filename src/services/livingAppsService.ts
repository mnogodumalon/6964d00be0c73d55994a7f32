// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Spiele, Spielzuege, Spielergebnisse, NeuesSpielStarten } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- SPIELE ---
  static async getSpiele(): Promise<Spiele[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SPIELE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSpieleEntry(id: string): Promise<Spiele | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SPIELE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSpieleEntry(fields: Spiele['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SPIELE}/records`, { fields });
  }
  static async updateSpieleEntry(id: string, fields: Partial<Spiele['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SPIELE}/records/${id}`, { fields });
  }
  static async deleteSpieleEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SPIELE}/records/${id}`);
  }

  // --- SPIELZUEGE ---
  static async getSpielzuege(): Promise<Spielzuege[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SPIELZUEGE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSpielzuegeEntry(id: string): Promise<Spielzuege | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SPIELZUEGE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSpielzuegeEntry(fields: Spielzuege['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SPIELZUEGE}/records`, { fields });
  }
  static async updateSpielzuegeEntry(id: string, fields: Partial<Spielzuege['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SPIELZUEGE}/records/${id}`, { fields });
  }
  static async deleteSpielzuegeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SPIELZUEGE}/records/${id}`);
  }

  // --- SPIELERGEBNISSE ---
  static async getSpielergebnisse(): Promise<Spielergebnisse[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SPIELERGEBNISSE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSpielergebnisseEntry(id: string): Promise<Spielergebnisse | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SPIELERGEBNISSE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSpielergebnisseEntry(fields: Spielergebnisse['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SPIELERGEBNISSE}/records`, { fields });
  }
  static async updateSpielergebnisseEntry(id: string, fields: Partial<Spielergebnisse['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SPIELERGEBNISSE}/records/${id}`, { fields });
  }
  static async deleteSpielergebnisseEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SPIELERGEBNISSE}/records/${id}`);
  }

  // --- NEUES_SPIEL_STARTEN ---
  static async getNeuesSpielStarten(): Promise<NeuesSpielStarten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.NEUES_SPIEL_STARTEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getNeuesSpielStartenEntry(id: string): Promise<NeuesSpielStarten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.NEUES_SPIEL_STARTEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createNeuesSpielStartenEntry(fields: NeuesSpielStarten['fields']) {
    return callApi('POST', `/apps/${APP_IDS.NEUES_SPIEL_STARTEN}/records`, { fields });
  }
  static async updateNeuesSpielStartenEntry(id: string, fields: Partial<NeuesSpielStarten['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.NEUES_SPIEL_STARTEN}/records/${id}`, { fields });
  }
  static async deleteNeuesSpielStartenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.NEUES_SPIEL_STARTEN}/records/${id}`);
  }

}