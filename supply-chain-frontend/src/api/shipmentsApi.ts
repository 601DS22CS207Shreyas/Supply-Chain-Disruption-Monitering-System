import axiosInstance from './axiosInstance';
import type {
    ShipmentResponse,
    ShipmentDetailResponse,
    CreateShipmentRequest,
    UpdateShipmentStatusRequest,
    PageResponse,
} from '../types';

export const shipmentsApi = {

  getShipments: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ShipmentResponse>> => {
    const response = await axiosInstance.get<PageResponse<ShipmentResponse>>('/shipments', { params });
    return response.data;
  },

  getShipmentById: async (id: number): Promise<ShipmentDetailResponse> => {
    const response = await axiosInstance.get<ShipmentDetailResponse>(`/shipments/${id}`);
    return response.data;
  },

  createShipment: async (data: CreateShipmentRequest): Promise<ShipmentResponse> => {
    const response = await axiosInstance.post<ShipmentResponse>('/shipments', data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateShipmentStatusRequest): Promise<ShipmentResponse> => {
    const response = await axiosInstance.put<ShipmentResponse>(`/shipments/${id}/status`, data);
    return response.data;
  },

  deleteShipment: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/shipments/${id}`);
  },

  predictRisk: async (id: number) => {
    const response = await axiosInstance.post(`/risk/predict/${id}`);
    return response.data;
  },
};
