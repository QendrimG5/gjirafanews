import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminLayout from "./components/admin-layout";
import ProtectedRoute from "./components/protected-route";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import NewArticlePage from "./pages/new-article";
import EditArticlePage from "./pages/edit-article";
import CategoriesPage from "./pages/categories";

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="/articles/new" element={<NewArticlePage />} />
          <Route path="/articles/:id/edit" element={<EditArticlePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
