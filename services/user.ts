import api from "./api";

export const getMe = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getTransactions = async (page = 0, limit = 10) => {
  try {
    const response = await api.get("/transactions", {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getQrCode = async () => {
  try {
    const response = await api.get("/discover/qr");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const broadcastDiscovery = async ({ token }: { token: string }) => {
  try {
    const response = await api.post("/discover/broadcast", { token });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const stopDiscoveryBroadcast = async () => {
  try {
    const response = await api.delete("/discover/broadcast");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const resolveDiscoveryTokens = async (tokens: string[]) => {
  try {
    const response = await api.post("/discover/resolve", { tokens });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getFraudDetail = async (id: string) => {
  try {
    const response = await api.get(`/transactions/${id}/fraud-detail`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
