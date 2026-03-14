import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import PasswordPage from "./pages/PasswordPage";
import DashboardPage from "./pages/DashboardPage";
import BudgetPage from "./pages/BudgetPage";
import EventsPage from "./pages/EventsPage";
import TasksPage from "./pages/TasksPage";

// Protected Route wrapper - checks authentication
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('shaadi_authenticated') === 'true';
    
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
};

// Auth check for password page - redirect to dashboard if already authenticated
const AuthRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('shaadi_authenticated') === 'true';
    
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
    return (
        <div className="App bg-[#FDFBF7] min-h-screen">
            <BrowserRouter>
                <Routes>
                    {/* Password entry page */}
                    <Route 
                        path="/" 
                        element={
                            <AuthRoute>
                                <PasswordPage />
                            </AuthRoute>
                        } 
                    />
                    
                    {/* Protected routes */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/budget" 
                        element={
                            <ProtectedRoute>
                                <BudgetPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/events" 
                        element={
                            <ProtectedRoute>
                                <EventsPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/tasks" 
                        element={
                            <ProtectedRoute>
                                <TasksPage />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Catch all - redirect to password page */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster position="top-center" richColors />
        </div>
    );
}

export default App;
