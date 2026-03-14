import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const CORRECT_PASSWORD = '1527';

export default function PasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        
        setTimeout(() => {
            if (password === CORRECT_PASSWORD) {
                localStorage.setItem('shaadi_authenticated', 'true');
                toast.success('Welcome to Ashu & Aadu\'s Wedding!');
                navigate('/dashboard');
            } else {
                toast.error('Incorrect password. Please try again.');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="app-container min-h-screen flex flex-col items-center justify-center px-6" data-testid="password-page">
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
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#800000] text-center mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Ashu & Aadu
            </h1>
            
            <p className="text-stone-500 text-center mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                Wedding Planner
            </p>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]" />
                    <Input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 py-6 rounded-full border-[#E5D08C] focus:border-[#D4AF37] bg-white text-center text-lg"
                        data-testid="password-input"
                        autoFocus
                    />
                </div>
                
                <Button
                    type="submit"
                    disabled={loading || !password}
                    className="w-full bg-[#800000] hover:bg-[#600000] text-white rounded-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                    data-testid="submit-password-btn"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying...
                        </span>
                    ) : (
                        'Enter'
                    )}
                </Button>
            </form>

            {/* Footer */}
            <p className="text-stone-400 text-sm mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Private wedding planner
            </p>
        </div>
    );
}
