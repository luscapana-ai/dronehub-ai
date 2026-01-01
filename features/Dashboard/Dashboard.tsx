
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { 
    Layers, Map as MapIcon, 
    Activity, Wind, Zap, Volume2, Search, Link as LinkIcon
} from '../../components/Icons';
import { generateGroundedResponse, generateSpeech } from '../../services/geminiService';
import type { Feature } from '../../App';

interface DashboardProps {
    setActiveFeature: (feature: Feature) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveFeature }) => {
    const [weatherSummary, setWeatherSummary] = useState<string>('Syncing environment data...');
    const [trendFeed, setTrendFeed] = useState<string>("Scanning global drone news for tactical shifts...");
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const fleet = useMemo(() => {
        const saved = localStorage.getItem('drone_hub_fleet');
        return saved ? JSON.parse(saved) : [];
    }, []);

    const fleetStats = useMemo(() => {
        const total = fleet.length;
        const ready = fleet.filter((d: any) => d.status === 'Ready').length;
        const avgHealth = total > 0 ? Math.round(fleet.reduce((acc: number, d: any) => acc + d.integrity, 0) / total) : 0;
        return { total, ready, avgHealth };
    }, [fleet]);

    const systemEvents = useMemo(() => [
        { id: 1, type: 'status', msg: 'Global Satellite Link: ACTIVE', time: '1m ago' },
        { id: 2, type: 'alert', msg: `${fleetStats.total - fleetStats.ready} Assets require maintenance`, time: '5m ago' },
        { id: 3, type: 'market', msg: 'New listing: DJI Mavic 3 Enterprise', time: '12m ago' }
    ], [fleetStats]);

    useEffect(() => {
        const fetchBriefing = async () => {
            setIsLoadingWeather(true);
            try {
                const weatherResp = await generateGroundedResponse("Give a 1-sentence drone flying weather briefing for Silicon Valley.", "googleSearch");
                setWeatherSummary(weatherResp.text || "Visibility clear.");
                
                const trendResp = await generateGroundedResponse("What is the top drone industry trend for 2025 in one short sentence?", "googleSearch");
                setTrendFeed(trendResp.text || "Industry shift detected in autonomous swarms.");
            } catch (e) {
                setWeatherSummary("Weather intel unavailable.");
            } finally {
                setIsLoadingWeather(false);
            }
        };
        fetchBriefing();
    }, []);

    const handleVoiceBrief = async () => {
        if (isSpeaking) return;
        setIsSpeaking(true);
        try {
            const text = `Command Deck status update. Fleet health is at ${fleetStats.avgHealth} percent. Weather: ${weatherSummary}. Industry trend: ${trendFeed}`;
            const base64Audio = await generateSpeech(text);
            const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
            audio.onended = () => setIsSpeaking(false);
            audio.play();
        } catch (e) {
            setIsSpeaking(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Command Deck</h2>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 flex items-center gap-2">
                             <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                             <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">{trendFeed}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleVoiceBrief}
                        disabled={isSpeaking || isLoadingWeather}
                        className={`bg-cyan-500/10 hover:bg-cyan-500/20 p-4 rounded-3xl border border-cyan-500/20 transition-all group ${isSpeaking ? 'animate-pulse' : ''}`}
                    >
                        <Volume2 className={`w-6 h-6 ${isSpeaking ? 'text-emerald-400' : 'text-cyan-400'} group-hover:scale-110 transition-transform`} />
                    </button>
                    <div className="bg-gray-800/40 px-8 py-4 rounded-[2rem] border border-gray-800 backdrop-blur-xl flex items-center gap-6 shadow-2xl">
                        <div className="flex flex-col">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Local Intel</p>
                            <p className="text-[10px] font-bold text-white max-w-[200px] truncate italic">"{weatherSummary}"</p>
                        </div>
                        {isLoadingWeather ? <Spinner /> : <div className="p-3 bg-emerald-500/10 rounded-2xl"><Wind className="w-5 h-5 text-emerald-400" /></div>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Fleet Overview Card */}
                <div className="lg:col-span-12 bg-gray-800/20 rounded-[4rem] border border-white/5 p-10 shadow-3xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                        <div className="space-y-8 flex-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <Layers className="w-6 h-6 text-cyan-400" /> Active Fleet Status
                            </h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ready for Sortie</p>
                                    <p className="text-5xl font-black text-white tracking-tighter">{fleetStats.ready}<span className="text-lg text-gray-600 ml-2">/ {fleetStats.total}</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Avg. Integrity</p>
                                    <p className="text-5xl font-black text-cyan-400 tracking-tighter">{fleetStats.avgHealth}%</p>
                                </div>
                            </div>
                            <Button onClick={() => setActiveFeature('Hangar')} className="px-10 py-5 bg-cyan-600 rounded-3xl text-[10px] font-black uppercase tracking-widest">
                                Manage Assets
                            </Button>
                        </div>
                        <div className="flex-1 bg-gray-900/40 rounded-[3rem] p-8 border border-white/5 shadow-inner overflow-hidden">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 border-l-2 border-cyan-500 pl-4">System Feed</h4>
                            <div className="space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                                {systemEvents.map(e => (
                                    <div key={e.id} className="flex justify-between items-start border-b border-white/5 pb-3">
                                        <div className="flex gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${e.type === 'alert' ? 'bg-red-500' : e.type === 'market' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                            <p className="text-[10px] font-bold text-gray-300 uppercase leading-tight">{e.msg}</p>
                                        </div>
                                        <span className="text-[8px] font-black text-gray-600 whitespace-nowrap">{e.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Features Grid */}
                <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { name: 'Mission Control', icon: MapIcon, color: 'text-cyan-400', feature: 'MissionControl', desc: 'Tactics Planning' },
                        { name: 'Flight Log', icon: Activity, color: 'text-emerald-400', feature: 'FlightLog', desc: 'Post-Op Audit' },
                        { name: 'Dronepedia', icon: 'Search', color: 'text-amber-400', feature: 'Dronepedia', desc: 'Trends & Intel' },
                        { name: 'Maintenance', icon: 'Tools', color: 'text-purple-400', feature: 'Hangar', desc: 'Gear Health' },
                    ].map((item) => (
                        <button 
                            key={item.name}
                            onClick={() => setActiveFeature(item.feature as Feature)}
                            className="bg-gray-800/20 p-8 rounded-[3rem] border border-white/5 text-left group hover:bg-gray-800/40 hover:border-white/20 transition-all shadow-xl"
                        >
                            <div className={`p-4 bg-gray-900 rounded-2xl mb-6 w-fit group-hover:scale-110 transition-transform ${item.color}`}>
                                {item.icon === 'Search' ? <Search className="w-6 h-6" /> : item.icon === 'Tools' ? <Zap className="w-6 h-6" /> : <item.icon className="w-6 h-6" />}
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tighter">{item.name}</h4>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">{item.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
