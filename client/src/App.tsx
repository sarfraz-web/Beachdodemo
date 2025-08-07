import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Admin from "./pages/admin";
import Products from "./pages/products";
import ProductDetail from "./pages/product-detail";
import Chat from "./pages/chat";
import NotFound from "@/pages/not-found";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import AuthModal from "./components/auth/auth-modal";
import { useState } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Remove the loading spinner entirely - show content immediately
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="min-h-screen">
        <Switch>
          <Route path="/" component={isAuthenticated ? Home : Landing} />
          <Route path="/products" component={Products} />
          <Route path="/products/:id" component={ProductDetail} />
          {isAuthenticated && (
            <>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/chat" component={Chat} />
              <Route path="/admin" component={Admin} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      {/* Global auth modal trigger */}
      <div id="auth-modal-trigger" onClick={() => setAuthModalOpen(true)} style={{display: 'none'}}></div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
