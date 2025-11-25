import { API_TIMEOUT_MS, API_MAX_LIMIT } from '../constants';
import type { LiquidationData, LiquidationsResponse } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_PUBLIC_API_URL ||
  (window.location.origin + "/api");

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage: string;
    const { status } = response;

    if (status === 404) {
      errorMessage = 'Requested data not found. The service may be unavailable.';
    } else if (status === 500) {
      errorMessage = 'Server is experiencing issues. Please try again in a moment.';
    } else if (status === 503) {
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (status >= 400 && status < 500) {
      errorMessage = 'Invalid request. Please try again.';
    } else if (status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else {
      errorMessage = `An unexpected error occurred with status: ${status}`;
    }

    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('Failed to parse server response');
  }
}

async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return handleResponse<T>(response);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection');
    }
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout. Please try again');
    }
    throw error;
  }
}

// Static data loaded from exported JSON file as fallback
let cachedStaticData: LiquidationsResponse | null = null;

async function loadStaticData(): Promise<LiquidationsResponse> {
  if (cachedStaticData) {
    return cachedStaticData;
  }

  const response = await fetch('/liquidations-data.json');
  if (!response.ok) {
    throw new Error(`Failed to load static data: ${response.status}`);
  }
  const data = await response.json();
  cachedStaticData = data;
  return data;
}

export const api = {
  async getLiquidations(limit: number, offset: number): Promise<LiquidationsResponse> {
    try {
      return await fetchWithErrorHandling<LiquidationsResponse>(
        `${API_BASE_URL}/liquidations?limit=${limit}&offset=${offset}`
      );
    } catch (error) {
      console.warn('API failed, falling back to static data:', error);
      const staticData = await loadStaticData();
      const paginatedData = staticData.data.slice(offset, offset + limit);
      return {
        data: paginatedData,
        totalCount: staticData.totalCount,
        limit: limit,
        offset: offset,
      };
    }
  },

  async getAllLiquidations(): Promise<LiquidationData[]> {
    try {
      const result = await fetchWithErrorHandling<LiquidationsResponse>(
        `${API_BASE_URL}/liquidations?limit=${API_MAX_LIMIT}&offset=0`
      );
      return result.data || [];
    } catch (error) {
      console.warn('API failed, falling back to static data:', error);
      const staticData = await loadStaticData();
      return staticData.data || [];
    }
  },
};
