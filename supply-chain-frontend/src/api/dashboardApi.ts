import axiosInstance from './axiosInstance';
import type { DashboardSummaryResponse } from '../types';

export const dashboardApi = {

  getSummary: async (): Promise<DashboardSummaryResponse> => {
    const response = await axiosInstance.get<DashboardSummaryResponse>('/dashboard/summary');
    return response.data;
  },
};
