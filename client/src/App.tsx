import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Switch>
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} component={() => page} />
          ))}
          <Route path="/local" component={Local} />
          <Route path="/politics" component={Politics} />
          <Route path="/crime" component={Crime} />
          <Route path="/sports" component={Sports} />
          <Route path="/entertainment" component={Entertainment} />
          <Route path="/contact" component={Contact} />
          <Route path="/news" component={AllNews} />
          <Route path="/news/:id" component={NewsDetail} />
          <Route path="/category/:category" component={CategoryNews} />
          <Route path="/donate" component={Donate} />
          <Route path="/search" component={Search} />
          <Route path="/test-systems" component={TestSystems} />
          <Route path="/admin" component={Admin} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route component={NotFound} />
        </Switch>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;