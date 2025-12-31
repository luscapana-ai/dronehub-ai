
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './features/Chatbot/Chatbot';
import { Dronepedia } from './features/Dronepedia/Dronepedia';
import { FieldNotes } from './features/FieldNotes/FieldNotes';
import { DeepAnalysis } from './features/DeepAnalysis/DeepAnalysis';
import { Regulations } from './features/Regulations/Regulations';
import { FlightLog } from './features/FlightLog/FlightLog';
import { Tips } from './features/Tips/Tips';
import { Marketplace } from './features/Marketplace/Marketplace';
import { Hangar } from './features/Hangar/Hangar';
import { MissionControl } from './features/MissionControl/MissionControl';
import { FlightAcademy } from './features/FlightAcademy/FlightAcademy';
import { Dashboard } from './features/Dashboard/Dashboard';
import { ImageStudio } from './features/ImageStudio/ImageStudio';
import { DroneGame } from './features/DroneGame/DroneGame';
import { Community } from './features/Community/Community';
import { 
    Feather, Bot, Search, BrainCircuit, ShieldCheck, 
    Activity, Lightbulb, ShoppingBag, Layers, 
    Map as MapIcon, Gamepad, LayoutDashboard, 
    Image, Video, Users, Zap
} from './components/Icons';
import type { ChatMessage } from './types';

export type Feature = 
    | 'Dashboard' | 'Chatbot' | 'Dronepedia' | 'FieldNotes' 
    | 'DeepAnalysis' | 'Regulations' | 'FlightLog' | 'Tips' 
    | 'Marketplace' | 'Hangar' | 'MissionControl' | 'FlightAcademy'
    | 'ImageStudio' | 'DroneGame' | 'Community';

const features: { name: Feature; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Chatbot', icon: Bot },
    { name: 'Hangar', icon: Layers },
    { name: 'MissionControl', icon: MapIcon },
    { name: 'FlightAcademy', icon: Gamepad },
    { name: 'DroneGame', icon: Zap },
    { name: 'ImageStudio', icon: Image },
    { name: 'Dronepedia', icon: Search },
    { name: 'FlightLog', icon: Activity },
    { name: 'Community', icon: Users },
    { name: 'Marketplace', icon: ShoppingBag },
    { name: 'Regulations', icon: ShieldCheck },
    { name: 'DeepAnalysis', icon: BrainCircuit },
    { name: 'FieldNotes', icon: Feather },
    { name: 'Tips', icon: Lightbulb },
];

export default function App() {
    const [activeFeature, setActiveFeature] = useState<Feature>('Dashboard');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    const renderFeature = useCallback(() => {
        switch (activeFeature) {
            case 'Dashboard':
                return <Dashboard setActiveFeature={setActiveFeature} />;
            case 'Chatbot':
                return <Chatbot history={chatHistory} setHistory={setChatHistory} />;
            case 'Hangar':
                return <Hangar setActiveFeature={setActiveFeature} />;
            case 'MissionControl':
                return <MissionControl />;
            case 'FlightAcademy':
                return <FlightAcademy />;
            case 'DroneGame':
                return <DroneGame />;
            case 'ImageStudio':
                return <ImageStudio />;
            case 'Community':
                return <Community />;
            case 'Dronepedia':
                return <Dronepedia setActiveFeature={setActiveFeature} setChatHistory={setChatHistory} />;
            case 'FieldNotes':
                return <FieldNotes />;
            case 'DeepAnalysis':
                return <DeepAnalysis />;
            case 'Regulations':
                return <Regulations />;
            case 'FlightLog':
                return <FlightLog />;
            case 'Tips':
                return <Tips />;
            case 'Marketplace':
                return <Marketplace />;
            default:
                return <Dashboard setActiveFeature={setActiveFeature} />;
        }
    }, [activeFeature, chatHistory]);

    return (
        <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans selection:bg-amber-500/30">
            <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} features={features} />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Global Gold/Cyan Glow */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                <header className="bg-gray-900/40 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between shadow-2xl z-20">
                     <div className="flex items-center">
                        <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-2 rounded-lg mr-3 shadow-lg shadow-amber-500/20">
                            <Feather className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                            DroneHub <span className="text-amber-400">AI</span>
                            <span className="ml-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-black text-amber-500 not-italic align-middle">v1.0 GOLD</span>
                        </h1>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-2 bg-gray-900/60 border border-gray-800 px-4 py-2 rounded-2xl">
                            <Search className="w-3 h-3 text-gray-500" />
                            <input type="text" placeholder="Global Sector Search..." className="bg-transparent text-[10px] font-bold text-gray-400 focus:outline-none w-48 uppercase tracking-tight" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col items-end">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Status</p>
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-tight">Production Gold</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        </div>
                     </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar z-10">
                    {renderFeature()}
                </div>
            </main>
        </div>
    );
}
