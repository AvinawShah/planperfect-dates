import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Welcome from "./pages/Welcome.tsx";
import Plan from "./pages/Plan.tsx";
import Events from "./pages/Events.tsx";
import Deals from "./pages/Deals.tsx";
import Saved from "./pages/Saved.tsx";
import Journey from "./pages/Journey.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/events" element={<Events />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/login" element={<Login />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
