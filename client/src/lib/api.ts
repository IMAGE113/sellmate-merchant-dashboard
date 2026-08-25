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

export interface DashboardOverview {
  total_orders: number;
  revenue: number;
  pending_orders: number;
  products: number;
  recent_orders: Order[];
  revenue_chart: ChartData[];
  top_products: TopProduct[];
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
  revenue_trend: ChartData[];
  orders_trend: ChartData[];
  total_revenue?: number;
  total_orders?: number;
  total_customers?: number;
  today_revenue?: number;
  today_orders?: number;
  monthly_revenue?: number;
  monthly_orders?: number;
  top_selling_product?: string;
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

function normalizeOrder(order: any): Order {
  const rawStatus = String(order?.status || '').toUpperCase();
  const status: Order['status'] = rawStatus === 'CANCELLED'
    ? 'cancelled'
    : rawStatus === 'COMPLETED' || rawStatus === 'PAYMENT_CONFIRMED'
    ? 'completed'
    : rawStatus === 'NEW_CHAT' || rawStatus === 'COLLECTING_INFO' || rawStatus === 'PAYMENT_PENDING_REVIEW'
    ? 'pending'
    : 'processing';
  return {
    order_id: String(order?.order_id ?? order?.order_number ?? order?.id ?? ''),
    customer_name: String(order?.customer_name ?? ''),
    phone: String(order?.phone ?? ''),
    amount: Number(order?.amount ?? order?.total_price ?? 0),
    status,
    created_at: String(order?.created_at ?? ''),
  };
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
      return Boolean(response.data?.valid ?? response.data?.success);
    } catch {
      return false;
    }
  }

  async getMe(): Promise<MeResponse> {
    const response = await this.client.get('/auth/me');
    const data = response.data || {};
    return {
      success: true,
      shop_id: String(data.shop_id ?? ''),
      shop_name: String(data.shop_name ?? data.name ?? ''),
      owner_name: String(data.owner_name ?? ''),
      phone: String(data.phone ?? ''),
      requirements: String(data.requirements ?? ''),
    };
  }

  // Dashboard endpoints
  async getDashboardOverview(): Promise<DashboardOverview> {
    const [overviewResponse, analyticsResponse, productsResponse] = await Promise.all([
      this.client.get('/dashboard/overview'),
      this.client.get('/dashboard/analytics'),
      this.client.get('/dashboard/products'),
    ]);
    const overview = overviewResponse.data || {};
    const stats = overview.stats || overview;
    const analytics = analyticsResponse.data || {};
    const products = Array.isArray(productsResponse.data)
      ? productsResponse.data
      : productsResponse.data?.products || [];
    return {
      total_orders: Number(stats.total_orders ?? analytics.total_orders ?? 0),
      revenue: Number(analytics.total_revenue ?? stats.revenue ?? 0),
      pending_orders: Number(stats.pending_orders ?? stats.pending_payments ?? 0),
      products: products.length,
      recent_orders: Array.isArray(overview.recent_orders)
        ? overview.recent_orders.map(normalizeOrder)
        : [],
      revenue_chart: Array.isArray(analytics.revenue_trend) ? analytics.revenue_trend : [],
      top_products: Array.isArray(analytics.top_products) ? analytics.top_products : [],
    };
  }

  async getOrders(page = 1, limit = 10): Promise<{ orders: Order[]; total: number }> {
    const response = await this.client.get('/dashboard/orders', {
      params: { limit, offset: Math.max(0, (page - 1) * limit) },
    });
    const raw = Array.isArray(response.data) ? response.data : response.data?.orders || [];
    return {
      orders: raw.map(normalizeOrder),
      total: Number(Array.isArray(response.data) ? raw.length : response.data?.total ?? raw.length),
    };
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.client.get(`/dashboard/orders/${orderId}`);
    return normalizeOrder(response.data);
  }

  async getProducts(page = 1, limit = 10): Promise<{ products: Product[]; total: number }> {
    const response = await this.client.get('/dashboard/products', {
      params: { page, limit },
    });
    const raw = Array.isArray(response.data) ? response.data : response.data?.products || [];
    const offset = Math.max(0, (page - 1) * limit);
    return {
      products: Array.isArray(response.data) ? raw.slice(offset, offset + limit) : raw,
      total: Number(Array.isArray(response.data) ? raw.length : response.data?.total ?? raw.length),
    };
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await this.client.get('/dashboard/analytics');
    const data = response.data || {};
    return {
      ...data,
      revenue_trend: Array.isArray(data.revenue_trend) ? data.revenue_trend : [],
      orders_trend: Array.isArray(data.orders_trend) ? data.orders_trend : [],
    };
  }

  async getProfile(): Promise<ProfileData> {
    const response = await this.client.get('/dashboard/profile');
    const data = response.data || {};
    return {
      shop_name: String(data.shop_name ?? data.name ?? ''),
      owner_name: String(data.owner_name ?? ''),
      phone: String(data.phone ?? ''),
      shop_id: String(data.shop_id ?? ''),
      requirements: String(data.requirements ?? ''),
    };
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
