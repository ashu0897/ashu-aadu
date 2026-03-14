import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { createWedding, createEvent, createPerson } from '../lib/api';
import { setStoredWeddingId } from '../lib/utils';
import { toast } from 'sonner';

const DEFAULT_EVENTS = [
    { name: 'Mehendi', budget: 100000, color: '#059669' },
    { name: 'Haldi', budget: 100000, color: '#D97706' },
    { name: 'Sangeet', budget: 200000, color: '#E879A0' },
    { name: 'Wedding Ceremony', budget: 500000, color: '#800000' },
    { name: 'Reception', budget: 300000, color: '#D4AF37' },
];

export default function WeddingSetupPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        bride_name: '',
        groom_name: '',
        wedding_date: null,
        location: '',
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generateTitle = () => {
        if (formData.bride_name && formData.groom_name) {
            return `Wedding of ${formData.bride_name} and ${formData.groom_name}`;
        }
        return formData.title;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.bride_name || !formData.groom_name || !formData.wedding_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const weddingData = {
                title: formData.title || generateTitle(),
                bride_name: formData.bride_name,
                groom_name: formData.groom_name,
                wedding_date: formData.wedding_date.toISOString(),
                location: formData.location || null,
            };

            const wedding = await createWedding(weddingData);
            setStoredWeddingId(wedding.id);

            // Create default events
            for (const event of DEFAULT_EVENTS) {
                await createEvent({
                    ...event,
                    wedding_id: wedding.id,
                });
            }

            // Create bride and groom as default people
            await createPerson({ name: formData.bride_name, wedding_id: wedding.id });
            await createPerson({ name: formData.groom_name, wedding_id: wedding.id });

            toast.success('Wedding created successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating wedding:', error);
            toast.error('Failed to create wedding. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container min-h-screen" data-testid="setup-page">
            {/* Header */}
            <div className="page-header">
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
                    data-testid="back-btn"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
                <h1 className="font-serif text-2xl font-bold">Wedding Setup</h1>
                <p className="text-white/80 text-sm mt-1">Enter your wedding details</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-stone-700">Wedding Title (Optional)</Label>
                    <Input
                        id="title"
                        placeholder={generateTitle() || "e.g., Wedding of Ashu and Aadu"}
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="rounded-xl border-[#E5D08C] focus:border-[#D4AF37] bg-white"
                        data-testid="title-input"
                    />
                    <p className="text-xs text-stone-500">Leave empty to auto-generate from names</p>
                </div>

                {/* Names Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bride_name" className="text-stone-700">Bride Name *</Label>
                        <Input
                            id="bride_name"
                            placeholder="Enter name"
                            value={formData.bride_name}
                            onChange={(e) => handleInputChange('bride_name', e.target.value)}
                            className="rounded-xl border-[#E5D08C] focus:border-[#D4AF37] bg-white"
                            required
                            data-testid="bride-name-input"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="groom_name" className="text-stone-700">Groom Name *</Label>
                        <Input
                            id="groom_name"
                            placeholder="Enter name"
                            value={formData.groom_name}
                            onChange={(e) => handleInputChange('groom_name', e.target.value)}
                            className="rounded-xl border-[#E5D08C] focus:border-[#D4AF37] bg-white"
                            required
                            data-testid="groom-name-input"
                        />
                    </div>
                </div>

                {/* Wedding Date */}
                <div className="space-y-2">
                    <Label className="text-stone-700">Wedding Date *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal rounded-xl border-[#E5D08C] hover:border-[#D4AF37] bg-white",
                                    !formData.wedding_date && "text-muted-foreground"
                                )}
                                data-testid="date-picker-btn"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-[#D4AF37]" />
                                {formData.wedding_date ? (
                                    format(formData.wedding_date, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formData.wedding_date}
                                onSelect={(date) => handleInputChange('wedding_date', date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                data-testid="calendar"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="location" className="text-stone-700">
                        <span className="flex items-center gap-2">
                            <MapPin size={16} className="text-[#D4AF37]" />
                            Location (Optional)
                        </span>
                    </Label>
                    <Input
                        id="location"
                        placeholder="e.g., Mumbai, India"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="rounded-xl border-[#E5D08C] focus:border-[#D4AF37] bg-white"
                        data-testid="location-input"
                    />
                </div>

                {/* Preview Card */}
                {(formData.bride_name || formData.groom_name) && (
                    <div className="bg-gradient-to-br from-[#800000] to-[#4A0404] rounded-2xl p-6 text-white animate-fade-in">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Heart className="w-5 h-5 text-[#D4AF37]" fill="#D4AF37" />
                        </div>
                        <h3 className="font-serif text-xl text-center font-semibold">
                            {formData.title || generateTitle() || 'Your Wedding'}
                        </h3>
                        {formData.wedding_date && (
                            <p className="text-center text-white/80 mt-2">
                                {format(formData.wedding_date, "d MMMM yyyy")}
                            </p>
                        )}
                        {formData.location && (
                            <p className="text-center text-white/60 text-sm mt-1 flex items-center justify-center gap-1">
                                <MapPin size={14} />
                                {formData.location}
                            </p>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#800000] hover:bg-[#600000] text-white rounded-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="submit-btn"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                        </span>
                    ) : (
                        'Create Wedding'
                    )}
                </Button>
            </form>
        </div>
    );
}
