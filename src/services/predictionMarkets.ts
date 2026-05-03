import { api } from './api';
import type { Market } from '../types';

function normalizeMarket(raw: Record<string, unknown>): Market {
  const userVote =
    raw.userVote === 'yes' || raw.userVote === 'no' ? raw.userVote : null;
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    category: raw.category as Market['category'],
    votesYes: Number(raw.votesYes ?? 0),
    votesNo: Number(raw.votesNo ?? 0),
    buttonLabelYes: String(raw.buttonLabelYes ?? 'Vote YES'),
    buttonLabelNo: String(raw.buttonLabelNo ?? 'Vote NO'),
    userVote,
    volume: Number(raw.volume ?? 0),
    endDate: String(raw.endDate ?? ''),
    image: String(raw.image ?? ''),
  };
}

export async function fetchMarkets(params?: { creator?: string; limit?: number }): Promise<Market[]> {
  const { data } = await api.get<unknown[]>('/markets/', { params });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeMarket(row as Record<string, unknown>));
}

export async function createMarketDraft(payload: {
  title: string;
  category: Market['category'];
  buttonLabelYes: string;
  buttonLabelNo: string;
  volume: number;
  endDate: string;
  image: string;
}): Promise<Market> {
  const { data } = await api.post<unknown>('/markets/', {
    title: payload.title,
    category: payload.category,
    buttonLabelYes: payload.buttonLabelYes,
    buttonLabelNo: payload.buttonLabelNo,
    volume: payload.volume,
    endDate: payload.endDate,
    image: payload.image,
  });
  return normalizeMarket(data as Record<string, unknown>);
}

export async function voteMarket(marketId: string, side: 'yes' | 'no'): Promise<Market> {
  const { data } = await api.post<unknown>(`/markets/${marketId}/vote/`, { side });
  return normalizeMarket(data as Record<string, unknown>);
}
