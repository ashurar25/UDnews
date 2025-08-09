import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import RSSFeed from "./components/RSSFeed";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={page} />
          ))}
          <Route path="/local" element={<Local />} />
          <Route path="/politics" element={<Politics />} />
          <Route path="/crime" element={<Crime />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/entertainment" element={<Entertainment />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news" element={<AllNews />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/category/:category" element={<CategoryNews />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;