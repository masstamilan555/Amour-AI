// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChatAnalyzer from "./pages/ChatAnalyzer";
import BioGenerator from "./pages/BioGenerator";
import DpAnalyzer from "./pages/DpAnalyzer";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { useEffect, useState } from "react";
import axios from "axios";
import RazorpayPaymentPage from "./pages/RazorPayPaymentPage";
import { checkAuth } from "./helper/checkAuth";
// import "./App.css";

const queryClient = new QueryClient();
axios.defaults.withCredentials = true; // global
// axios.defaults.baseURL = "http://localhost:4000";
axios.defaults.baseURL = "https://amour123.vercel.app/";

function App() {
  const [user, setUser] = useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes user={user} setUser={setUser} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRoutes({
  user,
  setUser,
}: {
  user: unknown;
  setUser: React.Dispatch<unknown>;
}) {
  const navigate = useNavigate();

 checkAuth(setUser);

  useEffect(() => {
    checkAuth(setUser);
    // eslint-disable-next-line
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index user={user} setUser={setUser} />} />
      <Route path="/login" element={<Login setUser={setUser}  />} />
      <Route path="/signup" element={<SignUp setUser={setUser} />} />
      <Route path="/buy-credits" element={<RazorpayPaymentPage setUser={setUser} />} />
      <Route path="/tools/chat-analyzer" element={<ChatAnalyzer user={user} />} />
      <Route path="/tools/bio-generator" element={<BioGenerator user={user} />} />
      <Route path="/tools/dp-analyzer" element={<DpAnalyzer user={user} />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
