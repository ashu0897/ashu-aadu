import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, IndianRupee, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { BottomNav } from '../components/BottomNav';
import { DonutChart } from '../components/DonutChart';
import { getEvents, getExpenses, createEvent, deleteEvent, updateEvent } from '../lib/api';
import { setStoredWeddingId, formatCurrency, calculatePercentage } from '../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

// Available colors for events
const EVENT_COLORS = [
    '#059669', '#D97706', '#E879A0', '#800000', '#D4AF37', 
    '#8B5CF6', '#6366F1', '#0891B2', '#DC2626', '#16A34A'
];

export default function EventsPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventForm, setEventForm] = useState({
        name: '',
        budget: '',
        color: EVENT_COLORS[0],
    });
    const [currentWeddingId, setCurrentWeddingId] = useState(null);

    const loadData = useCallback(async () => {
        // Check auth first
        const isAuth = localStorage.getItem('shaadi_authenticated');
        if (isAuth !== 'true') {
            navigate('/');
            return;
        }

        try {
            const weddings = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/weddings`);
            const currentWedding = weddings.data.find(w => w.title === 'Ashu & Aadu');
            
            if (!currentWedding) {
                navigate('/');
                return;
            }

            const weddingId = currentWedding.id;
            setCurrentWeddingId(weddingId);
            setStoredWeddingId(weddingId);

            const [eventsData, expensesData] = await Promise.all([
                getEvents(weddingId),
                getExpenses(weddingId),
            ]);

            setEvents(eventsData);
            setExpenses(expensesData);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getEventExpenses = (eventId) => {
        return expenses.filter(e => e.event_id === eventId);
    };

    const getEventStats = (eventId) => {
        const event = events.find(e => e.id === eventId);
        const eventExpenses = getEventExpenses(eventId);
        const spent = eventExpenses.reduce((sum, e) => sum + e.amount, 0);
        const budget = event?.budget || 0;
        return {
            budget,
            spent,
            remaining: budget - spent,
            percentage: calculatePercentage(spent, budget),
            expenseCount: eventExpenses.length,
        };
    };

    const resetForm = () => {
        setEventForm({
            name: '',
            budget: '',
            color: EVENT_COLORS[0],
        });
        setEditingEvent(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowEventModal(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setEventForm({
            name: event.name,
            budget: event.budget.toString(),
            color: event.color || EVENT_COLORS[0],
        });
        setShowEventModal(true);
    };

    const handleSubmitEvent = async () => {
        if (!eventForm.name || !eventForm.budget) {
            toast.error('Please enter event name and budget');
            return;
        }

        try {
            if (editingEvent) {
                await updateEvent(editingEvent.id, {
                    name: eventForm.name,
                    budget: parseFloat(eventForm.budget),
                    color: eventForm.color,
                });
                toast.success('Event updated!');
            } else {
                await createEvent({
                    name: eventForm.name,
                    budget: parseFloat(eventForm.budget),
                    color: eventForm.color,
                    wedding_id: currentWeddingId,
                });
                toast.success('Event added!');
            }
            setShowEventModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Failed to save event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        const eventExpenses = getEventExpenses(eventId);
        if (eventExpenses.length > 0) {
            toast.error('Cannot delete event with expenses. Delete expenses first in Budget section.');
            return;
        }

        try {
            await deleteEvent(eventId);
            loadData();
            toast.success('Event deleted');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
        }
    };

    const totalBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    if (loading) {
        return (
            <div className="app-container min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="app-container min-h-screen" data-testid="events-page">
            {/* Header */}
            <div className="page-header">
                <h1 className="font-serif text-2xl font-bold">Wedding Events</h1>
                <p className="text-white/80 text-sm mt-1">Manage your wedding ceremonies</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 content-area">
                {/* Total Overview */}
                <div className="budget-card" data-testid="total-overview">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-stone-500">Total Events</p>
                            <p className="text-3xl font-bold text-[#800000]">{events.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-stone-500">Total Budget</p>
                            <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(totalBudget)}</p>
                        </div>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2">
                        <div 
                            className="bg-[#D4AF37] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${calculatePercentage(totalSpent, totalBudget)}%` }}
                        />
                    </div>
                    <p className="text-center text-sm text-stone-500 mt-2">
                        {formatCurrency(totalSpent)} spent of {formatCurrency(totalBudget)}
                    </p>
                </div>

                {/* Events List */}
                <div className="space-y-3">
                    {events.map((event) => {
                        const stats = getEventStats(event.id);
                        return (
                            <div 
                                key={event.id}
                                className="budget-card"
                                data-testid={`event-${event.id}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Donut Chart */}
                                    <DonutChart 
                                        percentage={stats.percentage} 
                                        size={80} 
                                        strokeWidth={6}
                                        color={event.color || '#D4AF37'}
                                    />
                                    
                                    {/* Event Details */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: event.color || '#78716C' }}
                                            />
                                            <h3 className="font-semibold text-stone-800">{event.name}</h3>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><span className="text-stone-500">Budget:</span> <span className="font-semibold">{formatCurrency(stats.budget)}</span></p>
                                            <p><span className="text-stone-500">Spent:</span> <span className="text-[#800000]">{formatCurrency(stats.spent)}</span></p>
                                            <p><span className="text-stone-500">Remaining:</span> <span className="text-green-600">{formatCurrency(stats.remaining)}</span></p>
                                            <p className="text-xs text-stone-400">{stats.expenseCount} expenses</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                            onClick={() => openEditModal(event)}
                                            data-testid={`edit-event-${event.id}`}
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => handleDeleteEvent(event.id)}
                                            data-testid={`delete-event-${event.id}`}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {events.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-stone-400 mb-4">No events added yet</p>
                        <Button
                            onClick={openAddModal}
                            className="bg-[#800000] hover:bg-[#600000] text-white rounded-full"
                        >
                            <Plus size={18} className="mr-2" />
                            Add First Event
                        </Button>
                    </div>
                )}
            </div>

            {/* FAB */}
            <button 
                className="fab"
                onClick={openAddModal}
                data-testid="add-event-fab"
            >
                <Plus size={24} />
            </button>

            {/* Add/Edit Event Modal */}
            <Dialog open={showEventModal} onOpenChange={(open) => {
                setShowEventModal(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-md mx-4 rounded-2xl" data-testid="event-modal">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {editingEvent ? 'Edit Event' : 'Add New Event'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingEvent ? 'Update event details' : 'Create a new wedding event'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {/* Event Name */}
                        <div className="space-y-2">
                            <Label htmlFor="event-name">Event Name</Label>
                            <Input
                                id="event-name"
                                placeholder="e.g., Engagement, Phera"
                                value={eventForm.name}
                                onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                                className="rounded-xl border-[#E5D08C]"
                                data-testid="event-name-input"
                            />
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="event-budget">Budget (Rs.)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                                    <IndianRupee size={16} />
                                </span>
                                <Input
                                    id="event-budget"
                                    type="number"
                                    placeholder="500000"
                                    value={eventForm.budget}
                                    onChange={(e) => setEventForm({...eventForm, budget: e.target.value})}
                                    className="pl-9 rounded-xl border-[#E5D08C]"
                                    data-testid="event-budget-input"
                                />
                            </div>
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {EVENT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${eventForm.color === color ? 'border-stone-800 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setEventForm({...eventForm, color})}
                                        data-testid={`color-${color}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            onClick={handleSubmitEvent}
                            className="w-full bg-[#800000] hover:bg-[#600000] text-white rounded-full py-6"
                            data-testid="submit-event-btn"
                        >
                            {editingEvent ? 'Update Event' : 'Add Event'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <BottomNav />
        </div>
    );
}
