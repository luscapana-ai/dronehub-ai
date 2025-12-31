
import React, { useState } from 'react';
import { generateGroundedResponse, generateChatResponse } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Send, Link, Bot, Search, Calendar, Filter, Gamepad, X, Activity, ShieldCheck, Lightbulb, Trash, Truck, Shield } from '../../components/Icons';
import Markdown from 'react-markdown';
import type { ChatMessage, GroundingSource } from '../../types';
import type { Feature } from '../../App';

const TRENDS_TOPICS = [
    'AI-Powered Autonomous Swarms',
    'Hydrogen Fuel Cell Drones',
    'Remote ID Implementation Trends',
    'Solid-State Battery Breakthroughs',
    'Urban Air Mobility (UAM) Progress',
    'Agriculture 4.0: Drone Analytics',
    'Next-Gen FPV Digital Protocols',
    'Drone-in-a-Box Solutions',
    'Green Energy Infrastructure Inspection',
    'Advanced Collision Avoidance AI'
];

const INSURANCE_LOGISTICS_TOPICS = [
    'Hull Insurance vs Liability',
    'Commercial vs Recreational Insurance',
    'Shipping LiPo Batteries (Regulations)',
    'International Drone Travel Laws',
    'ATA Carnet for Gear Transport',
    'Packaging High-Value Gear',
    'Escrow Service Benefits',
    'Customs & Duties for Importers',
    'Safe Handling of Fire Hazards',
    'Drone Fleet Insurance Plans'
];

const TACTICS = [
    '3D Mapping & Modeling',
    'Active Track / Follow Me',
    'Cinematic Panning',
    'Creeping Line Ahead (SAR)',
    'Crop Spraying Patterns',
    'Dolly Zoom (Vertigo Effect)',
    'Drone Jib/Crane Shot',
    'Dronie Shot',
    'Expanding Square Search (SAR)',
    'FPV Dive',
    'FPV Matty Flip',
    'FPV Orbit',
    'FPV Power Loop',
    'FPV Rubiks Cube',
    'FPV Split-S Maneuver',
    'FPV Trippy Spin',
    'HDR Bracketing',
    'Hyperlapse Video',
    'Lidar Scanning',
    'Long-Exposure Photography',
    'ND Filter Usage',
    'Orbit Mode',
    'Panorama Stitching',
    'Photogrammetry Overlap',
    'Point of Interest (POI) Lock',
    'Reveal Shot',
    'Structure Inspection (Vertical)',
    'Thermal Inspection Patterns',
    'Top-Down / Bird\'s Eye View',
    'Tripod Mode / Cine Mode',
    'Waypoint Navigation',
];

const GEAR_TOPICS = [
    'Analog vs Digital FPV Latency',
    'Antenna Connectors (SMA/RP-SMA/MMCX)',
    'Box Goggles vs Low-Profile Goggles',
    'Controller Form Factors (Gamepad vs Full-Size)',
    'Crossfire vs ExpressLRS (ELRS)',
    'DJI O3 vs Air Unit vs Vista',
    'EdgeTX vs OpenTX Firmware',
    'ELRS Packet Rates (150Hz vs 500Hz)',
    'Gimbal Mechanics (Hall Effect vs Potentiometer)',
    'Gimbal Stick Ends & Grip Types',
    'HDZero System Overview',
    'Head Tracking Configuration',
    'Long Range RF (900MHz vs 2.4GHz)',
    'Multiprotocol Modules (4-in-1)',
    'Patch vs Omni Antennas',
    'Radio Battery Mods (Li-ion 18650)',
    'Receiver Binding Methods',
    'Simulator Wireless Dongles',
    'Video Receiver Modules (RapidFire vs Fusion)',
    'Walksnail Avatar System'
];

const MAINTENANCE_TOPICS = [
    'Battery Connector (XT60) Wear',
    'Battery Storage Voltage (3.8V/cell)',
    'Brushless Motor Cleaning',
    'Carbon Fiber Frame Delamination',
    'Conformal Coating Inspection',
    'Crash Damage Assessment',
    'ESC & Flight Controller Diagnostics',
    'Firmware Updates (Betaflight/DJI)',
    'Gimbal Calibration & Care',
    'Lens Cleaning & Sensor Protection',
    'Long-Term Storage Prep',
    'Motor Bearing Lubrication',
    'Post-Flight Cleaning Routine',
    'Pre-Flight Checklist',
    'Propeller Balancing',
    'Propeller Inspection (Stress Marks)',
    'Receiver Antenna Integrity',
    'Screw Tightening (Loctite Check)',
    'Soldering Joint Inspection',
    'Troubleshooting Video Noise'
];

interface DronepediaProps {
    setActiveFeature: (feature: Feature) => void;
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const Dronepedia: React.FC<DronepediaProps> = ({ setActiveFeature, setChatHistory }) => {
    const [searchPrompt, setSearchPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sources, setSources] = useState<GroundingSource[] | undefined>(undefined);
    const [lastQuery, setLastQuery] = useState('');
    const [topicFilter, setTopicFilter] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchPrompt.trim()) return;
        setLastQuery(searchPrompt);
        await performSearch(searchPrompt);
    };

    const performSearch = async (query: string) => {
        setIsLoading(true);
        setResult(null);
        setSources(undefined);
        try {
            const response = await generateGroundedResponse(query, 'googleSearch');
            setResult(response.text);
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                 const extractedSources = chunks
                    .map((chunk: any) => {
                        if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
                        if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
                        return null;
                    })
                    .filter((s: any) => s !== null) as GroundingSource[];
                setSources(extractedSources);
            }
        } catch (error) {
            console.error("Search failed:", error);
            setResult("Sorry, I encountered an error while searching.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (topic: string, promptTemplate: (t: string) => string) => {
        setSearchPrompt(topic);
        setLastQuery(topic);
        setIsLoading(true);
        setResult(null);
        setSources(undefined);
        try {
            const prompt = promptTemplate(topic);
            const response = await generateChatResponse([], prompt, 'gemini-3-pro-preview');
            setResult(response.text);
        } catch (error) {
             console.error("Generation failed:", error);
             setResult("Sorry, I couldn't generate that information right now.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleTrendClick = (topic: string) => {
        handleGenerate(topic, (t) => `Discuss the future trend: "${t}" in the drone industry.
        Focus on:
        1. **Technology**: How it works and innovations.
        2. **Market Impact**: Which industries are affected.
        3. **Challenges**: Regulatory or technical hurdles.`);
    };

    const handleTacticClick = (tactic: string) => {
        handleGenerate(tactic, (t) => `Explain the drone technique or tactic: "${t}".
        Provide a step-by-step guide on execution, safety, and ideal use cases.`);
    };

    const handleInsuranceClick = (topic: string) => {
        handleGenerate(topic, (t) => `Provide professional drone-related guidance on: "${t}".
        Include:
        1. **Core Concepts**: What is it and why is it important for pilots?
        2. **Legal Requirements**: Is this mandated by law (FAA/EASA)?
        3. **Cost Factors**: What affects pricing or logistics complexity?
        4. **Best Practices**: Professional tips for implementation.`);
    };

    const handleMaintenanceClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as a certified drone technician. Provide a maintenance guide for "${t}".
        Structure with Tools Needed, Step-by-Step Procedure, and Red Flags.`);
    };

    const handleGearClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as an FPV equipment expert. Provide a technical breakdown for "${t}".`);
    };

    const handleDiscussInChat = () => {
        if (!result) return;
        const newHistory: ChatMessage[] = [
            { role: 'user', parts: [{ text: lastQuery }] },
            { role: 'model', parts: [{ text: result }], sources: sources }
        ];
        setChatHistory(prev => [...prev, ...newHistory]);
        setActiveFeature('Chatbot');
    };

    const filterTopics = (topics: string[]) => {
        if (!topicFilter.trim()) return topics;
        return topics.filter(t => t.toLowerCase().includes(topicFilter.toLowerCase()));
    };

    const filteredTrends = filterTopics(TRENDS_TOPICS);
    const filteredInsurance = filterTopics(INSURANCE_LOGISTICS_TOPICS);
    const filteredTactics = filterTopics(TACTICS);
    const filteredMaintenance = filterTopics(MAINTENANCE_TOPICS);
    const filteredGear = filterTopics(GEAR_TOPICS);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
             <div className="text-center">
                <h2 className="text-3xl font-black mb-2 text-white text-glow">Dronepedia Knowledge Hub</h2>
                <p className="text-gray-400">Master every tactic, tool, and technique with AI-grounded intel.</p>
             </div>

            {/* Main Search */}
            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                <div className="relative">
                    <input
                        id="dronepedia-search"
                        type="text"
                        value={searchPrompt}
                        onChange={(e) => setSearchPrompt(e.target.value)}
                        placeholder="Search tactics, equipment, or insurance..."
                        className="w-full p-5 pl-12 pr-36 bg-gray-900 border border-gray-700 rounded-full focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white shadow-2xl"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    
                    {searchPrompt && (
                        <button
                            type="button"
                            onClick={() => setSearchPrompt('')}
                            className="absolute right-28 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    <Button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6 py-2.5">
                        {isLoading ? <Spinner /> : 'Analyze'}
                    </Button>
                </div>
            </form>

            {/* Results Area */}
            {(result || isLoading) && (
                <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 animate-fade-in">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Spinner />
                            <p className="text-cyan-400 font-bold tracking-widest animate-pulse uppercase">Syncing Intel...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="prose prose-invert max-w-none prose-cyan">
                                <Markdown>{result}</Markdown>
                            </div>
                            
                            {sources && sources.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-700">
                                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Grounding Sources:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sources.map((source, idx) => (
                                            <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-cyan-500/30">
                                                <Link className="w-3 h-3 mr-2" />
                                                {source.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleDiscussInChat} variant="secondary" className="text-sm rounded-xl py-3 px-6 uppercase font-black tracking-widest">
                                    <Bot className="w-4 h-4 mr-2 text-cyan-400" />
                                    Deep Dive Chat
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Filter Bar */}
            <div className="max-w-xl mx-auto relative group">
                <input
                    type="text"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    placeholder="Filter topics (e.g. 'Insurance', 'GPS', 'Motor')..."
                    className="w-full p-4 pl-12 bg-gray-900/50 border border-gray-700 rounded-2xl text-sm text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                />
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {/* Tactics */}
                <div className="bg-gray-800/40 p-6 rounded-[2rem] border border-gray-800 hover:border-cyan-500/30 transition-all group shadow-lg">
                    <h3 className="text-lg font-black text-cyan-400 mb-5 flex items-center tracking-tight uppercase">
                        <span className="bg-cyan-500/10 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-transform">🎯</span>
                        Tactics & Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {filteredTactics.map((t) => (
                            <button key={t} onClick={() => handleTacticClick(t)} className="text-[10px] font-bold bg-gray-900/50 hover:bg-cyan-500 hover:text-white text-gray-400 px-3 py-2 rounded-xl transition-all border border-gray-700/50 uppercase tracking-wider">
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Insurance & Logistics */}
                <div className="bg-gray-800/40 p-6 rounded-[2rem] border border-gray-800 hover:border-emerald-500/30 transition-all group shadow-lg">
                    <h3 className="text-lg font-black text-emerald-400 mb-5 flex items-center tracking-tight uppercase">
                        <span className="bg-emerald-500/10 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-transform">🛡️</span>
                        Insurance & Logistics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {filteredInsurance.map((t) => (
                            <button key={t} onClick={() => handleInsuranceClick(t)} className="text-[10px] font-bold bg-gray-900/50 hover:bg-emerald-500 hover:text-white text-gray-400 px-3 py-2 rounded-xl transition-all border border-gray-700/50 uppercase tracking-wider">
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Maintenance */}
                <div className="bg-gray-800/40 p-6 rounded-[2rem] border border-gray-800 hover:border-amber-500/30 transition-all group shadow-lg">
                    <h3 className="text-lg font-black text-amber-400 mb-5 flex items-center tracking-tight uppercase">
                        <span className="bg-amber-500/10 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-transform">🔧</span>
                        Tech Support
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {filteredMaintenance.map((t) => (
                            <button key={t} onClick={() => handleMaintenanceClick(t)} className="text-[10px] font-bold bg-gray-900/50 hover:bg-amber-500 hover:text-white text-gray-400 px-3 py-2 rounded-xl transition-all border border-gray-700/50 uppercase tracking-wider">
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
