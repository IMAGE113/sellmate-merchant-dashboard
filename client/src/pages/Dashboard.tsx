import { useState, useEffect } from 'react';
import { apiClient, DashboardOverview } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart3, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import axios from 'axios';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const overview = await apiClient.getDashboardOverview();
      setData(overview);
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load dashboard'
        : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Overview</h1>
          <Button onClick={fetchData} variant="outline" disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={fetchData} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </Card>
              ))
          ) : data ? (
            <>
              <StatCard
                title="Total Orders"
                value={data?.stats?.total_orders ?? 0}
                icon={ShoppingCart}
                color="blue"
              />
              <StatCard
                title="Pending Payments"
                value={data?.stats?.pending_payments ?? 0}
                icon={TrendingUp}
                color="orange"
              />
              <StatCard
                title="Confirmed Orders"
                value={data?.stats?.confirmed_orders ?? 0}
                icon={ShoppingCart}
                color="green"
              />
              <StatCard
                title="Cancelled Orders"
                value={data?.stats?.cancelled_orders ?? 0}
                icon={Package}
                color="purple"
              />
            </>
          ) : null}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Revenue data not available</p>
              </div>
            )}
          </Card>

          {/* Top Products */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Products</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Top products data not available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (data?.recent_orders?.length ?? 0) > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_orders ?? []).map((order) => (
                    <tr key={order?.order_id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-3 px-4 text-foreground">{order?.order_id || 'N/A'}</td>
                      <td className="py-3 px-4 text-foreground">{order?.customer_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-foreground font-semibold">${(order?.amount ?? 0).toLocaleString()}</td>
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
                          {order?.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No recent orders</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
