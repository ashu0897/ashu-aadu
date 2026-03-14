import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Format currency in INR
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format date
export function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

// Format short date
export function formatShortDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}

// Calculate days remaining
export function getDaysRemaining(dateString) {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Get due status for tasks
export function getDueStatus(dueDate) {
    const days = getDaysRemaining(dueDate);
    
    if (days < 0) return { status: 'overdue', label: 'Overdue', days: Math.abs(days) };
    if (days === 0) return { status: 'today', label: 'Due Today', days: 0 };
    if (days === 1) return { status: 'tomorrow', label: 'Due Tomorrow', days: 1 };
    if (days <= 3) return { status: 'soon', label: `Due in ${days} days`, days };
    return { status: 'upcoming', label: `Due in ${days} days`, days };
}

// Event colors
export const eventColors = {
    'Mehendi': { bg: '#059669', text: '#FFFFFF' },
    'Haldi': { bg: '#D97706', text: '#FFFFFF' },
    'Sangeet': { bg: '#E879A0', text: '#1C1917' },
    'Wedding Ceremony': { bg: '#800000', text: '#FFFFFF' },
    'Reception': { bg: '#D4AF37', text: '#1C1917' },
    'Varmala': { bg: '#8B5CF6', text: '#FFFFFF' },
    'Mayara': { bg: '#6366F1', text: '#FFFFFF' },
    'default': { bg: '#78716C', text: '#FFFFFF' },
};

export function getEventColor(eventName) {
    return eventColors[eventName] || eventColors['default'];
}

// Calculate percentage
export function calculatePercentage(spent, budget) {
    if (budget <= 0) return 0;
    return Math.min(Math.round((spent / budget) * 100), 100);
}

// Local storage helpers
const WEDDING_ID_KEY = 'shaadi_planner_wedding_id';

export function getStoredWeddingId() {
    return localStorage.getItem(WEDDING_ID_KEY);
}

export function setStoredWeddingId(id) {
    localStorage.setItem(WEDDING_ID_KEY, id);
}

export function clearStoredWeddingId() {
    localStorage.removeItem(WEDDING_ID_KEY);
}
