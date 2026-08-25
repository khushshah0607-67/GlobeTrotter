import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import './App.css'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { BudgetPage } from './pages/BudgetPage'
import { CollaborationPage } from './pages/CollaborationPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ItineraryPage } from './pages/ItineraryPage'
import { TripOverviewPage } from './pages/TripOverviewPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/trip/:tripId"
              element={
                <RequireAuth>
                  <TripOverviewPage />
                </RequireAuth>
              }
            />
            <Route
              path="/trip/:tripId/itinerary"
              element={
                <RequireAuth>
                  <ItineraryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/trip/:tripId/budget"
              element={
                <RequireAuth>
                  <BudgetPage />
                </RequireAuth>
              }
            />
            <Route
              path="/trip/:tripId/collaboration"
              element={
                <RequireAuth>
                  <CollaborationPage />
                </RequireAuth>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
