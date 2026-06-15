import { useEffect, useState } from 'react';
import { apiClient, AnalyticsData } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import axios from 'axios';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const analytics = await apiClient.getAnalytics();
      setData(analytics);
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load analytics'
        : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <Button onClick={fetchAnalytics} variant="outline" disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (data?.revenue_trend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.revenue_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </Card>

          {/* Orders Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Orders Trend</h3>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (data?.orders_trend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.orders_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </Card>
        </div>

        {/* Combined Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue & Orders Overview</h3>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (data?.revenue_trend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data?.revenue_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </Card>
      </div>
    </DashboardLayout>
  );
}