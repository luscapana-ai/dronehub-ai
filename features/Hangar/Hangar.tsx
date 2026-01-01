
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { 
    Layers, Activity, Trash, PlusCircle, X, 
    ShieldCheck, AlertCircle, 
    Clock, Zap, Cpu, BrainCircuit, Tag, Battery, Settings as ToolIcon
} from '../../components/Icons';
import { generateChatResponse } from '../../services/geminiService';
import { Spinner } from '../../components/ui/Spinner';
import type { Feature } from '../../App';
import Markdown from 'react-markdown';

type DroneClass = 'FPV Racing' | 'Cinematic' | 'Industrial' | 'Long Range';

interface BatteryPack {
    id: string;
    label: string;
    cycles: number;
    health: number;
    resistance: number; 
}

interface FieldTool {
    id: string;
    name: string;
    type: 'Hardware' | 'Electronic' | 'Support';
    status: 'Operational' | 'Requires Service';
}

interface DroneAsset {
    id: string;
    model: string;
    nickname: string;
    droneClass: DroneClass;
    integrity: number; 
    flightHours: number;
    status: 'Ready' | 'Maintenance' | 'Damaged' | 'In Flight';
    componentStress: {
        props: number;
        esc: number;
        motors: number;
    };
}

const STORAGE_KEY = 'drone_hub_fleet';
const BATTERY_KEY = 'drone_hub_batteries';
const TOOL_KEY = 'drone_hub_tools';

export const Hangar: React.FC<{ setActiveFeature: (feature: Feature) => void }> = ({ setActiveFeature }) => {
    const [view, setView] = useState<'Fleet' | 'Batteries' | 'Tools'>('Fleet');
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
    const [tools, setTools] = useState<FieldTool[]>(() => {
        const saved = localStorage.getItem(TOOL_KEY);
        return saved ? JSON.parse(saved) : [
            { id: 't1', name: 'TS101 Soldering Iron', type: 'Electronic', status: 'Operational' },
            { id: 't2', name: 'MIP Metric Set', type: 'Hardware', status: 'Operational' }
        ];
    });

    const [isAddingTool, setIsAddingTool] = useState(false);
    const [newToolName, setNewToolName] = useState('');
    const [newToolType, setNewToolType] = useState<'Hardware' | 'Electronic' | 'Support'>('Hardware');
    
    const [auditReport, setAuditReport] = useState<string | null>(null);
    const [isAuditLoading, setIsAuditLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fleet));
        localStorage.setItem(BATTERY_KEY, JSON.stringify(batteries));
        localStorage.setItem(TOOL_KEY, JSON.stringify(tools));
    }, [fleet, batteries, tools]);

    const handleAddTool = () => {
        if (!newToolName.trim()) return;
        setTools([...tools, { id: `t-${Date.now()}`, name: newToolName, type: newToolType, status: 'Operational' }]);
        setNewToolName('');
        setIsAddingTool(false);
    };

    const runFleetAudit = async () => {
        if (fleet.length === 0) return;
        setIsAuditLoading(true);
        try {
            const summary = fleet.map(d => `${d.nickname}: ${d.integrity}% integrity, ${d.flightHours}h airtime.`).join('\n');
            const response = await generateChatResponse([], `Senior Engineer Audit: \n${summary}\nSuggest critical component replacements.`, 'gemini-3-pro-preview', true);
            setAuditReport(response.text);
        } catch (e) {
            setAuditReport("Audit failed.");
        } finally {
            setIsAuditLoading(false);
        }
    };

    const StressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                <span className="text-gray-500">{label}</span>
                <span className={color}>{value}%</span>
            </div>
            <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className={`h-full ${color.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-fade-in">
            <div className="flex gap-4 justify-center bg-gray-900/60 p-2 rounded-[3rem] w-fit mx-auto border border-white/5 backdrop-blur-2xl shadow-2xl">
                {['Fleet', 'Batteries', 'Tools'].map((v) => (
                    <button 
                        key={v}
                        onClick={() => setView(v as any)}
                        className={`px-10 py-4 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] transition-all ${view === v ? 'bg-amber-600 text-white shadow-xl shadow-amber-900/40' : 'text-gray-500 hover:text-white'}`}
                    >
                        {v}
                    </button>
                ))}
            </div>

            {view === 'Fleet' && (
                <div className="space-y-10">
                    <div className="flex justify-between items-center bg-gray-800/20 p-8 rounded-[3rem] border border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-inner">
                                <Layers className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Tactical Fleet</h2>
                        </div>
                        <Button onClick={runFleetAudit} disabled={isAuditLoading} className="px-8 py-4 bg-gray-900 border border-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            {isAuditLoading ? <Spinner /> : <><BrainCircuit className="w-4 h-4 mr-2" /> Execute Audit</>}
                        </Button>
                    </div>

                    {auditReport && (
                        <div className="bg-gray-800/40 p-10 rounded-[3rem] border border-amber-500/30 animate-fade-in shadow-2xl">
                            <div className="flex justify-between mb-6">
                                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Engineering Report</h3>
                                <button onClick={() => setAuditReport(null)}><X className="w-5 h-5 text-gray-500 hover:text-white"/></button>
                            </div>
                            <div className="prose prose-invert prose-amber max-w-none bg-gray-900/50 p-8 rounded-[2rem] shadow-inner">
                                <Markdown>{auditReport}</Markdown>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {fleet.map(drone => (
                            <div key={drone.id} className="bg-gray-800/20 rounded-[3rem] border border-white/5 p-8 flex flex-col gap-6 hover:border-cyan-500/30 transition-all shadow-xl group">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic group-hover:text-cyan-400 transition-colors">{drone.nickname}</h3>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${drone.status === 'Ready' ? 'text-emerald-400 border-emerald-500/20' : 'text-amber-400 border-amber-500/20'}`}>
                                        {drone.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-inner">
                                        <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Total Airtime</p>
                                        <p className="text-xl font-black text-white leading-none">{drone.flightHours}h</p>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-inner">
                                        <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Hull Integrity</p>
                                        <p className="text-xl font-black text-white leading-none">{drone.integrity}%</p>
                                    </div>
                                </div>

                                <div className="bg-gray-900/30 p-6 rounded-[2rem] border border-white/5 space-y-4">
                                    <StressBar label="Prop Fatigue" value={drone.componentStress?.props || 40} color="text-amber-400" />
                                    <StressBar label="Motor Bearings" value={drone.componentStress?.motors || 25} color="text-cyan-400" />
                                    <StressBar label="ESC Thermal Scan" value={drone.componentStress?.esc || 10} color="text-emerald-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'Tools' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tools.map(tool => (
                        <div key={tool.id} className="bg-gray-800/20 p-8 rounded-[3rem] border border-white/5 flex flex-col gap-6 shadow-xl relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-gray-900 rounded-2xl border border-gray-700">
                                    <ToolIcon className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${tool.status === 'Operational' ? 'text-emerald-400 border-emerald-500/10' : 'text-red-400 border-red-500/10'}`}>
                                    {tool.status}
                                </span>
                            </div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">{tool.name}</h4>
                        </div>
                    ))}
                    <button onClick={() => setIsAddingTool(true)} className="bg-gray-900/20 p-10 rounded-[3rem] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-4 text-gray-600 hover:text-amber-500 hover:border-amber-500 transition-all group">
                        <PlusCircle className="w-12 h-12 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Commission Tooling</span>
                    </button>
                </div>
            )}

            {isAddingTool && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
                    <div className="bg-[#0a0a0c] w-full max-w-lg rounded-[4rem] border border-white/5 shadow-3xl p-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Tool Inventory</h3>
                            <button onClick={() => setIsAddingTool(false)} className="p-4 bg-gray-800 rounded-3xl text-white"><X className="w-6 h-6"/></button>
                        </div>
                        <div className="space-y-6">
                            <input type="text" value={newToolName} onChange={e => setNewToolName(e.target.value)} placeholder="Hardware Model..." className="w-full p-6 bg-gray-900 border border-gray-800 rounded-3xl text-white font-black uppercase tracking-tight focus:ring-1 focus:ring-amber-500 outline-none" />
                            <div className="grid grid-cols-3 gap-2">
                                {(['Hardware', 'Electronic', 'Support'] as const).map(t => (
                                    <button key={t} onClick={() => setNewToolType(t)} className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${newToolType === t ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>{t}</button>
                                ))}
                            </div>
                            <Button onClick={handleAddTool} className="w-full py-7 bg-amber-600 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl">Verify & Commit</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
