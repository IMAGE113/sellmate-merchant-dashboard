import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter"; // useLocation ထည့်ထားပါတယ်
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import OrdersPage from "./pages/Orders";
import ProductsPage from "./pages/Products";
import AnalyticsPage from "./pages/Analytics";
import SettingsPage from "./pages/Settings";

// ဘာ route မှ မဟုတ်တဲ့ / (root) ကို ဝင်လာရင် /dashboard ဆီ အလိုအလျောက် ပို့ပေးမယ့် Component
function HomeRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* တရားခံကို ဖမ်းဖို့ ဒီလိုင်းလေး တည့်တည့် ထည့်လိုက်ပါပြီ */}
      <Route path="/" component={HomeRedirect} /> 
      
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/orders">
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/products">
        <ProtectedRoute>
          <ProductsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/analytics">
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;