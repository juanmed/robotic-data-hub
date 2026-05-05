import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import KeysPage from "@/pages/KeysPage";
import SettingsPage from "@/pages/SettingsPage";
import SessionDetailPage from "@/pages/SessionDetailPage";
import SessionViewerPage from "@/pages/SessionViewerPage";
import MarketplacePage from "@/pages/MarketplacePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import DatasetDetailPage from "@/pages/DatasetDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import SearchPage from "@/pages/SearchPage";
import ListingPage from "@/pages/ListingPage";
import ChallengeEditorPage from "@/pages/ChallengeEditorPage";
import ChallengeDetailPage from "@/pages/ChallengeDetailPage";
import ChallengeLayout from "@/pages/ChallengeLayout";
import OverviewTab from "@/pages/challenge-tabs/OverviewTab";
import RulesTab from "@/pages/challenge-tabs/RulesTab";
import SubmissionsTab from "@/pages/challenge-tabs/SubmissionsTab";
import DiscussionTab from "@/pages/challenge-tabs/DiscussionTab";
import LeaderboardTab from "@/pages/challenge-tabs/LeaderboardTab";
import { BlogListPage } from "@/pages/blog/BlogListPage";
import { BlogPostPage } from "@/pages/blog/BlogPostPage";
import { BlogPostPreview } from "@/pages/blog/BlogPostPreview";
import { AdminBlogListPage } from "@/pages/blog/AdminBlogListPage";
import { BlogEditorPage } from "@/pages/blog/BlogEditorPage";
import NotFound from "@/pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/*" element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/datasets/:id" element={<ProtectedRoute><DatasetDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/challenges/new" element={<ProtectedRoute><ChallengeEditorPage /></ProtectedRoute>} />
            <Route path="/dashboard/challenges/:id/edit" element={<ProtectedRoute><ChallengeEditorPage /></ProtectedRoute>} />
            <Route path="/dashboard/challenges/:id" element={<ProtectedRoute><ChallengeLayout /></ProtectedRoute>}>
              <Route index element={<Navigate replace to="overview" />} />
              <Route path="overview" element={<OverviewTab />} />
              <Route path="rules" element={<RulesTab />} />
              <Route path="submissions" element={<SubmissionsTab />} />
              <Route path="discussion" element={<DiscussionTab />} />
              <Route path="leaderboard" element={<LeaderboardTab />} />
            </Route>
            <Route path="/keys" element={<ProtectedRoute><KeysPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
            <Route path="/sessions/:id/viewer" element={<ProtectedRoute><SessionViewerPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/challenges/:id" element={<ChallengeLayout />}>
              <Route index element={<Navigate replace to="overview" />} />
              <Route path="overview" element={<OverviewTab />} />
              <Route path="rules" element={<RulesTab />} />
              <Route path="submissions" element={<SubmissionsTab />} />
              <Route path="discussion" element={<DiscussionTab />} />
              <Route path="leaderboard" element={<LeaderboardTab />} />
            </Route>
            <Route path="/marketplace/:id" element={<ListingPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/dashboard/blog" element={<ProtectedRoute><AdminBlogListPage /></ProtectedRoute>} />
            <Route path="/dashboard/blog/new" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
            <Route path="/dashboard/blog/:id/edit" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
            <Route path="/dashboard/blog/:id/preview" element={<ProtectedRoute><BlogPostPreview /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
