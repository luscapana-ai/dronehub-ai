
import React, { useState, useEffect, useMemo } from 'react';
import { analyzeFlightLog } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Activity, FileText, Zap, Battery, Signal, ShieldCheck, Clock, Trash, X, PlusCircle, AlertCircle } from '../../components/Icons';
import Markdown from 'react-markdown';

interface MissionLog {
    id: string;
    title: string;
    date: string;
    droneNickname: string;
    rawLog: string;
    analysis: string | null;
    status: 'Nominal' | 'Warning' | 'Critical';
    telemetry: {
        vibration: number; 
        batteryHealth: number; 
        linkQuality: number; 
        dataPoints: number[]; // Sparkline data
    };
}

const STORAGE_KEY = 'drone_hub_flight_logs';

const MOCK_LOG_DATA = `Mission: High-Alt Cinematic Sweep
Drone: Nebula-01
Flight Duration: 12m 45s
Max Current Draw: 84A
Battery: 6S 1300mAh (Start: 25.2V, End: 22.1V)
Blackbox Snippet:
PID_P_Yaw: 45 | PID_I_Yaw: 30 | PID_D_Yaw: 2
Noise floor at 140Hz detected on Roll axis.
Prop wash recovery felt sloppy at 40% throttle.`;

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const width = 100;
    const height = 30;
    const max = Math.max(...data, 1);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / max) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 opacity-50">
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinejoin="round" />
        </svg>
    );
};

export const FlightLog: React.FC = () => {
    const [logs, setLogs] = useState<MissionLog[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [activeMission, setActiveMission] = useState<MissionLog | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [newTitle, setNewTitle] = useState('');
    const [newLogText, setNewLogText] = useState('');
    const [newDrone, setNewDrone] = useState('');

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }, [logs]);

    const handleCreateLog = () => {
        const newLog: MissionLog = {
            id: `m-${Date.now()}`,
            title: newTitle || 'Untitled Mission',
            date: new Date().toLocaleDateString(),
            droneNickname: newDrone || 'Unknown Unit',
            rawLog: newLogText,
            analysis: null,
            status: 'Nominal',
            telemetry: {
                vibration: Math.floor(Math.random() * 30),
                batteryHealth: 100,
                linkQuality: 98,
                dataPoints: Array.from({length: 12}, () => Math.floor(Math.random() * 100))
            }
        };
        setLogs([newLog, ...logs]);
        setActiveMission(newLog);
        setIsCreating(false);
        setNewTitle('');
        setNewLogText('');
        setNewDrone('');
    };

    const runAIDiagnostic = async (missionId: string) => {
        const mission = logs.find(m => m.id === missionId);
        if (!mission) return;

        setIsLoading(true);
        try {
            const report = await analyzeFlightLog(mission.rawLog);
            let status: 'Nominal' | 'Warning' | 'Critical' = 'Nominal';
            if (report.toLowerCase().includes('critical')) status = 'Critical';
            else if (report.toLowerCase().includes('warning')) status = 'Warning';

            const updatedLogs = logs.map(m => m.id === missionId ? { ...m, analysis: report, status } : m);
            setLogs(updatedLogs);
            setActiveMission(updatedLogs.find(m => m.id === missionId) || null);
        } catch (err) {
            console.error("AI Sync failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Critical': return 'text-red-400 border-red-500/20 bg-red-500/10';
            case 'Warning': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
            default: return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
        }
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-fade-in pb-20">
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                        <Activity className="w-6 h-6 text-cyan-400" />
                        Mission Archive
                    </h2>
                    <button onClick={() => setIsCreating(true)} className="p-3 bg-cyan-600 rounded-2xl hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20">
                        <PlusCircle className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-[2.5rem] opacity-30">
                            <Clock className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed px-10">Archive Empty.</p>
                        </div>
                    ) : (
                        logs.map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setActiveMission(m)}
                                className={`w-full text-left p-5 rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                                    activeMission?.id === m.id 
                                    ? 'bg-gray-800 border-cyan-500/50 shadow-xl' 
                                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`text-xs font-black uppercase tracking-tight ${activeMission?.id === m.id ? 'text-cyan-400' : 'text-gray-200'}`}>{m.title}</h4>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${getStatusColor(m.status)}`}>{m.status}</span>
                                </div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase">{m.date} • {m.droneNickname}</p>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            <main className="flex-1 bg-gray-800/40 rounded-[4rem] border border-gray-800 p-8 lg:p-12 shadow-3xl relative overflow-hidden flex flex-col min-h-[80vh]">
                {activeMission ? (
                    <div className="relative z-10 flex-1 flex flex-col animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-gray-700/50 pb-8">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{activeMission.title}</h3>
                                <div className="flex gap-4 mt-3">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> {activeMission.date}
                                    </span>
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="w-3 h-3" /> {activeMission.droneNickname}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={() => runAIDiagnostic(activeMission.id)} disabled={isLoading} className="px-8 py-4 bg-cyan-600 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {isLoading ? <Spinner text="Syncing AI..." /> : <><Activity className="w-4 h-4 mr-2" /> Sync AI Logic</>}
                                </Button>
                            </div>
                        </div>

                        {/* Tactical Telemetry Visualizers */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-700/50 relative overflow-hidden group">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Battery className="w-4 h-4 text-emerald-400" /> Voltage Cycle
                                </p>
                                <Sparkline data={activeMission.telemetry.dataPoints} color="#10b981" />
                                <div className="flex items-end gap-3 mt-4">
                                    <span className="text-3xl font-black text-white leading-none">94%</span>
                                    <span className="text-[9px] text-emerald-400 font-bold uppercase mb-1">Stable</span>
                                </div>
                            </div>
                            <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-700/50 relative overflow-hidden group">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-amber-400" /> Vibration FFT
                                </p>
                                <Sparkline data={activeMission.telemetry.dataPoints.map(v => 100 - v)} color="#f59e0b" />
                                <div className="flex items-end gap-3 mt-4">
                                    <span className="text-3xl font-black text-white leading-none">{activeMission.telemetry.vibration}Hz</span>
                                    <span className="text-[9px] text-amber-400 font-bold uppercase mb-1">Low Noise</span>
                                </div>
                            </div>
                            <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-700/50 relative overflow-hidden group">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Signal className="w-4 h-4 text-cyan-400" /> RSSI Logic
                                </p>
                                <Sparkline data={activeMission.telemetry.dataPoints.map(v => v * 0.8 + 20)} color="#06b6d4" />
                                <div className="flex items-end gap-3 mt-4">
                                    <span className="text-3xl font-black text-white leading-none">98%</span>
                                    <span className="text-[9px] text-cyan-400 font-bold uppercase mb-1">Solid Link</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-10">
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-l-4 border-cyan-500 pl-4 uppercase">Telemetry Payload</h4>
                                <div className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-[3rem] p-8 font-mono text-[11px] text-gray-400 leading-relaxed overflow-y-auto custom-scrollbar shadow-inner">
                                    <pre className="whitespace-pre-wrap">{activeMission.rawLog}</pre>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest border-l-4 border-amber-500 pl-4 uppercase">AI Audit</h4>
                                <div className="flex-1 bg-gray-900 border border-gray-700/50 rounded-[3rem] p-10 overflow-y-auto custom-scrollbar shadow-2xl relative">
                                    {!activeMission.analysis ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                            <ShieldCheck className="w-16 h-16 text-gray-500" />
                                            <p className="text-white font-black uppercase tracking-widest text-xs mt-4">Awaiting Uplink</p>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <Markdown>{activeMission.analysis}</Markdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                         <Activity className="w-20 h-20 mb-6" />
                         <p className="text-sm font-black uppercase tracking-[0.3em]">Select a Mission to Analyze</p>
                    </div>
                )}
            </main>
        </div>
    );
};
