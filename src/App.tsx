import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrmProvider } from "@/contexts/CrmContext";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import SalesPage from "./pages/SalesPage";
import LostSalesPage from "./pages/LostSalesPage";
import ProductsPage from "./pages/ProductsPage";
import FinancePage from "./pages/FinancePage";
import ProductionPage from "./pages/ProductionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CrmProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/vendas" element={<SalesPage />} />
              <Route path="/vendas-perdidas" element={<LostSalesPage />} />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/financeiro" element={<FinancePage />} />
              <Route path="/producao" element={<ProductionPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </CrmProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
