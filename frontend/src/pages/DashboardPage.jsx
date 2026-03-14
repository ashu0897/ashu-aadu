import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Settings, Camera, ChevronRight, Calendar, User, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { BottomNav } from '../components/BottomNav';
import { DonutChart } from '../components/DonutChart';
import { getWeddings, createWedding, createEvent, createPerson, getWedding, getWeddingStats, getTasks, getEvents } from '../lib/api';
import { setStoredWeddingId, formatCurrency, getDaysRemaining, calculatePercentage, formatShortDate } from '../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hardcoded wedding details for Ashu & Aadu
const WEDDING_CONFIG = {
    title: 'Ashu & Aadu',
    bride_name: 'Ashu',
    groom_name: 'Aadu',
    wedding_date: '2027-02-15T00:00:00.000Z',
    location: 'India',
    venue: 'Harshal Hall',
    muhurta_time: '11:19 AM'
};

const DEFAULT_EVENTS = [
    { name: 'Mehendi', budget: 500000, color: '#059669' },
    { name: 'Haldi', budget: 500000, color: '#D97706' },
    { name: 'Sangeet', budget: 2000000, color: '#E879A0' },
    { name: 'Varmala', budget: 500000, color: '#8B5CF6' },
    { name: 'Mayara', budget: 1500000, color: '#6366F1' },
    { name: 'Wedding Ceremony', budget: 2000000, color: '#800000' },
    { name: 'Reception', budget: 1500000, color: '#D4AF37' },
];

const DEFAULT_COUNTDOWN_IMAGE = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [wedding, setWedding] = useState(null);
    const [weddingId, setWeddingId] = useState(null);
    const [stats, setStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [countdownImage, setCountdownImage] = useState(DEFAULT_COUNTDOWN_IMAGE);
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = useRef(null);

    // Get or create wedding - always fetch from cloud
    const initializeWedding = useCallback(async () => {
        try {
            // Always fetch weddings from cloud
            const weddings = await getWeddings();
            let currentWedding = weddings.find(w => w.title === WEDDING_CONFIG.title);
            
            if (!currentWedding) {
                // Create the wedding for Ashu & Aadu
                currentWedding = await createWedding(WEDDING_CONFIG);
                
                // Create default events
                for (const event of DEFAULT_EVENTS) {
                    await createEvent({
                        ...event,
                        wedding_id: currentWedding.id,
                    });
                }
                
                // Create Ashu and Aadu as people
                await createPerson({ name: 'Ashu', wedding_id: currentWedding.id });
                await createPerson({ name: 'Aadu', wedding_id: currentWedding.id });
            }
            
            setStoredWeddingId(currentWedding.id);
            return currentWedding.id;
        } catch (error) {
            console.error('Error initializing wedding:', error);
            throw error;
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            // Get wedding ID (from cloud)
            const id = await initializeWedding();
            setWeddingId(id);

            // Fetch all data fresh from cloud
            const [weddingData, statsData, tasksData, eventsData] = await Promise.all([
                getWedding(id),
                getWeddingStats(id),
                getTasks(id),
                getEvents(id),
            ]);

            setWedding(weddingData);
            setStats(statsData);
            setTasks(tasksData);
            setEvents(eventsData);
            
            // Load countdown image from cloud
            try {
                const imageRes = await axios.get(`${API}/weddings/${id}/countdown-image`);
                if (imageRes.data.image_url && imageRes.data.image_url !== '') {
                    setCountdownImage(imageRes.data.image_url);
                } else {
                    // No image set yet - show upload prompt
                    setShowImageUpload(true);
                }
            } catch (err) {
                // No image yet, show upload prompt
                setShowImageUpload(true);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [initializeWedding]);

    useEffect(() => {
        // Check authentication
        const isAuth = localStorage.getItem('shaadi_authenticated');
        if (isAuth !== 'true') {
            navigate('/');
            return;
        }
        
        // Load fresh data from cloud
        loadData();
    }, [loadData, navigate]);

    const daysRemaining = wedding ? getDaysRemaining(wedding.wedding_date) : 0;
    
    // Task statistics
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = totalTasks - doneTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    // Get upcoming tasks (not done, sorted by due date)
    const upcomingTasks = tasks
        .filter(t => t.status !== 'done')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

    const getEventName = (eventId) => {
        const event = events.find(e => e.id === eventId);
        return event ? event.name : 'Unknown';
    };

    const getEventColor = (eventId) => {
        const event = events.find(e => e.id === eventId);
        return event?.color || '#78716C';
    };

    const handleLogout = () => {
        localStorage.removeItem('shaadi_authenticated');
        localStorage.removeItem('shaadi_planner_wedding_id');
        navigate('/');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (limit to 500KB for cloud storage)
            if (file.size > 500 * 1024) {
                toast.error('Image too large. Please use an image under 500KB or use a URL instead.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result;
                try {
                    await axios.put(`${API}/weddings/${weddingId}/countdown-image`, {
                        image_url: dataUrl
                    });
                    setCountdownImage(dataUrl);
                    setShowImageUpload(false);
                    toast.success('Image uploaded and saved for everyone!');
                } catch (err) {
                    toast.error('Failed to save image. Try using a URL instead.');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUrl = async () => {
        if (imageUrl) {
            try {
                await axios.put(`${API}/weddings/${weddingId}/countdown-image`, {
                    image_url: imageUrl
                });
                setCountdownImage(imageUrl);
                setShowImageUpload(false);
                setImageUrl('');
                toast.success('Image saved for everyone!');
            } catch (err) {
                toast.error('Failed to save image');
            }
        }
    };

    const skipImageUpload = async () => {
        try {
            await axios.put(`${API}/weddings/${weddingId}/countdown-image`, {
                image_url: DEFAULT_COUNTDOWN_IMAGE
            });
            setCountdownImage(DEFAULT_COUNTDOWN_IMAGE);
            setShowImageUpload(false);
        } catch (err) {
            setCountdownImage(DEFAULT_COUNTDOWN_IMAGE);
            setShowImageUpload(false);
        }
    };

    if (loading) {
        return (
            <div className="app-container min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-stone-500">Loading wedding data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container min-h-screen bg-white" data-testid="dashboard-page">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#800000] to-[#600000] text-white px-4 py-3 flex items-center justify-between">
                <h1 className="font-serif text-xl font-bold">Shaadi Planner</h1>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-white/10 rounded-full"
                    data-testid="settings-btn"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 content-area bg-[#FDFBF7]">
                {/* Countdown Section with Image */}
                <div 
                    className="relative rounded-2xl overflow-hidden shadow-lg"
                    data-testid="countdown-card"
                >
                    <img 
                        src={countdownImage} 
                        alt="Wedding" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Gradient only on left side */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <button
                        onClick={() => setShowImageUpload(true)}
                        className="absolute top-3 right-3 p-2 bg-white/30 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors"
                        data-testid="change-image-btn"
                    >
                        <Camera size={18} />
                    </button>
                    
                    {/* Countdown Content - Left Aligned */}
                    <div className="relative px-5 py-6 text-white">
                        {/* Names */}
                        <h2 className="font-serif text-2xl font-semibold drop-shadow-lg">
                            {WEDDING_CONFIG.bride_name} & {WEDDING_CONFIG.groom_name}
                        </h2>
                        
                        {/* Days Counter */}
                        <div className="my-3">
                            <span className="font-serif text-5xl font-bold drop-shadow-lg text-[#D4AF37]" data-testid="days-remaining">
                                {daysRemaining > 0 ? daysRemaining : 0}
                            </span>
                            <p className="text-base opacity-90 drop-shadow">days to go</p>
                        </div>
                        
                        {/* Venue & Muhurta - Stacked */}
                        <div className="flex flex-col gap-2 mt-3">
                            {/* Venue */}
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                                <MapPin size={16} className="text-[#D4AF37]" />
                                <span className="text-sm font-medium">{WEDDING_CONFIG.venue}</span>
                            </div>
                            
                            {/* Muhurta Time */}
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                                <Clock size={16} className="text-[#D4AF37]" />
                                <span className="text-sm font-medium">{WEDDING_CONFIG.muhurta_time}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Stats Card */}
                <div className="budget-card" data-testid="task-stats-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1 text-center border-r border-stone-200">
                            <span className="text-3xl font-bold text-[#D4AF37]">{totalTasks}</span>
                            <p className="text-sm text-stone-500">Total</p>
                        </div>
                        <div className="flex-1 text-center border-r border-stone-200">
                            <span className="text-3xl font-bold text-green-600">{doneTasks}</span>
                            <p className="text-sm text-stone-500">Done</p>
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-3xl font-bold text-orange-500">{pendingTasks}</span>
                            <p className="text-sm text-stone-500">Pending</p>
                        </div>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2">
                        <div 
                            className="bg-[#D4AF37] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                    <p className="text-center text-sm text-stone-500 mt-2">{completionPercentage}% Complete</p>
                </div>

                {/* Upcoming Tasks */}
                <div className="budget-card" data-testid="upcoming-tasks-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title mb-0">Upcoming Tasks</h2>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[#800000] hover:bg-[#800000]/10"
                            onClick={() => navigate('/tasks')}
                            data-testid="view-tasks-btn"
                        >
                            View All
                            <ChevronRight size={16} />
                        </Button>
                    </div>

                    {upcomingTasks.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-stone-400">No pending tasks</p>
                            <Button 
                                variant="link" 
                                className="text-[#800000]"
                                onClick={() => navigate('/tasks')}
                            >
                                Add your first task
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {upcomingTasks.map((task) => (
                                <div 
                                    key={task.id} 
                                    className="flex items-center gap-3 p-3 bg-[#FEF9E7] rounded-xl"
                                    data-testid={`task-item-${task.id}`}
                                >
                                    <span 
                                        className="event-badge text-xs"
                                        style={{
                                            backgroundColor: getEventColor(task.event_id),
                                            color: 'white',
                                        }}
                                    >
                                        {getEventName(task.event_id)}
                                    </span>
                                    <span className="flex-1 font-medium text-stone-800">{task.description}</span>
                                    <div className="text-right text-xs text-stone-500">
                                        <div className="flex items-center gap-1">
                                            <User size={12} />
                                            {task.assigned_to}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatShortDate(task.due_date)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Budget Overview */}
                <div className="budget-card" data-testid="budget-overview-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title mb-0">Budget Overview</h2>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[#800000] hover:bg-[#800000]/10"
                            onClick={() => navigate('/budget')}
                            data-testid="view-budget-btn"
                        >
                            View All
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    
                    {/* Event Budget Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {stats?.event_stats?.slice(0, 4).map((event) => {
                            const percentage = calculatePercentage(event.spent, event.budget);
                            return (
                                <div 
                                    key={event.id} 
                                    className="event-budget-card"
                                    data-testid={`event-card-${event.id}`}
                                >
                                    <p className="font-semibold text-stone-800 mb-2">{event.name}</p>
                                    <DonutChart 
                                        percentage={percentage} 
                                        size={80} 
                                        strokeWidth={6}
                                        color={event.color || '#D4AF37'}
                                    />
                                    <div className="mt-2 text-xs space-y-1">
                                        <p><span className="text-stone-500">Budget:</span> <span className="font-semibold">{formatCurrency(event.budget)}</span></p>
                                        <p><span className="text-stone-500">Spent:</span> <span className="text-[#800000]">{formatCurrency(event.spent)}</span></p>
                                        <p><span className="text-stone-500">Remaining:</span> <span className="text-green-600">{formatCurrency(event.remaining)}</span></p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-xs mx-4 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Settings</DialogTitle>
                        <DialogDescription>Manage your wedding planner</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <Button
                            variant="outline"
                            className="w-full rounded-xl"
                            onClick={() => {
                                setShowSettings(false);
                                setShowImageUpload(true);
                            }}
                            data-testid="change-countdown-image"
                        >
                            <Camera className="mr-2" size={18} />
                            Change Countdown Image
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleLogout}
                            data-testid="logout-btn"
                        >
                            Logout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Upload Dialog */}
            <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
                <DialogContent className="max-w-sm mx-4 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {countdownImage !== DEFAULT_COUNTDOWN_IMAGE ? 'Change Countdown Image' : 'Add Your Photo'}
                        </DialogTitle>
                        <DialogDescription>
                            Add a beautiful couple photo - it will be visible to everyone!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {/* Upload from device */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            className="w-full rounded-xl border-[#D4AF37] text-[#800000]"
                            onClick={() => fileInputRef.current?.click()}
                            data-testid="upload-image-btn"
                        >
                            <Camera className="mr-2" size={18} />
                            Upload from Device
                        </Button>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-stone-200" />
                            <span className="text-xs text-stone-400">OR</span>
                            <div className="flex-1 h-px bg-stone-200" />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Input
                                type="url"
                                placeholder="Paste image URL"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="rounded-xl border-[#E5D08C]"
                                data-testid="image-url-input"
                            />
                            <Button
                                className="w-full rounded-xl bg-[#800000] hover:bg-[#600000]"
                                onClick={handleImageUrl}
                                disabled={!imageUrl}
                                data-testid="use-url-btn"
                            >
                                Use This Image
                            </Button>
                        </div>

                        {countdownImage === DEFAULT_COUNTDOWN_IMAGE && (
                            <Button
                                variant="ghost"
                                className="w-full text-stone-500"
                                onClick={skipImageUpload}
                                data-testid="skip-image-btn"
                            >
                                Skip for now
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <BottomNav />
        </div>
    );
}
