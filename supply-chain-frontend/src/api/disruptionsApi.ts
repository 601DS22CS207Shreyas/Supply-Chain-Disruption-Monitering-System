import axiosInstance from './axiosInstance';
import type { DisruptionEventResponse, PageResponse } from '../types';

export const disruptionsApi = {

  getAll: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<DisruptionEventResponse>> => {
    const response = await axiosInstance.get<PageResponse<DisruptionEventResponse>>('/disruptions', { params });
    return response.data;
  },

  getActive: async (): Promise<DisruptionEventResponse[]> => {
    const response = await axiosInstance.get<DisruptionEventResponse[]>('/disruptions/active');
    return response.data;
  },

  fetchLatestNews: async (): Promise<{ message: string; newEventsAdded: number }> => {
    const response = await axiosInstance.post('/disruptions/fetch-latest');
    return response.data;
  },
};
