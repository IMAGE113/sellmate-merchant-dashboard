import { useEffect, useState } from 'react';
import { apiClient, Order } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [page, limit]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getOrders(page, limit);
      
      // ✅ [FIX] Response ဒေတာပုံစံ ဘယ်လိုပဲ လွဲလာပါစေ Crash မဖြစ်အောင် ပိတ်စစ်ထားတယ် Bro
      if (response && Array.isArray(response.orders)) {
        setOrders(response.orders);
        setTotal(response.total ?? response.orders.length);
      } else if (Array.isArray(response)) {
        // တကယ်လို့ API က orders: Object မဟုတ်ဘဲ Array တိုက်ရိုက် ပို့လာခဲ့ရင်
        setOrders(response);
        setTotal(response.length);
      } else {
        setOrders([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load orders'
        : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      setOrders([]); // Error ဖြစ်ရင်လည်း ဗလာ Array ပေးပြီး App ကို အသေခံမယ် Bro
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ [FIX] orders က Array ဖြစ်မှ filter ပတ်မယ်လို့ သေချာ ကာကွယ်ထားတယ် Bro
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    if (!order) return false;
    
    // Safety check for strings to prevent undefined.toLowerCase() crash
    const orderId = order.order_id || "";
    const customerName = order.customer_name || "";
    const phone = order.phone || "";

    const matchesSearch =
      orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
      
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <Button onClick={fetchOrders} variant="outline" disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={fetchOrders} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, Customer, or Phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order?.order_id || Math.random().toString()} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{order?.order_id || 'N/A'}</td>
                      <td className="py-3 px-4 text-foreground">{order?.customer_name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-foreground">{order?.phone || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">${(order?.amount ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order?.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order?.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order?.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {order?.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {order?.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} orders
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}