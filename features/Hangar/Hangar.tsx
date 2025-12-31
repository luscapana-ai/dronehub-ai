
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
// Fixed: Removed non-existent 'Tool' icon and other unused icons from import list to fix compilation error.
import { Layers, Activity, ShoppingBag, Trash, PlusCircle } from '../../components/Icons';
import type { Feature } from '../../App';

interface DroneAsset {
    id: string;
    model: string;
    nickname: string;
    integrity: number; // 0-100
    flightHours: number;
    lastService: string;
    status: 'Ready' | 'Maintenance' | 'Damaged' | 'In Flight';
    parts: { name: string; health: number }[];
}

const INITIAL_HANGAR: DroneAsset[] = [
    {
        id: 'h1',
        model: 'DJI FPV',
        nickname: 'Nebula-01',
        integrity: 94,
        flightHours: 12.5,
        lastService: '3 days ago',
        status: 'Ready',
        parts: [
            { name: 'Props', health: 85 },
            { name: 'Motors', health: 98 },
            { name: 'Gimbal', health: 100 }
        ]
    },
    {
        id: 'h2',
        model: 'Custom 5" Freestyle',
        nickname: 'StreetRacer',
        integrity: 72,
        flightHours: 45.2,
        lastService: '2 weeks ago',
        status: 'Maintenance',
        parts: [
            { name: 'Props', health: 40 },
            { name: 'Frame', health: 88 },
            { name: 'ESC', health: 65 }
        ]
    }
];

interface HangarProps {
    setActiveFeature: (feature: Feature) => void;
}

export const Hangar: React.FC<HangarProps> = ({ setActiveFeature }) => {
    const [fleet, setFleet] = useState<DroneAsset[]>(INITIAL_HANGAR);

    const getHealthColor = (health: number) => {
        if (health > 85) return 'bg-emerald-500';
        if (health > 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/40 p-8 rounded-[3rem] border border-gray-800 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-cyan-500/10 rounded-3xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <Layers className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Pilot Hangar</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Fleet Management & Maintenance Pipeline</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-900 border border-gray-700">
                        <PlusCircle className="w-4 h-4 mr-2" /> Register Asset
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {fleet.map(drone => (
                    <div key={drone.id} className="group bg-gray-800/40 rounded-[3.5rem] border border-gray-800 p-8 flex flex-col md:flex-row gap-8 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_0_50px_rgba(6,182,212,0.05)] overflow-hidden relative">
                        {/* Status Badge */}
                        <div className={`absolute top-8 right-8 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                            drone.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            drone.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                drone.status === 'Ready' ? 'bg-emerald-500' :
                                drone.status === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'
                            } ${drone.status === 'Ready' ? 'animate-pulse' : ''}`}></span>
                            {drone.status}
                        </div>

                        {/* Visual Icon / Representation */}
                        <div className="w-full md:w-48 aspect-square bg-gray-900 rounded-[2.5rem] flex items-center justify-center relative shadow-inner">
                            <Layers className="w-20 h-20 text-gray-800 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-black text-white/5 uppercase select-none tracking-tighter">Asset</span>
                            </div>
                        </div>

                        {/* Info & Stats */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter leading-none">{drone.nickname}</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{drone.model}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-4 rounded-3xl border border-gray-700/50">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Ops</p>
                                    <p className="text-lg font-black text-white">{drone.flightHours}h</p>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-3xl border border-gray-700/50">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Integrity</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${getHealthColor(drone.integrity)}`} style={{ width: `${drone.integrity}%` }}></div>
                                        </div>
                                        <span className="text-xs font-black text-white">{drone.integrity}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Component Analysis</p>
                                <div className="flex flex-wrap gap-2">
                                    {drone.parts.map(part => (
                                        <div key={part.name} className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl flex items-center gap-3">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{part.name}</span>
                                            <div className={`w-2 h-2 rounded-full ${getHealthColor(part.health)}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button className="flex-1 py-3 bg-cyan-600 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-cyan-900/20">
                                    <Activity className="w-3.5 h-3.5 mr-2" /> Sync Log
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setActiveFeature('Marketplace')}
                                    className="flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Exchange
                                </Button>
                                <Button variant="secondary" className="px-3 py-3 rounded-2xl hover:bg-red-500/10 hover:text-red-400">
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
