import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = 'https://sellmate-ai-backend.onrender.com/api';

export interface LoginRequest {
  shop_id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  shop_id: string;
  shop_name: string;
  owner_name: string;
}

export interface MeResponse {
  success: boolean;
  shop_id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  requirements: string;
}

export interface DashboardOverviewStats {
  pending_payments: number;
  recent_orders: number;
  confirmed_orders: number;
  cancelled_orders: number;
  total_orders: number;
}

export interface DashboardOverview {
  stats: DashboardOverviewStats;
  recent_orders: Order[];
}

export interface Order {
  order_id: string;
  customer_name: string;
  phone: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ChartData {
  date: string;
  revenue: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  sales: number;
  revenue: number;
}

export interface Product {
  product_id: string;
  product_name: string;
  price: number;
  status: 'active' | 'inactive';
  created_date: string;
}

export interface AnalyticsData {
  revenue_trend?: ChartData[];
  orders_trend?: ChartData[];
}

export interface ProfileData {
  shop_name: string;
  owner_name: string;
  phone: string;
  shop_id: string;
  requirements: string;
}

export interface TelegramBotConfig {
  bot_token: string;
  bot_username: string;
}

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.setupInterceptors();
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.client.post('/auth/verify-token', {});
      return response.data.success;
    } catch {
      return false;
    }
  }

  async getMe(): Promise<MeResponse> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.client.get('/dashboard/overview');
    return response.data;
  }

  async getOrders(page?: number, limit?: number): Promise<{ orders: Order[]; total: number }> {
    const response = await this.client.get('/dashboard/orders', {
      params: { page, limit },
    });
    return response.data;
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.client.get(`/dashboard/orders/${orderId}`);
    return response.data;
  }

  // ✅ [FIX] Backend လမ်းကြောင်းအတိုင်း /products ဆီ ပြောင်းခေါ်ထားတယ် Bro
  async getProducts(page?: number, limit?: number): Promise<Product[]> {
    const response = await this.client.get('/products', {
      params: { page, limit },
    });
    return response.data;
  }

  // ✅ [FIX] Backend လမ်းကြောင်းအတိုင်း /products ဆီ POST Request ပို့အောင် ညှိလိုက်ပြီ Bro
  async createProduct(data: { product_name: string; price: number; status: string }): Promise<{ success: boolean; data: Product }> {
    const response = await this.client.post('/products', data);
    return response.data;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await this.client.get('/dashboard/analytics');
    return response.data;
  }

  async getProfile(): Promise<ProfileData> {
    const response = await this.client.get('/dashboard/profile');
    return response.data;
  }

  async updateSettings(data: Partial<ProfileData>): Promise<{ success: boolean }> {
    const response = await this.client.post('/dashboard/settings', data);
    return response.data;
  }

  async updateRequirements(shopId: string, requirements: string): Promise<{ success: boolean }> {
    const response = await this.client.put(`/auth/merchant/requirements/${shopId}`, {
      requirements,
    });
    return response.data;
  }
}

export const apiClient = new APIClient();