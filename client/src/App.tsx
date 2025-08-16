import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { navItems } from "./nav-items";
import Local from "./pages/Local";
import Politics from "./pages/Politics";
import Crime from "./pages/Crime";
import Sports from "./pages/Sports";
import Entertainment from "./pages/Entertainment";
import Contact from "./pages/Contact";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NewsDetail from "./pages/NewsDetail";
import AllNews from "./pages/AllNews";
import CategoryNews from "./pages/CategoryNews";
import Donate from "./pages/Donate";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import TestSystems from "./pages/TestSystems";
import Login from "./pages/Login";
import DisasterAlert from "@/pages/DisasterAlert";
import SystemStatus from "@/pages/SystemStatus";
import "./App.css";
import { ErrorBoundary } from "react-error-boundary";
import GAListener from "@/components/GAListener";
import DailySummary from "./pages/DailySummary";
import Lottery from "./pages/Lottery";

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (updated from cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(error) => {
            console.error('Application Error:', error);
          }}
        >
          <GAListener />
          <Switch>
            {navItems.map(({ to, page }) => (
              <Route key={to} path={to} component={page} />
            ))}
            <Route path="/local" component={Local} />
            <Route path="/politics" component={Politics} />
            <Route path="/crime" component={Crime} />
            <Route path="/sports" component={Sports} />
            <Route path="/entertainment" component={Entertainment} />
            <Route path="/contact" component={Contact} />
            <Route path="/news" component={AllNews} />
            <Route path="/all-news" component={AllNews} />
            <Route path="/news/:id" component={NewsDetail} />
            <Route path="/category/:category" component={CategoryNews} />
            <Route path="/donate" component={Donate} />
            <Route path="/search" component={Search} />
            <Route path="/test-systems" component={TestSystems} />
            <Route path="/system-status" component={SystemStatus} />
            <Route path="/login" component={Login} />
            <Route path="/admin" component={Admin} />
            <Route path="/daily-summary" component={DailySummary} />
            <Route path="/lottery" component={Lottery} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;