import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { navItems } from "./nav-items";
import { ErrorBoundary } from "react-error-boundary";
import GAListener from "@/components/GAListener";
import { HelmetProvider } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import "./App.css";

// Lazy load all page components
const Local = lazy(() => import("./pages/Local"));
const Politics = lazy(() => import("./pages/Politics"));
const Crime = lazy(() => import("./pages/Crime"));
const Sports = lazy(() => import("./pages/Sports"));
const Entertainment = lazy(() => import("./pages/Entertainment"));
const Contact = lazy(() => import("./pages/Contact"));
const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const AllNews = lazy(() => import("./pages/AllNews"));
const CategoryNews = lazy(() => import("./pages/CategoryNews"));
const Donate = lazy(() => import("./pages/Donate"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Search = lazy(() => import("./pages/Search"));
const TestSystems = lazy(() => import("./pages/TestSystems"));
const Login = lazy(() => import("./pages/Login"));
const DisasterAlert = lazy(() => import("@/pages/DisasterAlert"));
const SystemStatus = lazy(() => import("@/pages/SystemStatus"));
const DailySummary = lazy(() => import("./pages/DailySummary"));
const Lottery = lazy(() => import("./pages/Lottery"));
const Fortune = lazy(() => import("./pages/Fortune"));

// Loading component for Suspense
const PageLoading = () => (
  <div className="flex flex-col space-y-3 p-4">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-[300px] w-full" />
  </div>
);

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
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 3, // 3 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retryOnMount: false,
      // Remove keepPreviousData as it's not a valid option
    },
  },
});

// Wrapper component for routes to add Suspense
const RouteWithSuspense = ({ component: Component, ...rest }: { component: React.ComponentType }) => (
  <Suspense fallback={<PageLoading />}>
    <Component {...rest} />
  </Suspense>
);

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error(error)}>
          <TooltipProvider>
            <GAListener>
              <Router>
                <Switch>
                  <Route path="/" component={() => <RouteWithSuspense component={Index} />} />
                  <Route path="/local" component={() => <RouteWithSuspense component={Local} />} />
                  <Route path="/politics" component={() => <RouteWithSuspense component={Politics} />} />
                  <Route path="/crime" component={() => <RouteWithSuspense component={Crime} />} />
                  <Route path="/sports" component={() => <RouteWithSuspense component={Sports} />} />
                  <Route path="/entertainment" component={() => <RouteWithSuspense component={Entertainment} />} />
                  <Route path="/contact" component={() => <RouteWithSuspense component={Contact} />} />
                  <Route path="/admin" component={() => <RouteWithSuspense component={Admin} />} />
                  <Route path="/news/:id" component={(params: any) => <RouteWithSuspense component={NewsDetail} {...params} />} />
                  <Route path="/all-news" component={() => <RouteWithSuspense component={AllNews} />} />
                  <Route path="/category/:category" component={(params: any) => <RouteWithSuspense component={CategoryNews} {...params} />} />
                  <Route path="/donate" component={() => <RouteWithSuspense component={Donate} />} />
                  <Route path="/search" component={() => <RouteWithSuspense component={Search} />} />
                  <Route path="/test-systems" component={() => <RouteWithSuspense component={TestSystems} />} />
                  <Route path="/login" component={() => <RouteWithSuspense component={Login} />} />
                  <Route path="/disaster-alert" component={() => <RouteWithSuspense component={DisasterAlert} />} />
                  <Route path="/system-status" component={() => <RouteWithSuspense component={SystemStatus} />} />
                  <Route path="/daily-summary" component={() => <RouteWithSuspense component={DailySummary} />} />
                  <Route path="/lottery" component={() => <RouteWithSuspense component={Lottery} />} />
                  <Route path="/fortune" component={() => <RouteWithSuspense component={Fortune} />} />
                  <Route component={() => <RouteWithSuspense component={NotFound} />} />
                </Switch>
              </Router>
              <Toaster />
              <Sonner position="top-right" />
            </GAListener>
          </TooltipProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;