import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, User, Trash2, AlertTriangle, CheckCircle2, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { BottomNav } from '../components/BottomNav';
import { getTasks, getEvents, getPeople, createTask, updateTaskStatus, deleteTask, createPerson } from '../lib/api';
import { getStoredWeddingId, formatShortDate, getDueStatus } from '../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TasksPage() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [viewMode, setViewMode] = useState('overall');
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [taskForm, setTaskForm] = useState({
        description: '',
        event_id: '',
        assigned_to: '',
        due_date: null,
        notes: '',
    });
    const [newPersonName, setNewPersonName] = useState('');
    const [currentWeddingId, setCurrentWeddingId] = useState(null);

    const loadData = useCallback(async () => {
        // Check auth first
        const isAuth = localStorage.getItem('shaadi_authenticated');
        if (isAuth !== 'true') {
            navigate('/');
            return;
        }

        // Get wedding ID from cloud
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/weddings`);
            const currentWedding = response.data.find(w => w.title === 'Ashu & Aadu');
            
            if (!currentWedding) {
                navigate('/');
                return;
            }

            const weddingId = currentWedding.id;
            setCurrentWeddingId(weddingId);

            const [tasksData, eventsData, peopleData] = await Promise.all([
                getTasks(weddingId),
                getEvents(weddingId),
                getPeople(weddingId),
            ]);

            setTasks(tasksData);
            setEvents(eventsData);
            setPeople(peopleData);
        } catch (error) {
            console.error('Error loading tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const resetForm = () => {
        setTaskForm({
            description: '',
            event_id: '',
            assigned_to: '',
            due_date: null,
            notes: '',
        });
        setEditingTask(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowTaskModal(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setTaskForm({
            description: task.description,
            event_id: task.event_id,
            assigned_to: task.assigned_to,
            due_date: new Date(task.due_date),
            notes: task.notes || '',
        });
        setShowTaskModal(true);
    };

    const handleSubmitTask = async () => {
        if (!taskForm.description || !taskForm.event_id || !taskForm.assigned_to || !taskForm.due_date) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            if (editingTask) {
                // Update existing task
                await axios.put(`${API}/tasks/${editingTask.id}/full`, {
                    description: taskForm.description,
                    event_id: taskForm.event_id,
                    assigned_to: taskForm.assigned_to,
                    due_date: taskForm.due_date.toISOString(),
                    notes: taskForm.notes,
                    status: editingTask.status,
                });
                toast.success('Task updated successfully!');
            } else {
                // Create new task
                await createTask({
                    ...taskForm,
                    due_date: taskForm.due_date.toISOString(),
                    wedding_id: currentWeddingId,
                    status: 'pending',
                });
                toast.success('Task added successfully!');
            }

            setShowTaskModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving task:', error);
            toast.error('Failed to save task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await updateTaskStatus(taskId, newStatus);
            loadData();
            toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTask(taskId);
            loadData();
            toast.success('Task deleted');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to delete task');
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

    const getEventName = (eventId) => {
        const event = events.find(e => e.id === eventId);
        return event ? event.name : 'Unknown';
    };

    const getEventColor = (eventId) => {
        const event = events.find(e => e.id === eventId);
        return event?.color || '#78716C';
    };

    // Filter and group tasks
    const filteredTasks = viewMode === 'person' && selectedPerson
        ? tasks.filter(t => t.assigned_to === selectedPerson)
        : tasks;

    const pendingTasks = filteredTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const doneTasks = filteredTasks.filter(t => t.status === 'done');
    const sortedPendingTasks = [...pendingTasks].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (loading) {
        return (
            <div className="app-container min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="app-container min-h-screen" data-testid="tasks-page">
            {/* Header */}
            <div className="page-header">
                <h1 className="font-serif text-2xl font-bold">To-Do List</h1>
                <p className="text-white/80 text-sm mt-1">Manage wedding tasks</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 content-area">
                {/* View Toggle */}
                <div className="budget-card" data-testid="view-toggle">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm text-stone-500">View By:</span>
                        <div className="flex gap-2">
                            <button
                                className={`chip ${viewMode === 'overall' ? 'chip-active' : 'chip-inactive'}`}
                                onClick={() => {
                                    setViewMode('overall');
                                    setSelectedPerson(null);
                                }}
                                data-testid="view-overall-btn"
                            >
                                Overall
                            </button>
                            <button
                                className={`chip ${viewMode === 'person' ? 'chip-active' : 'chip-inactive'}`}
                                onClick={() => setViewMode('person')}
                                data-testid="view-person-btn"
                            >
                                Person
                            </button>
                        </div>
                    </div>

                    {viewMode === 'person' && (
                        <div className="animate-fade-in">
                            <Label className="text-sm text-stone-500 mb-2 block">Select Person</Label>
                            <div className="flex flex-wrap gap-2">
                                {people.map((person) => (
                                    <button
                                        key={person.id}
                                        className={`chip ${selectedPerson === person.name ? 'chip-active' : 'chip-inactive'}`}
                                        onClick={() => setSelectedPerson(person.name)}
                                        data-testid={`filter-person-${person.id}`}
                                    >
                                        {person.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pending Tasks */}
                <div className="budget-card" data-testid="pending-tasks">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <h2 className="section-title mb-0">Pending</h2>
                        <span className="text-sm text-stone-500">({sortedPendingTasks.length})</span>
                    </div>

                    {sortedPendingTasks.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-stone-400">No pending tasks</p>
                            <Button 
                                variant="link" 
                                className="text-[#800000]"
                                onClick={openAddModal}
                            >
                                Add your first task
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedPendingTasks.map((task) => {
                                const dueStatus = getDueStatus(task.due_date);
                                return (
                                    <div 
                                        key={task.id}
                                        className={`task-card ${dueStatus.status === 'overdue' ? 'overdue' : dueStatus.status === 'today' || dueStatus.status === 'tomorrow' ? 'due-soon' : ''}`}
                                        data-testid={`task-${task.id}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <span 
                                                    className="event-badge mb-2"
                                                    style={{
                                                        backgroundColor: getEventColor(task.event_id),
                                                        color: 'white',
                                                    }}
                                                >
                                                    {getEventName(task.event_id)}
                                                </span>
                                                <p className="font-medium text-stone-800 mt-2">{task.description}</p>
                                                <div className="flex items-center gap-3 mt-2 text-sm text-stone-500">
                                                    <span className="flex items-center gap-1">
                                                        <User size={14} />
                                                        {task.assigned_to}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formatShortDate(task.due_date)}
                                                    </span>
                                                </div>
                                                {task.notes && (
                                                    <p className="text-xs text-stone-400 mt-2 italic">{task.notes}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {dueStatus.status === 'overdue' && (
                                                    <AlertTriangle className="text-red-500" size={18} />
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                                    onClick={() => openEditModal(task)}
                                                    data-testid={`edit-task-${task.id}`}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-200">
                                            <Button
                                                size="sm"
                                                className={`rounded-full text-xs ${task.status === 'in_progress' ? 'bg-[#D4AF37] text-stone-800' : 'bg-[#D4AF37]/30 text-stone-700'}`}
                                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                                data-testid={`task-progress-${task.id}`}
                                            >
                                                In Progress
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="rounded-full text-xs bg-green-600 text-white hover:bg-green-700"
                                                onClick={() => handleStatusChange(task.id, 'done')}
                                                data-testid={`task-done-${task.id}`}
                                            >
                                                Done
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ml-auto text-red-500 hover:bg-red-50"
                                                onClick={() => handleDeleteTask(task.id)}
                                                data-testid={`delete-task-${task.id}`}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Completed Tasks */}
                {doneTasks.length > 0 && (
                    <div className="budget-card" data-testid="completed-tasks">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 size={18} className="text-green-600" />
                            <h2 className="section-title mb-0">Completed</h2>
                            <span className="text-sm text-stone-500">({doneTasks.length})</span>
                        </div>

                        <div className="space-y-2">
                            {doneTasks.map((task) => (
                                <div 
                                    key={task.id}
                                    className="p-3 bg-green-50 rounded-xl border border-green-200 opacity-70"
                                    data-testid={`completed-task-${task.id}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span 
                                                className="event-badge text-xs"
                                                style={{
                                                    backgroundColor: getEventColor(task.event_id),
                                                    color: 'white',
                                                }}
                                            >
                                                {getEventName(task.event_id)}
                                            </span>
                                            <p className="font-medium text-stone-600 mt-1 line-through">{task.description}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => handleDeleteTask(task.id)}
                                            data-testid={`delete-completed-${task.id}`}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* FAB */}
            <button 
                className="fab"
                onClick={openAddModal}
                data-testid="add-task-fab"
            >
                <Plus size={24} />
            </button>

            {/* Add/Edit Task Modal */}
            <Dialog open={showTaskModal} onOpenChange={(open) => {
                setShowTaskModal(open);
                if (!open) resetForm();
            }} modal={true}>
                <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto z-[100]" data-testid="task-modal">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {editingTask ? 'Edit Task' : 'Add New Task'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTask ? 'Update the task details' : 'Fill in the details to create a new task'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {/* Event Selection */}
                        <div className="space-y-2">
                            <Label>Event *</Label>
                            <div className="flex flex-wrap gap-2">
                                {events.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        className={`chip ${taskForm.event_id === event.id ? 'chip-active' : 'chip-inactive'}`}
                                        onClick={() => setTaskForm({...taskForm, event_id: event.id})}
                                        data-testid={`select-event-${event.id}`}
                                    >
                                        {event.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Task Description */}
                        <div className="space-y-2">
                            <Label htmlFor="task-description">Task Name *</Label>
                            <Input
                                id="task-description"
                                placeholder="e.g., Book venue"
                                value={taskForm.description}
                                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                                className="rounded-xl border-[#E5D08C]"
                                data-testid="task-description-input"
                            />
                        </div>

                        {/* Assigned To */}
                        <div className="space-y-2">
                            <Label>Assigned To *</Label>
                            <div className="flex flex-wrap gap-2">
                                {people.map((person) => (
                                    <button
                                        key={person.id}
                                        type="button"
                                        className={`chip ${taskForm.assigned_to === person.name ? 'chip-active' : 'chip-inactive'}`}
                                        onClick={() => setTaskForm({...taskForm, assigned_to: person.name})}
                                        data-testid={`assign-person-${person.id}`}
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
                                    data-testid="new-person-task-input"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-[#D4AF37] text-[#800000]"
                                    onClick={handleAddPerson}
                                    data-testid="add-person-task-btn"
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal rounded-xl border-[#E5D08C]"
                                        data-testid="task-date-picker"
                                    >
                                        <Calendar className="mr-2 h-4 w-4 text-[#D4AF37]" />
                                        {taskForm.due_date ? (
                                            format(taskForm.due_date, "PPP")
                                        ) : (
                                            <span className="text-muted-foreground">Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={4}>
                                    <CalendarComponent
                                        mode="single"
                                        selected={taskForm.due_date}
                                        onSelect={(date) => setTaskForm({...taskForm, due_date: date})}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="task-notes">Notes (Optional)</Label>
                            <Textarea
                                id="task-notes"
                                placeholder="Add any notes..."
                                value={taskForm.notes}
                                onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
                                className="rounded-xl border-[#E5D08C] resize-none"
                                rows={2}
                                data-testid="task-notes-input"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            onClick={handleSubmitTask}
                            className="w-full bg-[#800000] hover:bg-[#600000] text-white rounded-full py-6"
                            data-testid="submit-task-btn"
                        >
                            {editingTask ? 'Update Task' : 'Add Task'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <BottomNav />
        </div>
    );
}
