
import React, { useState, useCallback, useEffect } from 'react';
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
import { Feather, Bot, Search, BrainCircuit, ShieldCheck, Activity, Lightbulb, ShoppingBag, Layers, Map as MapIcon } from './components/Icons';
import type { ChatMessage } from './types';

export type Feature = 'Chatbot' | 'Dronepedia' | 'FieldNotes' | 'DeepAnalysis' | 'Regulations' | 'FlightLog' | 'Tips' | 'Marketplace' | 'Hangar' | 'MissionControl';

const features: { name: Feature; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Chatbot', icon: Bot },
    { name: 'Hangar', icon: Layers },
    { name: 'MissionControl', icon: MapIcon },
    { name: 'Dronepedia', icon: Search },
    { name: 'FieldNotes', icon: Feather },
    { name: 'FlightLog', icon: Activity },
    { name: 'Marketplace', icon: ShoppingBag },
    { name: 'DeepAnalysis', icon: BrainCircuit },
    { name: 'Regulations', icon: ShieldCheck },
    { name: 'Tips', icon: Lightbulb },
];

export default function App() {
    const [activeFeature, setActiveFeature] = useState<Feature>('Chatbot');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    const renderFeature = useCallback(() => {
        switch (activeFeature) {
            case 'Chatbot':
                return <Chatbot history={chatHistory} setHistory={setChatHistory} />;
            case 'Hangar':
                return <Hangar setActiveFeature={setActiveFeature} />;
            case 'MissionControl':
                return <MissionControl />;
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
                return <Chatbot history={chatHistory} setHistory={setChatHistory} />;
        }
    }, [activeFeature, chatHistory]);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
            <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} features={features} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between shadow-md">
                     <div className="flex items-center">
                        <Feather className="w-8 h-8 text-cyan-400 mr-3" />
                        <h1 className="text-xl font-bold text-white tracking-tighter uppercase italic">DroneHub <span className="text-cyan-400">AI</span></h1>
                     </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    {renderFeature()}
                </div>
            </main>
        </div>
    );
}
