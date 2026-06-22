import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Calendar } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DESIGN TOKENS                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
const BG       = '#f3f3f3';
const CARD_BG  = '#efefef';
const TEXT     = '#222222';
const MUTED    = '#666666';

/* Darker Neumorphic shadows for visual depth */
const NEU_UP   = '-10px -10px 20px rgba(255,255,255,1), 10px 10px 20px rgba(0,0,0,0.12)';
const NEU_DOWN = 'inset 4px 4px 8px rgba(0,0,0,0.07), inset -4px -4px 8px rgba(255,255,255,1)';
const NEU_BTN_UP = '-6px -6px 12px rgba(255,255,255,1), 6px 6px 12px rgba(0,0,0,0.1)';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COMPONENTS                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Topographic Contour Overlay */
const TopoBackground = () => (
  <svg viewBox="0 0 1200 900" className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.32]" preserveAspectRatio="none">
    <path d="M100,150 C350,80 550,220 850,130 C1050,60 1120,200 1200,160" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
    <path d="M80,190 C330,120 530,260 830,170 C1030,100 1100,240 1180,200" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
    <path d="M60,230 C310,160 510,300 810,210 C1010,140 1080,280 1160,240" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
    <path d="M40,270 C290,200 490,340 790,250 C990,180 1060,320 1140,280" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
    <path d="M20,310 C270,240 470,380 770,290 C970,220 1040,360 1120,320" stroke="#d5d5da" strokeWidth="1.2" fill="none" />

    <path d="M50,470 C180,430 320,550 480,510 C640,470 720,600 920,540 C1080,490 1150,600 1200,560" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
    <path d="M30,510 C160,470 300,590 460,550 C620,510 700,640 900,580 C1060,530 1130,640 1180,600" stroke="#d5d5da" strokeWidth="1.2" fill="none" />

    <path d="M220,780 C420,730 620,860 920,790 C1070,710 1150,820 1200,780" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
    <path d="M200,820 C400,770 600,900 900,830 C1050,750 1130,860 1180,820" stroke="#d5d5da" strokeWidth="1.2" fill="none" />
  </svg>
);

/* Concentric Orbital centerpiece (Scaled down to fit screen height) */
const OrbitalHero = () => {
  return (
    <div className="flex flex-col items-center justify-center relative w-full select-none">
      {/* Outer Orbit Ring */}
      <div 
        className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] rounded-full flex items-center justify-center relative border border-white/50"
        style={{ background: CARD_BG, boxShadow: NEU_UP }}
      >
        {/* Floating orbit node 1 - 10 o'clock */}
        <div 
          className="w-3.5 h-3.5 rounded-full border border-white absolute top-[12%] left-[12%] z-20"
          style={{ background: '#f5f5f5', boxShadow: '2px 2px 5px rgba(0,0,0,0.12), -2px -2px 5px #fff' }}
        />
        {/* Floating orbit node 2 - 4 o'clock */}
        <div 
          className="w-4 h-4 rounded-full border border-white absolute bottom-[12%] right-[12%] z-20"
          style={{ background: '#f5f5f5', boxShadow: '2px 2px 5px rgba(0,0,0,0.12), -2px -2px 5px #fff' }}
        />
        {/* Floating orbit node 3 - 7 o'clock */}
        <div 
          className="w-3 h-3 rounded-full border border-white absolute bottom-[20%] left-[19%] z-20"
          style={{ background: '#f5f5f5', boxShadow: '2px 2px 5px rgba(0,0,0,0.12), -2px -2px 5px #fff' }}
        />

        {/* Orbit track SVG line overlay */}
        <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
          <circle cx="150" cy="150" r="110" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>

        {/* Middle Ring */}
        <div 
          className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full flex items-center justify-center border border-black/[0.02]"
          style={{ background: CARD_BG, boxShadow: NEU_DOWN }}
        >
          {/* Inner raised core */}
          <div 
            className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full flex items-center justify-center border border-white/70"
            style={{ background: '#f5f5f5', boxShadow: NEU_UP }}
          >
            {/* Purple Leaf Logo Icon */}
            <svg className="w-12 h-12 opacity-95" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 8C32 8 36 20 48 24C48 24 50 38 38 48C30 54 20 54 14 48C8 42 8 32 14 24C20 18 32 8 32 8Z" fill="url(#purpleLeafGrad)" />
              <path d="M14 48C20 40 32 32 32 32" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="purpleLeafGrad" x1="14" y1="48" x2="48" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#aa3bff" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Hero Tagline */}
      <div className="text-left mt-6 w-full max-w-[300px] px-2">
        <h2 style={{ fontSize: 36, fontWeight: 950, color: TEXT, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
          Build.
          <span className="block text-purple-600">Showcase.</span>
          <span className="block text-neutral-500">Connect.</span>
        </h2>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 max-w-[260px]">
          The future portfolio platform for creators and professionals.
        </p>
      </div>
    </div>
  );
};

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // State fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Not Specified');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in Name, Email, and Password');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, age ? parseInt(age) : undefined, gender);
      toast.success('Welcome to ProjBazaar! 🎉');
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleGithubSignup = () => {
    toast.error('GitHub authentication is currently in development. Please use Google or Email.');
  };

  return (
    <div className="min-h-screen w-full bg-[#f3f3f3] flex items-center justify-center p-4 xl:p-6 font-sans selection:bg-purple-600 selection:text-white overflow-y-auto">
      
      {/* Styles for dynamic fonts, overlays, and shapes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        
        .outer-clipped-frame {
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.06));
        }

        .background-panel-svg {
          filter: drop-shadow(-10px -10px 25px #ffffff) drop-shadow(14px 14px 28px rgba(0,0,0,0.12));
        }

        .login-panel-svg {
          filter: drop-shadow(-12px -12px 25px #ffffff) drop-shadow(14px 14px 28px rgba(0,0,0,0.14));
        }

        .neu-input-container {
          background: #e8e8ea;
          box-shadow: ${NEU_DOWN};
          border: 1px solid rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        
        .neu-input-container:focus-within {
          background: #e4e4e6;
          border-color: rgba(170, 59, 255, 0.25);
          box-shadow: ${NEU_DOWN}, 0 0 0 3px rgba(170, 59, 255, 0.1);
        }
      `}</style>

      {/* Mobile View: Vertical standard container */}
      <div className="lg:hidden w-full max-w-[460px] flex flex-col justify-between relative pt-8 px-8 pb-12 min-h-[660px]">
        
        {/* Background Card */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <svg viewBox="0 0 700 900" className="w-full h-full login-panel-svg" preserveAspectRatio="none">
            <path
              d="M80 50 H230 L255 25 H620 L680 85 V820 L620 880 H80 L20 820 V110 L80 50 Z"
              fill="#efefef"
            />
            <path
              d="M95 70 H220 L245 45 H600 L650 95 V800 L600 855 H100 L50 800 V125 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              opacity="0.85"
            />
            <circle cx="70" cy="70" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
            <circle cx="650" cy="70" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
            <circle cx="70" cy="820" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
            <circle cx="650" cy="820" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between flex-1">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-850 tracking-tight leading-none mb-2">
              Create Account
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Register to start your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 my-6">
            <div className="space-y-0.5">
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1">
                Full Name
              </label>
              <div className="neu-input-container rounded-xl flex items-center px-4 w-full h-[54px]">
                <User size={18} className="text-neutral-400 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Vikas Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm text-neutral-800 placeholder-neutral-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1">
                Email Address
              </label>
              <div className="neu-input-container rounded-xl flex items-center px-4 w-full h-[54px]">
                <Mail size={18} className="text-neutral-400 mr-3 shrink-0" />
                <input
                  type="email"
                  placeholder="vikas@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm text-neutral-800 placeholder-neutral-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="neu-input-container rounded-xl flex items-center px-4 w-full h-[54px] relative">
                <Lock size={18} className="text-neutral-400 mr-3 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm text-neutral-800 placeholder-neutral-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-neutral-400 hover:text-neutral-600 outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Age</label>
                <div className="neu-input-container rounded-xl flex items-center px-4 w-full h-[52px]">
                  <Calendar size={18} className="text-neutral-400 mr-3 shrink-0" />
                  <input
                    type="number"
                    placeholder="20"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-sm text-neutral-800"
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Gender</label>
                <div className="neu-input-container rounded-xl flex items-center px-4 w-full h-[52px] relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-sm text-neutral-800 appearance-none pr-4"
                  >
                    <option value="Not Specified">Not Specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-[54px] rounded-xl flex items-center justify-center gap-2 border border-white/60 font-bold text-neutral-850 text-sm"
                style={{ background: '#efefef', boxShadow: NEU_BTN_UP, outline: 'none' }}
              >
                <span>Sign Up</span>
                <ArrowRight size={16} className="text-purple-600 ml-1 shrink-0" />
              </motion.button>
            </div>
          </form>

          {/* Social icons */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-450 mb-2.5">or register via</span>
            <div className="flex gap-4">
              <button onClick={handleGoogleSignup} className="w-[56px] h-[56px] rounded-full flex items-center justify-center border border-white/50 bg-[#efefef]" style={{ boxShadow: NEU_BTN_UP }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h4.01c2.34-2.16 3.68-5.32 3.68-8.75z"/><path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.95 1.19-3.05 0-5.64-2.06-6.57-4.83H1.32v3.23A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.43 14.32a7.18 7.18 0 0 1 0-4.64V6.45H1.32a12 12 0 0 0 0 11.1l4.11-3.23z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 1.32 6.45l4.11 3.23c.93-2.77 3.52-4.83 6.57-4.83z"/></svg>
              </button>
              <button onClick={handleGithubSignup} className="w-[56px] h-[56px] rounded-full flex items-center justify-center border border-white/50 bg-[#efefef] text-neutral-850" style={{ boxShadow: NEU_BTN_UP }}>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>
              </button>
              <button onClick={() => toast.error('Apple Sign Up is currently in development.')} className="w-[56px] h-[56px] rounded-full flex items-center justify-center border border-white/50 bg-[#efefef] text-neutral-850" style={{ boxShadow: NEU_BTN_UP }}>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.35-6.14-3.56-2.85-7.44-7.66-11.64-14.42-8.41-13.62-14.88-29.35-19.4-47.2C1 81.37.5 65.6 4.04 51C7.58 36.38 14.74 24.8 25.5 16.27 34.69 9 44.7 5.25 55.5 5c5.35-.1 11.2 1.48 17.56 4.77 6.35 3.28 10.97 4.92 13.85 4.92 2.45 0 6.8-1.53 13.06-4.6 6.25-3.06 11.75-4.63 16.5-4.7 15.6-.2 27.67 5.4 36.22 16.8-12.28 7.48-18.3 17.3-18.06 29.5.24 9.68 3.88 17.7 10.92 24.1 7.04 6.38 15.34 9.87 24.9 10.46-2.05 6.08-5.22 13.1-9.53 21.1zM119.22 0c0 9.27-3.25 17.82-9.75 25.64-7.5 9.03-16.48 13.97-26.94 14.8-1.08-10.45 2.1-20.08 9.5-28.9C99.27 3.5 108.9.2 118.22 0z" /></svg>
              </button>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-neutral-500 font-semibold">
            Already have an account? <Link to="/login" className="text-purple-600 font-bold hover:underline">Sign In</Link>
          </div>
        </div>

      </div>

      {/* Desktop View: Unified Integrated 1024x640 card (Constrained to fit screen height) */}
      <div className="hidden lg:block w-full max-w-[1024px] h-[86vh] max-h-[640px] relative select-none z-10">
        
        {/* Main Background Panel Shape SVG */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <svg viewBox="0 0 1200 900" className="w-full h-full background-panel-svg" preserveAspectRatio="none">
            <path
              d="M100 50 H680 L720 90 H1090 L1160 160 V820 L1100 880 H110 L40 810 V470 L10 440 V140 L100 50 Z"
              fill="#efefef"
            />
            <path
              d="M120 70 H670 L705 105 H1070 L1135 170 V800 L1080 855 H125 L60 790 V460 L35 435 V155 L120 70 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <circle cx="120" cy="80" r="3.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
            <circle cx="1060" cy="120" r="3.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
            <circle cx="120" cy="840" r="3.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
            <circle cx="1060" cy="840" r="3.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
          </svg>
        </div>

        {/* Topographic Contour Lines */}
        <TopoBackground />

        {/* Technical connection overlays */}
        <svg viewBox="0 0 1200 900" className="absolute inset-0 w-full h-full pointer-events-none">
          <line x1="1080" y1="120" x2="1080" y2="240" stroke="#cfcfd4" strokeWidth="1" />
          <circle cx="1080" cy="120" r="3.5" fill="#cfcfd4" />
          <circle cx="1080" cy="240" r="3.5" fill="#cfcfd4" />
          
          <g opacity="0.35">
            <circle cx="1120" cy="100" r="2" fill="#999" />
            <circle cx="1140" cy="100" r="2" fill="#999" />
            <circle cx="1160" cy="100" r="2" fill="#999" />
            <circle cx="1120" cy="118" r="2" fill="#999" />
            <circle cx="1140" cy="118" r="2" fill="#999" />
            <circle cx="1160" cy="118" r="2" fill="#999" />
          </g>
        </svg>

        {/* Unified columns layout */}
        <div className="absolute inset-0 grid grid-cols-12 items-center px-8 py-6 h-full">
          
          {/* Left Hero side */}
          <div className="col-span-7 flex flex-col items-center justify-center">
            <OrbitalHero />
          </div>

          {/* Right Form side */}
          <div className="col-span-5 relative h-[96%] flex flex-col justify-center pl-4 pr-1">
            
            {/* The Signup card container */}
            <div className="relative w-full h-full flex flex-col justify-between pt-12 pb-9 px-8 sm:px-10">
              
              {/* Signup Card SVG backdrop */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <svg viewBox="0 0 700 900" className="w-full h-full login-panel-svg" preserveAspectRatio="none">
                  <path
                    d="M80 50 H230 L255 25 H620 L680 85 V820 L620 880 H80 L20 820 V110 L80 50 Z"
                    fill="#efefef"
                  />
                  <path
                    d="M95 70 H220 L245 45 H600 L650 95 V800 L600 855 H100 L50 800 V125 Z"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                  <circle cx="70" cy="70" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="650" cy="70" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="70" cy="820" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="650" cy="820" r="4.5" fill="#cfcfd4" stroke="#ffffff" strokeWidth="1" />
                </svg>
              </div>

              {/* Form Content */}
              <div className="relative z-10 flex flex-col justify-between flex-1">
                
                {/* Header */}
                <div>
                  <h1 className="text-2xl lg:text-[30px] font-extrabold text-neutral-850 tracking-tight leading-none mb-1">
                    Create Account
                  </h1>
                  <p className="text-[10px] text-neutral-500 font-medium">
                    Register to start your journey
                  </p>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit} className="space-y-2.5 my-auto py-1">
                  
                  {/* Full Name */}
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-bold text-neutral-450 uppercase tracking-wider pl-1">
                      Full Name
                    </label>
                    <div className="neu-input-container rounded-xl flex items-center px-3.5 w-full h-[46px]">
                      <User size={15} className="text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type="text"
                        placeholder="e.g. Vikas Patel"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs text-neutral-800 placeholder-neutral-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Email address */}
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-bold text-neutral-450 uppercase tracking-wider pl-1">
                      Email Address
                    </label>
                    <div className="neu-input-container rounded-xl flex items-center px-3.5 w-full h-[46px]">
                      <Mail size={15} className="text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type="email"
                        placeholder="vikas@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs text-neutral-800 placeholder-neutral-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-bold text-neutral-450 uppercase tracking-wider pl-1">
                      Password
                    </label>
                    <div className="neu-input-container rounded-xl flex items-center px-3.5 w-full h-[46px] relative">
                      <Lock size={15} className="text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs text-neutral-800 placeholder-neutral-400 pr-8"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Age & Gender Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-0.5">
                      <label className="block text-[8px] font-bold text-neutral-450 uppercase tracking-wider pl-1">Age</label>
                      <div className="neu-input-container rounded-xl flex items-center px-3.5 w-full h-[46px]">
                        <Calendar size={15} className="text-neutral-400 mr-2.5 shrink-0" />
                        <input
                          type="number"
                          placeholder="20"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="bg-transparent border-none outline-none w-full text-xs text-neutral-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[8px] font-bold text-neutral-450 uppercase tracking-wider pl-1">Gender</label>
                      <div className="neu-input-container rounded-xl flex items-center px-3.5 w-full h-[46px] relative">
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="bg-transparent border-none outline-none w-full text-xs text-neutral-800 appearance-none pr-4"
                        >
                          <option value="Not Specified">Not Specified</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="pt-1">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-[46px] rounded-xl flex items-center justify-center gap-2 border border-white/60 font-bold text-neutral-850 text-xs"
                      style={{ background: '#efefef', boxShadow: NEU_BTN_UP, outline: 'none' }}
                    >
                      <span>{isLoading ? 'Creating...' : 'Sign Up'}</span>
                      <ArrowRight size={14} className="text-purple-600 ml-1 shrink-0" />
                    </motion.button>
                  </div>

                </form>

                {/* Social Login circles */}
                <div className="flex flex-col items-center pt-0.5">
                  <span className="text-[8px] uppercase font-bold tracking-widest text-neutral-450 mb-1.5">
                    or register via
                  </span>
                  
                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      onClick={handleGoogleSignup}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-[50px] h-[50px] rounded-full flex items-center justify-center border border-white/50 bg-[#efefef] outline-none cursor-pointer"
                      style={{ boxShadow: NEU_BTN_UP }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h4.01c2.34-2.16 3.68-5.32 3.68-8.75z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.95 1.19-3.05 0-5.64-2.06-6.57-4.83H1.32v3.23A12 12 0 0 0 12 24z"/>
                        <path fill="#FBBC05" d="M5.43 14.32a7.18 7.18 0 0 1 0-4.64V6.45H1.32a12 12 0 0 0 0 11.1l4.11-3.23z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 1.32 6.45l4.11 3.23c.93-2.77 3.52-4.83 6.57-4.83z"/>
                      </svg>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handleGithubSignup}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-[50px] h-[50px] rounded-full flex items-center justify-center border border-white/50 bg-[#efefef] outline-none cursor-pointer text-neutral-800"
                      style={{ boxShadow: NEU_BTN_UP }}
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => toast.error('Apple Sign Up is currently in development.')}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-[50px] h-[50px] rounded-full flex items-center justify-center border border-white/50 bg-[#efefef] outline-none cursor-pointer text-neutral-800"
                      style={{ boxShadow: NEU_BTN_UP }}
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.35-6.14-3.56-2.85-7.44-7.66-11.64-14.42-8.41-13.62-14.88-29.35-19.4-47.2C1 81.37.5 65.6 4.04 51C7.58 36.38 14.74 24.8 25.5 16.27 34.69 9 44.7 5.25 55.5 5c5.35-.1 11.2 1.48 17.56 4.77 6.35 3.28 10.97 4.92 13.85 4.92 2.45 0 6.8-1.53 13.06-4.6 6.25-3.06 11.75-4.63 16.5-4.7 15.6-.2 27.67 5.4 36.22 16.8-12.28 7.48-18.3 17.3-18.06 29.5.24 9.68 3.88 17.7 10.92 24.1 7.04 6.38 15.34 9.87 24.9 10.46-2.05 6.08-5.22 13.1-9.53 21.1zM119.22 0c0 9.27-3.25 17.82-9.75 25.64-7.5 9.03-16.48 13.97-26.94 14.8-1.08-10.45 2.1-20.08 9.5-28.9C99.27 3.5 108.9.2 118.22 0z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Bottom Attached create account tab */}
                <div className="relative select-none mt-1">
                  <div className="absolute inset-0 w-full h-[46px] flex items-center justify-center">
                    <svg viewBox="0 0 460 120" className="w-full h-[46px]" preserveAspectRatio="none" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.03))' }}>
                      <path 
                        d="M40 20 H420 L460 60 L420 100 H40 L0 60 Z" 
                        fill="#efefef" 
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="relative z-10 flex items-center justify-center h-[46px] text-[10px] text-neutral-500 font-semibold gap-1">
                    <span>Already have an account?</span>
                    <Link to="/login" className="text-purple-600 font-bold hover:text-purple-750 flex items-center gap-1.5 hover:underline">
                      <span>Sign In</span>
                      <ArrowRight size={11} className="shrink-0 mt-0.5" />
                    </Link>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
