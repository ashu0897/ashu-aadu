import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { BottomNav } from '../components/BottomNav';
import { DonutChart } from '../components/DonutChart';
import { getEvents, getExpenses, getPeople, createExpense, deleteExpense, createPerson } from '../lib/api';
import { setStoredWeddingId, formatCurrency, calculatePercentage } from '../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

export default function BudgetPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [newExpense, setNewExpense] = useState({
        name: '',
        amount: '',
        paid_by: '',
        comment: '',
    });
    const [newPersonName, setNewPersonName] = useState('');
    const [currentWeddingId, setCurrentWeddingId] = useState(null);

    const loadData = useCallback(async () => {
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

            const [eventsData, expensesData, peopleData] = await Promise.all([
                getEvents(weddingId),
                getExpenses(weddingId),
                getPeople(weddingId),
            ]);

            setEvents(eventsData);
            setExpenses(expensesData);
            setPeople(peopleData);
        } catch (error) {
            console.error('Error loading budget data:', error);
            toast.error('Failed to load budget data');
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
        };
    };

    const handleAddExpense = async () => {
        if (!newExpense.name || !newExpense.amount || !newExpense.paid_by || !selectedEvent) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            await createExpense({
                ...newExpense,
                amount: parseFloat(newExpense.amount),
                event_id: selectedEvent,
                wedding_id: currentWeddingId,
            });

            setShowExpenseModal(false);
            setNewExpense({ name: '', amount: '', paid_by: '', comment: '' });
            setSelectedEvent(null);
            loadData();
            toast.success('Expense added successfully!');
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Failed to add expense');
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        try {
            await deleteExpense(expenseId);
            loadData();
            toast.success('Expense deleted');
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense');
        }
    };

    const handleAddPerson = async () => {
        if (!newPersonName.trim()) return;

        try {
            await createPerson({ name: newPersonName.trim(), wedding_id: currentWeddingId });
            setNewPersonName('');
            loadData();
            toast.success('Person added!');
        } catch (error) {
            console.error('Error adding person:', error);
            toast.error('Failed to add person');
        }
    };

    const openExpenseModal = (eventId) => {
        setSelectedEvent(eventId);
        setShowExpenseModal(true);
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
        <div className="app-container min-h-screen" data-testid="budget-page">
            {/* Header */}
            <div className="page-header">
                <h1 className="font-serif text-2xl font-bold">Budget Overview</h1>
                <p className="text-white/80 text-sm mt-1">Track your wedding expenses</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 content-area">
                {/* Expenses by Event - FIRST */}
                <div className="budget-card" data-testid="expenses-list-card">
                    <h2 className="section-title">Expenses by Event</h2>
                    <div className="space-y-3">
                        {events.map((event) => {
                            const eventExpenses = getEventExpenses(event.id);
                            return (
                                <Collapsible 
                                    key={event.id}
                                    open={expandedEvent === event.id}
                                    onOpenChange={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                >
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between p-3 bg-[#FEF9E7] rounded-xl hover:bg-[#F3E5AB]/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span 
                                                    className="event-badge"
                                                    style={{
                                                        backgroundColor: event.color || '#78716C',
                                                        color: 'white',
                                                    }}
                                                >
                                                    {event.name}
                                                </span>
                                                <span className="text-sm text-stone-500">
                                                    ({eventExpenses.length} expenses)
                                                </span>
                                            </div>
                                            {expandedEvent === event.id ? (
                                                <ChevronUp size={18} className="text-stone-400" />
                                            ) : (
                                                <ChevronDown size={18} className="text-stone-400" />
                                            )}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="pt-2 space-y-2">
                                            {eventExpenses.length === 0 ? (
                                                <p className="text-center text-stone-400 py-4 text-sm">
                                                    No expenses yet
                                                </p>
                                            ) : (
                                                eventExpenses.map((expense) => (
                                                    <div key={expense.id} className="expense-item" data-testid={`expense-${expense.id}`}>
                                                        <div>
                                                            <p className="font-medium text-stone-800">{expense.name}</p>
                                                            <p className="text-lg font-semibold text-[#800000]">
                                                                {formatCurrency(expense.amount)}
                                                            </p>
                                                            {expense.comment && (
                                                                <p className="text-xs text-stone-500 mt-1">{expense.comment}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="person-chip text-xs">{expense.paid_by}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:bg-red-50"
                                                                onClick={() => handleDeleteExpense(expense.id)}
                                                                data-testid={`delete-expense-${expense.id}`}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full rounded-xl border-dashed border-[#D4AF37] text-[#800000] hover:bg-[#F3E5AB]/30"
                                                onClick={() => openExpenseModal(event.id)}
                                                data-testid={`add-expense-${event.id}`}
                                            >
                                                <Plus size={16} className="mr-2" />
                                                Add Expense
                                            </Button>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            );
                        })}
                    </div>
                </div>

                {/* Total Overview - SECOND */}
                <div className="budget-card" data-testid="total-budget-card">
                    <h2 className="section-title">Budget Summary</h2>
                    <div className="flex items-center gap-6">
                        <DonutChart 
                            percentage={calculatePercentage(totalSpent, totalBudget)} 
                            size={100} 
                            strokeWidth={8}
                            color={calculatePercentage(totalSpent, totalBudget) > 90 ? '#DC2626' : '#D4AF37'}
                        />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-stone-500">Total Budget</span>
                                <span className="font-semibold">{formatCurrency(totalBudget)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-stone-500">Spent</span>
                                <span className="font-semibold text-[#800000]">{formatCurrency(totalSpent)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-stone-500">Remaining</span>
                                <span className="font-semibold text-green-600">{formatCurrency(totalBudget - totalSpent)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Budget Cards Grid - THIRD */}
                <div className="budget-card" data-testid="events-grid-card">
                    <h2 className="section-title">Event-wise Budget</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {events.map((event) => {
                            const stats = getEventStats(event.id);
                            return (
                                <div 
                                    key={event.id}
                                    className="event-budget-card cursor-pointer"
                                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                    data-testid={`event-budget-${event.id}`}
                                >
                                    <DonutChart 
                                        percentage={stats.percentage} 
                                        size={70} 
                                        strokeWidth={5}
                                        color={event.color || '#D4AF37'}
                                    />
                                    <p className="font-semibold text-stone-800 mt-2 text-sm">{event.name}</p>
                                    <p className="text-xs text-stone-500">
                                        {formatCurrency(stats.spent)} / {formatCurrency(stats.budget)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* FAB */}
            <button 
                className="fab"
                onClick={() => setShowExpenseModal(true)}
                data-testid="add-expense-fab"
            >
                <Plus size={24} />
            </button>

            {/* Add Expense Modal */}
            <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
                <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto" data-testid="expense-modal">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Add Expense</DialogTitle>
                        <DialogDescription>Record a new wedding expense</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {/* Event Selection */}
                        <div className="space-y-2">
                            <Label>Event</Label>
                            <div className="flex flex-wrap gap-2">
                                {events.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        className={`chip ${selectedEvent === event.id ? 'chip-active' : 'chip-inactive'}`}
                                        onClick={() => setSelectedEvent(event.id)}
                                        data-testid={`select-event-${event.id}`}
                                    >
                                        {event.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expense Name */}
                        <div className="space-y-2">
                            <Label htmlFor="expense-name">Expense Name</Label>
                            <Input
                                id="expense-name"
                                placeholder="e.g., Decoration"
                                value={newExpense.name}
                                onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                                className="rounded-xl border-[#E5D08C]"
                                data-testid="expense-name-input"
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="expense-amount">Amount (Rs.)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                                    <IndianRupee size={16} />
                                </span>
                                <Input
                                    id="expense-amount"
                                    type="number"
                                    placeholder="50000"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                    className="pl-9 rounded-xl border-[#E5D08C]"
                                    data-testid="expense-amount-input"
                                />
                            </div>
                        </div>

                        {/* Paid By */}
                        <div className="space-y-2">
                            <Label>Paid By</Label>
                            <div className="flex flex-wrap gap-2">
                                {people.map((person) => (
                                    <button
                                        key={person.id}
                                        type="button"
                                        className={`chip ${newExpense.paid_by === person.name ? 'chip-active' : 'chip-inactive'}`}
                                        onClick={() => setNewExpense({...newExpense, paid_by: person.name})}
                                        data-testid={`select-person-${person.id}`}
                                    >
                                        {person.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Add new person"
                                    value={newPersonName}
                                    onChange={(e) => setNewPersonName(e.target.value)}
                                    className="rounded-xl border-[#E5D08C] text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())}
                                    data-testid="new-person-input"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-[#D4AF37] text-[#800000]"
                                    onClick={handleAddPerson}
                                    data-testid="add-person-btn"
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <Label htmlFor="expense-comment">Comment (Optional)</Label>
                            <Textarea
                                id="expense-comment"
                                placeholder="Add any notes..."
                                value={newExpense.comment}
                                onChange={(e) => setNewExpense({...newExpense, comment: e.target.value})}
                                className="rounded-xl border-[#E5D08C] resize-none"
                                rows={2}
                                data-testid="expense-comment-input"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            onClick={handleAddExpense}
                            className="w-full bg-[#800000] hover:bg-[#600000] text-white rounded-full py-6"
                            data-testid="submit-expense-btn"
                        >
                            Add Expense
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <BottomNav />
        </div>
    );
}
