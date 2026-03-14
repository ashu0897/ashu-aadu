import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, ListTodo, CalendarDays } from 'lucide-react';

export const BottomNav = () => {
    return (
        <nav className="bottom-nav" data-testid="bottom-nav">
            <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                data-testid="nav-dashboard"
            >
                <Home size={22} />
                <span className="text-xs mt-1">Home</span>
            </NavLink>
            <NavLink 
                to="/budget" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                data-testid="nav-budget"
            >
                <Wallet size={22} />
                <span className="text-xs mt-1">Budget</span>
            </NavLink>
            <NavLink 
                to="/events" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                data-testid="nav-events"
            >
                <CalendarDays size={22} />
                <span className="text-xs mt-1">Events</span>
            </NavLink>
            <NavLink 
                to="/tasks" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                data-testid="nav-tasks"
            >
                <ListTodo size={22} />
                <span className="text-xs mt-1">Tasks</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
