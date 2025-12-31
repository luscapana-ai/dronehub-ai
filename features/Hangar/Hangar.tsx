
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { 
    Layers, Activity, ShoppingBag, Trash, PlusCircle, X, 
    ShieldCheck, Activity as ActivityIcon, AlertCircle, 
    CheckCircle2, Clock, Zap, Cpu, Settings, FileText, Search, BrainCircuit, Tag, Battery
} from '../../components/Icons';
import { analyzeFlightLog, generateChatResponse } from '../../services/geminiService';
import { Spinner } from '../../components/ui/Spinner';
import type { Feature } from '../../App';
import Markdown from 'react-markdown';

type DroneClass = 'FPV Racing' | 'Cinematic' | 'Industrial' | 'Long Range';

interface MaintenanceEvent {
    id: string;
    date: string;
    description: string;
    technician: string;
}

interface BatteryPack {
    id: string;
    label: string;
    cycles: number;
    health: number;
    resistance: number; // mOhm
}

interface DroneAsset {
    id: string;
    model: string;
    nickname: string;
    droneClass: DroneClass;
    integrity: number; 
    flightHours: number;
    lastService: string;
    status: 'Ready' | 'Maintenance' | 'Damaged' | 'In Flight';
    parts: { name: string; health: number }[];
    serviceHistory: MaintenanceEvent[];
}

const STORAGE_KEY = 'drone_hub_fleet';
const BATTERY_KEY = 'drone_hub_batteries';

export const Hangar: React.FC<{ setActiveFeature: (feature: Feature) => void }> = ({ setActiveFeature }) => {
    const [view, setView] = useState<'Fleet' | 'Batteries'>('Fleet');
    const [fleet, setFleet] = useState<DroneAsset[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [batteries, setBatteries] = useState<BatteryPack[]>(() => {
        const saved = localStorage.getItem(BATTERY_KEY);
        return saved ? JSON.parse(saved) : [
            { id: 'b1', label: '6S 1300mAh #A1', cycles: 42, health: 88, resistance: 4.2 },
            { id: 'b2', label: '4S 850mAh #C4', cycles: 12, health: 96, resistance: 2.1 }
        ];
    });

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [auditReport, setAuditReport] = useState<string | null>(null);
    const [isAuditLoading, setIsAuditLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fleet));
        localStorage.setItem(BATTERY_KEY, JSON.stringify(batteries));
    }, [fleet, batteries]);

    const fleetStats = useMemo(() => {
        const totalHours = fleet.reduce((acc, d) => acc + d.flightHours, 0);
        const avgIntegrity = Math.round(fleet.reduce((acc, d) => acc + d.integrity, 0) / (fleet.length || 1));
        const maintenanceCount = fleet.filter(d => d.status === 'Maintenance' || d.status === 'Damaged').length;
        const readyCount = fleet.filter(d => d.status === 'Ready').length;
        return { totalHours, avgIntegrity, maintenanceCount, readyCount };
    }, [fleet]);

    const handleCommissionToMarket = (drone: DroneAsset) => {
        const marketDraft = {
            title: `${drone.model} - ${drone.nickname}`,
            description: `Pilot-owned ${drone.droneClass}. Total Flight Time: ${drone.flightHours}h. Verified Integrity: ${drone.integrity}%.`,
            price: Math.max(100, Math.round(500 - (drone.flightHours * 5))),
            weightGrams: 249,
            category: 'Drone'
        };
        localStorage.setItem('market_draft_payload', JSON.stringify(marketDraft));
        setActiveFeature('Marketplace');
    };

    const runFleetAudit = async () => {
        if (fleet.length === 0) return;
        setIsAuditLoading(true);
        try {
            const fleetSummary = fleet.map(d => `${d.nickname} (${d.model}): ${d.integrity}% health, ${d.flightHours}h total.`).join('\n');
            const prompt = `Act as a Senior Drone Engineering Auditor. Analyze this fleet: \n${fleetSummary}\nIdentify risks and schedule maintenance. Use Markdown.`;
            const response = await generateChatResponse([], prompt, 'gemini-3-pro-preview', true);
            setAuditReport(response.text);
        } catch (err) {
            console.error("Audit failed", err);
        } finally {
            setIsAuditLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Navigation Tabs */}
            <div className="flex gap-4 justify-center">
                <button 
                    onClick={() => setView('Fleet')}
                    className={`px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all ${view === 'Fleet' ? 'bg-amber-600 text-white shadow-xl shadow-amber-900/20' : 'bg-gray-800/40 text-gray-500 hover:text-white'}`}
                >
                    Tactical Fleet
                </button>
                <button 
                    onClick={() => setView('Batteries')}
                    className={`px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all ${view === 'Batteries' ? 'bg-amber-600 text-white shadow-xl shadow-amber-900/20' : 'bg-gray-800/40 text-gray-500 hover:text-white'}`}
                >
                    Battery Lab
                </button>
            </div>

            {view === 'Fleet' ? (
                <>
                    <div className="bg-gray-800/40 p-10 rounded-[4rem] border border-gray-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fleet Health</p>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <p className="text-4xl font-black text-white">{fleetStats.avgHealth}%</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Total Airtime</p>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
                                        <Clock className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <p className="text-4xl font-black text-white">{fleetStats.totalHours.toFixed(1)}h</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Maint. Pending</p>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-red-500/10 rounded-3xl border border-red-500/20">
                                        <AlertCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <p className="text-4xl font-black text-white">{fleetStats.maintenanceCount}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Button onClick={() => setShowRegisterModal(true)} className="w-full py-5 bg-amber-600 rounded-3xl font-black uppercase tracking-widest text-xs">
                                    <PlusCircle className="w-4 h-4 mr-3" /> Commission Asset
                                </Button>
                                <Button onClick={runFleetAudit} disabled={isAuditLoading} variant="secondary" className="w-full py-5 bg-gray-900 border border-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-widest">
                                    {isAuditLoading ? <Spinner /> : <><BrainCircuit className="w-4 h-4 mr-3" /> Execute Audit</>}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {auditReport && (
                        <div className="bg-gray-800/60 p-12 rounded-[4rem] border border-gray-700 shadow-3xl animate-fade-in relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Fleet Intel Report</h3>
                                <button onClick={() => setAuditReport(null)} className="p-4 bg-gray-700 rounded-3xl text-white"><X className="w-6 h-6"/></button>
                            </div>
                            <div className="prose prose-invert max-w-none bg-gray-900/50 p-10 rounded-[3rem] border border-gray-700/50 prose-amber">
                                <Markdown>{auditReport}</Markdown>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                        {fleet.map(drone => (
                            <div key={drone.id} className="group bg-gray-800/40 rounded-[4rem] border border-gray-800 p-8 flex flex-col gap-8 hover:border-amber-500 transition-all shadow-xl relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-6">
                                        <div className="p-5 bg-gray-900 rounded-[2rem] border border-gray-700/50">
                                            <Cpu className="w-8 h-8 text-gray-700 group-hover:text-amber-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{drone.nickname}</h3>
                                            <span className="text-[9px] font-black text-amber-400 mt-3 block uppercase">{drone.droneClass}</span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${drone.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                        {drone.status}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-700/50">
                                        <p className="text-[9px] font-black text-gray-600 uppercase mb-2 tracking-widest">Airtime</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">{drone.flightHours.toFixed(1)}h</p>
                                    </div>
                                    <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-700/50">
                                        <p className="text-[9px] font-black text-gray-600 uppercase mb-2 tracking-widest">Hull</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">{drone.integrity}%</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-auto">
                                    <Button className="flex-1 py-5 bg-gray-900 border border-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
                                        <Zap className="w-4 h-4 mr-2" /> Sync
                                    </Button>
                                    <Button onClick={() => handleCommissionToMarket(drone)} variant="secondary" className="flex-1 py-5 bg-gray-900 border border-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-400 transition-all">
                                        <Tag className="w-4 h-4 mr-2" /> Sell
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {batteries.map(pack => (
                        <div key={pack.id} className="bg-gray-800/40 p-8 rounded-[3rem] border border-gray-800 hover:border-amber-500/50 transition-all flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <div className="p-4 bg-gray-900 rounded-2xl border border-gray-700">
                                    <Battery className={`w-6 h-6 ${pack.health > 90 ? 'text-emerald-400' : 'text-amber-400'}`} />
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-white tracking-tighter italic">{pack.label}</p>
                                    <p className="text-[9px] font-black text-gray-500 uppercase">{pack.cycles} Cycles</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Health</p>
                                    <p className="text-2xl font-black text-white">{pack.health}%</p>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Resistance</p>
                                    <p className="text-2xl font-black text-white">{pack.resistance}Ω</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="bg-gray-900/50 p-8 rounded-[3rem] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-amber-400 hover:border-amber-500/50 transition-all">
                        <PlusCircle className="w-10 h-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Register Pack</span>
                    </button>
                </div>
            )}
        </div>
    );
};
