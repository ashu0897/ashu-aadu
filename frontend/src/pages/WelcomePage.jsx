import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Wallet, ListTodo } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WelcomePage() {
    const navigate = useNavigate();

    return (
        <div className="app-container min-h-screen flex flex-col" data-testid="welcome-page">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")`,
                    }}
                />
                
                {/* Logo/Icon */}
                <div className="relative mb-8 animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#800000] to-[#4A0404] flex items-center justify-center shadow-xl">
                        <Heart className="w-12 h-12 text-[#D4AF37]" fill="#D4AF37" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                        <span className="text-white text-lg">+</span>
                    </div>
                </div>

                {/* Title */}
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#800000] text-center mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    Shaadi Planner
                </h1>

                {/* Subtitle */}
                <p className="text-stone-600 text-center text-lg mb-10 max-w-xs animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Plan your wedding expenses, events, and tasks in one place.
                </p>

                {/* Features */}
                <div className="w-full max-w-sm space-y-3 mb-10 stagger-children">
                    <FeatureItem 
                        icon={<Calendar className="w-5 h-5" />}
                        title="Wedding Countdown"
                        description="Track days until your special day"
                    />
                    <FeatureItem 
                        icon={<Wallet className="w-5 h-5" />}
                        title="Budget Management"
                        description="Event-wise expense tracking"
                    />
                    <FeatureItem 
                        icon={<ListTodo className="w-5 h-5" />}
                        title="Task Assignment"
                        description="Assign tasks to family members"
                    />
                </div>

                {/* CTA Button */}
                <Button
                    onClick={() => navigate('/setup')}
                    className="w-full max-w-sm bg-[#800000] hover:bg-[#600000] text-white rounded-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                    data-testid="create-wedding-btn"
                >
                    Create Wedding
                </Button>

                {/* Footer text */}
                <p className="text-stone-400 text-sm mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    Start planning your perfect shaadi
                </p>
            </div>
        </div>
    );
}

const FeatureItem = ({ icon, title, description }) => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5D08C]/30 card-hover">
        <div className="w-10 h-10 rounded-full bg-[#F3E5AB] flex items-center justify-center text-[#800000]">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-stone-800">{title}</h3>
            <p className="text-sm text-stone-500">{description}</p>
        </div>
    </div>
);
