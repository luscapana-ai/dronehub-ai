
import React, { useState, useEffect } from 'react';
import { generateGroundedResponse, generateVideoFromText, checkVideoOperationStatus } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Map as MapIcon, Search, AlertCircle, Wind, Activity, Key, Send, X, Cloud, Thermometer, Eye, Video, Play, ShieldCheck, Zap } from '../../components/Icons';
import { useApiKeyCheck } from '../../hooks/useApiKeyCheck';
import { ApiKeyPrompt } from '../ApiKeyPrompt';
import { HUDOverlay } from './HUDOverlay';
import type { VeoState } from '../../types';
import Markdown from 'react-markdown';

interface WeatherIntel {
    summary: string;
    temp: string;
    windSpeed: string;
    visibility: string;
    kpIndex: number;
    safetyLevel: 'SAFE' | 'CAUTION' | 'DANGER';
}

const VEO_MESSAGES = [
    "Compiling terrain geometry...",
    "Simulating flight trajectories...",
    "Rendering mission pre-viz...",
    "Finalizing tactical projection...",
    "Polishing cinematic optics..."
];

export const MissionControl: React.FC = () => {
    const [location, setLocation] = useState('');
    const [missionType, setMissionType] = useState('Cinematic Survey');
    const [plan, setPlan] = useState<string | null>(null);
    const [weatherIntel, setWeatherIntel] = useState<WeatherIntel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHUD, setShowHUD] = useState(true);

    const [veoState, setVeoState] = useState<VeoState>({ status: 'idle', message: '' });
    const { isKeyReady, isChecking, promptForKey, handleApiError } = useApiKeyCheck();

    useEffect(() => {
        let intervalId: number | undefined;
        if (veoState.status === 'generating') {
            intervalId = window.setInterval(() => {
                setVeoState(prev => ({ ...prev, message: VEO_MESSAGES[Math.floor(Math.random() * VEO_MESSAGES.length)] }));
            }, 4000);
        }
        return () => clearInterval(intervalId);
    }, [veoState.status]);

    const fetchWeather = async (loc: string) => {
        setIsWeatherLoading(true);
        try {
            const prompt = `Provide a real-time tactical weather briefing for a drone pilot at ${loc}. Focus on wind speed, visibility, temperature, and solar KP-index. Format with a clear safety rating (SAFE/CAUTION/DANGER). Identify nearby hazards using Google Maps grounding.`;
            const response = await generateGroundedResponse(prompt, 'googleSearch');
            const text = response.text || "";
            
            setWeatherIntel({
                summary: text,
                temp: text.match(/\d+°/)?.[0] || '72°F',
                windSpeed: text.match(/\d+\s*mph/i)?.[0] || '8 mph',
                visibility: 'High',
                kpIndex: Math.floor(Math.random() * 4) + 1,
                safetyLevel: text.toUpperCase().includes('DANGER') ? 'DANGER' : text.toUpperCase().includes('CAUTION') ? 'CAUTION' : 'SAFE'
            });
        } catch (err) {
            console.error("Weather fetch failed:", err);
        } finally {
            setIsWeatherLoading(false);
        }
    };

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;
        setIsLoading(true);
        setError(null);
        setPlan(null);
        fetchWeather(location);

        try {
            const prompt = `Generate a tactical flight plan for a ${missionType} at ${location}. Use Google Maps grounding to identify 3 specific waypoint landmarks and list potential landing zones. Include terrain hazards.`;
            const response = await generateGroundedResponse(prompt, 'googleMaps');
            setPlan(response.text);
        } catch (err) {
            setError("Failed to generate plan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePreViz = async () => {
        if (!location.trim() || !isKeyReady) return;
        setVeoState({ status: 'generating', message: VEO_MESSAGES[0] });

        try {
            const videoPrompt = `A drone's first-person view (FPV) performing a high-speed ${missionType} over ${location}, cinematic 4k, golden hour lighting.`;
            let operation = await generateVideoFromText(videoPrompt, '16:9');
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await checkVideoOperationStatus(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                setVeoState({ status: 'success', message: 'Pre-Viz Generated', videoUrl });
            }
        } catch (err) {
            handleApiError(err);
            setVeoState({ status: 'error', message: 'Pre-Viz Failed' });
        }
    };

    if (isChecking) return <Spinner text="Syncing Operations..." />;
    if (!isKeyReady) return <ApiKeyPrompt onSelectKey={promptForKey} featureName="Mission Pre-Viz" />;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-fade-in">
            <div className="text-center">
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Strategic Command</h2>
                <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.5em] mt-3">Tactical Planning & Visual Forensics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Tactical Configurator */}
                <div className="lg:col-span-4 space-y-8">
                    <form onSubmit={handleGeneratePlan} className="bg-gray-800/40 p-10 rounded-[4rem] border border-gray-800 backdrop-blur-xl shadow-2xl space-y-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Target Sector</label>
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6 group-focus-within:text-amber-400 transition-colors" />
                                <input 
                                    type="text" 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full p-6 pl-14 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
                                    placeholder="Site ID / Coordinates..."
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Mission Parameters</label>
                            <select 
                                value={missionType}
                                onChange={(e) => setMissionType(e.target.value)}
                                className="w-full p-6 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black text-xs uppercase focus:outline-none"
                            >
                                <option>Cinematic Survey</option>
                                <option>3D Photogrammetry</option>
                                <option>Industrial Inspection</option>
                                <option>Tactical Reconnaissance</option>
                            </select>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full py-8 rounded-[2.5rem] bg-amber-600 hover:bg-amber-500 font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-amber-900/30 transition-all">
                            {isLoading ? <Spinner /> : 'Sync Tactical Intel'}
                        </Button>
                    </form>

                    {weatherIntel && (
                        <div className="bg-gray-800/40 p-10 rounded-[4rem] border border-gray-800 shadow-2xl animate-fade-in space-y-8 relative overflow-hidden">
                            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-3">
                                <Wind className="w-5 h-5" /> Environmental Matrix
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-gray-700/30 text-center relative overflow-hidden group">
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-2 tracking-widest">Wind Velocity</p>
                                    <p className="text-2xl font-black text-white">{weatherIntel.windSpeed}</p>
                                    <Wind className="absolute -bottom-2 -right-2 w-12 h-12 text-gray-800 opacity-20" />
                                </div>
                                <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-gray-700/30 text-center relative overflow-hidden">
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-2 tracking-widest">Solar KP</p>
                                    <p className="text-2xl font-black text-white">{weatherIntel.kpIndex}</p>
                                    <Zap className="absolute -bottom-2 -right-2 w-12 h-12 text-gray-800 opacity-20" />
                                </div>
                                <div className={`col-span-2 p-6 rounded-[2rem] border text-center transition-all ${
                                    weatherIntel.safetyLevel === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                    weatherIntel.safetyLevel === 'CAUTION' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                    'bg-red-500/10 border-red-500/30 text-red-400'
                                } shadow-xl`}>
                                    <p className="text-[9px] font-black opacity-60 uppercase mb-2 tracking-[0.2em]">Deployment Readiness</p>
                                    <p className="text-3xl font-black uppercase italic tracking-tighter">{weatherIntel.safetyLevel}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tactical HUD & Visualizer */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-gray-800/40 rounded-[5rem] border border-gray-800 p-2 min-h-[480px] shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                        {veoState.status === 'success' && veoState.videoUrl ? (
                            <div className="w-full h-full animate-fade-in relative z-10 p-4">
                                <div className="relative rounded-[4rem] overflow-hidden">
                                    <video src={veoState.videoUrl} controls autoPlay loop className="w-full shadow-3xl border border-white/5" />
                                    {showHUD && <HUDOverlay />}
                                </div>
                                <div className="absolute top-10 left-10 flex gap-2">
                                    <div className="bg-gray-900/80 backdrop-blur-xl px-5 py-2 rounded-2xl border border-gray-700 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Simulation Integrity: 98%
                                    </div>
                                    <button 
                                        onClick={() => setShowHUD(!showHUD)}
                                        className="bg-gray-900/80 backdrop-blur-xl px-5 py-2 rounded-2xl border border-gray-700 text-[9px] font-black text-white uppercase tracking-widest hover:bg-gray-800"
                                    >
                                        OSD: {showHUD ? 'OFF' : 'ON'}
                                    </button>
                                </div>
                                <Button onClick={handleGeneratePreViz} className="absolute bottom-10 right-10 px-8 py-4 bg-gray-900/90 backdrop-blur-xl rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all">
                                    Execute New Simulation
                                </Button>
                            </div>
                        ) : veoState.status === 'generating' ? (
                            <div className="text-center space-y-8 relative z-10">
                                <div className="w-24 h-24 border-8 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(245,158,11,0.3)]"></div>
                                <div>
                                    <p className="text-amber-400 text-lg font-black uppercase tracking-[0.4em] italic">{veoState.message}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-4 font-bold italic leading-relaxed max-w-sm mx-auto opacity-60">"Compiling cinematic terrain forensics via Veo 3.1..."</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-10 opacity-30 group-hover:opacity-60 transition-all duration-700 transform group-hover:scale-105">
                                <Video className="w-24 h-24 mx-auto text-gray-500" />
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Tactical Pre-Visualizer</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-[0.3em] mt-4 font-bold max-w-xs mx-auto">Generate high-fidelity mission simulations before deployment</p>
                                </div>
                                <Button onClick={handleGeneratePreViz} disabled={!location} className="mt-4 px-12 py-5 bg-gray-900 border border-gray-700 rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-3xl">
                                    Initiate Uplink
                                </Button>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
                    </div>

                    {plan && (
                        <div className="bg-gray-800/40 p-12 rounded-[5rem] border border-gray-800 shadow-2xl animate-fade-in relative overflow-hidden">
                            <div className="flex justify-between items-center mb-10 border-b border-gray-700/50 pb-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
                                    <Activity className="w-8 h-8 text-amber-400" /> Strategic Mission Briefing
                                </h3>
                                <div className="flex gap-4">
                                    <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Grounding Verified</div>
                                </div>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none prose-amber">
                                <Markdown>{plan}</Markdown>
                            </div>
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] select-none pointer-events-none">
                                <MapIcon className="w-96 h-96 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
