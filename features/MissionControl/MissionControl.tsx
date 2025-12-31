
import React, { useState } from 'react';
import { generateGroundedResponse } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Map as MapIcon, Search, AlertCircle, Wind, Activity, Key, Send, X } from '../../components/Icons';
import Markdown from 'react-markdown';

export const MissionControl: React.FC = () => {
    const [location, setLocation] = useState('');
    const [missionType, setMissionType] = useState('Cinematic Survey');
    const [plan, setPlan] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;

        setIsLoading(true);
        setError(null);
        setPlan(null);

        try {
            const prompt = `
                Act as a professional drone mission commander. 
                Generate a tactical flight plan for a "${missionType}" at "${location}".
                
                Use Google Maps and Search to:
                1. Identify terrain hazards and high-value landmarks.
                2. Suggest 5 optimal waypoints (Lat/Lng or descriptions).
                3. Calculate expected environmental risks (Wind/Obstacles).
                4. Provide a "Go/No-Go" safety assessment based on local regulations.
                
                Format as a structured tactical report in Markdown.
            `;

            const response = await generateGroundedResponse(prompt, 'googleSearch');
            setPlan(response.text);
        } catch (err) {
            console.error("Mission planning failed:", err);
            setError("Failed to generate mission plan. Please verify location data.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Mission Command</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">AI-Optimized Tactical Flight Planning</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleGeneratePlan} className="bg-gray-800/40 p-8 rounded-[3rem] border border-gray-800 shadow-2xl backdrop-blur-md space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Operational Area</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Site Name or Coordinates..."
                                    className="w-full p-5 pl-12 bg-gray-900 border border-gray-700 rounded-3xl text-white font-bold text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Mission Objective</label>
                            <select 
                                value={missionType}
                                onChange={(e) => setMissionType(e.target.value)}
                                className="w-full p-5 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black text-xs appearance-none focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                            >
                                <option>Cinematic Survey</option>
                                <option>3D Mapping</option>
                                <option>Infrastructure Inspection</option>
                                <option>Search & Rescue Sim</option>
                                <option>Agriculture Spraying</option>
                            </select>
                        </div>

                        <Button type="submit" disabled={isLoading || !location.trim()} className="w-full py-6 bg-cyan-600 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-cyan-900/30">
                            Deploy Intelligence
                        </Button>
                    </form>

                    <div className="bg-amber-500/5 p-6 rounded-[2.5rem] border border-amber-500/20 flex gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Grounding Note</p>
                            <p className="text-[10px] text-gray-500 leading-relaxed mt-1 italic">"Mission paths are simulated using real-time search data. Always conduct a visual site sweep before arming motors."</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-gray-800/40 rounded-[4rem] border border-gray-800 p-10 min-h-[600px] shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none pointer-events-none">
                        <MapIcon className="w-64 h-64 text-white" />
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-700/50 pb-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Tactical Report</h3>
                            {plan && (
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="px-4 py-2 rounded-xl text-[9px] font-black uppercase"><Wind className="w-3.5 h-3.5 mr-2" /> Weather</Button>
                                    <Button variant="secondary" onClick={() => setPlan(null)} className="px-3 py-2 rounded-xl"><X className="w-4 h-4" /></Button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-6">
                                    <Spinner />
                                    <div className="text-center">
                                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Calculating Trajectories</p>
                                        <p className="text-gray-500 text-[9px] uppercase tracking-widest mt-2">Checking GPS Grounding & TFRs...</p>
                                    </div>
                                </div>
                            ) : plan ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <Markdown>{plan}</Markdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                    <MapIcon className="w-16 h-16 text-gray-500" />
                                    <div>
                                        <p className="text-white font-black uppercase tracking-widest text-xs">Waiting for Intel Coordinates</p>
                                        <p className="text-gray-500 text-[9px] uppercase tracking-widest mt-1">Select location and mission type to begin uplink</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
