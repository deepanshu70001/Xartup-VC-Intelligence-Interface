import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import DashboardPage from "../pages/DashboardPage";
import CompaniesPage from "../pages/CompaniesPage";
import CompanyProfilePage from "../pages/CompanyProfilePage";
import ListsPage from "../pages/ListsPage";
import SavedSearchesPage from "../pages/SavedSearchesPage";
import ScoutAssistantPage from "../pages/ScoutAssistantPage";
import SettingsPage from "../pages/SettingsPage";
import UserProfilePage from "../pages/UserProfilePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import LandingPage from "../pages/LandingPage";
import AboutPage from "../pages/AboutPage";
import { ProtectedRoute } from "./ProtectedRoute";

function withProtectedLayout(Page: ComponentType) {
  return (
    <ProtectedRoute>
      <Layout>
        <Page />
      </Layout>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={withProtectedLayout(DashboardPage)} />
      <Route path="/companies" element={withProtectedLayout(CompaniesPage)} />
      <Route path="/companies/:id" element={withProtectedLayout(CompanyProfilePage)} />
      <Route path="/lists" element={withProtectedLayout(ListsPage)} />
      <Route path="/saved" element={withProtectedLayout(SavedSearchesPage)} />
      <Route path="/scout" element={withProtectedLayout(ScoutAssistantPage)} />
      <Route path="/settings" element={withProtectedLayout(SettingsPage)} />
      <Route path="/profile" element={withProtectedLayout(UserProfilePage)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
