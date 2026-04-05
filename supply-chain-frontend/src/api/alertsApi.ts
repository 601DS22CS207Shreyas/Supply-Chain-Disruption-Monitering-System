import axiosInstance from './axiosInstance';
import type { AlertResponse, PageResponse } from '../types';

export const alertsApi = {

  getAlerts: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AlertResponse>> => {
    const response = await axiosInstance.get<PageResponse<AlertResponse>>('/alerts', { params });
    return response.data;
  },

  markAsRead: async (id: number): Promise<AlertResponse> => {
    const response = await axiosInstance.put<AlertResponse>(`/alerts/${id}/read`);
    return response.data;
  },
};
