// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  useEffect(() => {
    const handleOffline = () => {
      toast.warning("No internet connection. Please reconnect.");
    };
    const handleOnline = () => {
      toast.info("Back online. Refreshing data...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        richColors // enables colorful toasts (blue for success, red for error)
        closeButton // shows X button
        toastOptions={{
          style: {
            fontFamily: "Poppins, sans-serif",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: {
            style: {
              background: "#10b981", // green success
              color: "white",
            },
          },
          error: {
            style: {
              background: "#ef4444", // red error
              color: "white",
            },
          },
          loading: {
            style: {
              background: "#3b82f6", // blue loading
              color: "white",
            },
          },
        }}
      />
      <Routes>
        {/* Main authenticated/home route */}
        <Route path="/" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
        </Route>

        {/* Catch-all route for 404 */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center bg-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">404</h1>
                <p className="mt-4 text-xl text-gray-600">Page not found</p>
                <a
                  href="/home"
                  className="mt-6 inline-block text-blue-600 hover:underline"
                >
                  Go back to home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
