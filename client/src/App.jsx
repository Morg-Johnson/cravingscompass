import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppShell from './components/AppShell.jsx'
import HomePage from './pages/HomePage.jsx'
import SearchResultsPage from './pages/SearchResultsPage.jsx'
import DealDetailsPage from './pages/DealDetailsPage.jsx'
import DealComparisonPage from './pages/DealComparisonPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import SavedDealsPage from './pages/SavedDealsPage.jsx'
import FavoriteRestaurantsPage from './pages/FavoriteRestaurantsPage.jsx'
import NotificationPreferencesPage from './pages/NotificationPreferencesPage.jsx'
import RewardsTrackingPage from './pages/RewardsTrackingPage.jsx'
import RouteBasedDealsPage from './pages/RouteBasedDealsPage.jsx'
import RequireAuth from './auth/RequireAuth.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/deals/:dealId" element={<DealDetailsPage />} />
        <Route path="/compare" element={<DealComparisonPage />} />
        <Route path="/account" element={<AccountPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/saved-deals" element={<SavedDealsPage />} />
          <Route path="/favorites" element={<FavoriteRestaurantsPage />} />
          <Route path="/notifications" element={<NotificationPreferencesPage />} />
          <Route path="/rewards" element={<RewardsTrackingPage />} />
        </Route>

        <Route path="/route-deals" element={<RouteBasedDealsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
