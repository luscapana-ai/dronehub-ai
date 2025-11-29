
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './features/Chatbot/Chatbot';
import { Dronepedia } from './features/Dronepedia/Dronepedia';
import { FieldNotes } from './features/FieldNotes/FieldNotes';
import { DeepAnalysis } from './features/DeepAnalysis/DeepAnalysis';
import { Community } from './features/Community/Community';
import { FlightLog } from './features/FlightLog/FlightLog';
import { Tutorial } from './features/Tutorial/Tutorial';
import { Feather, Bot, Search, BrainCircuit, Users, Activity, HelpCircle } from './components/Icons';
import type { ChatMessage } from './types';

export type Feature = 'Chatbot' | 'Dronepedia' | 'FieldNotes' | 'DeepAnalysis' | 'Community' | 'FlightLog';

const features: { name: Feature; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Chatbot', icon: Bot },
    { name: 'Dronepedia', icon: Search },
    { name: 'FieldNotes', icon: Feather },
    { name: 'DeepAnalysis', icon: BrainCircuit },
    { name: 'FlightLog', icon: Activity },
    { name: 'Community', icon: Users },
];

export default function App() {
    const [activeFeature, setActiveFeature] = useState<Feature>('Chatbot');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('dronehub_tutorial_seen');
        if (!hasSeenTutorial) {
            setShowTutorial(true);
        }
    }, []);

    const handleCloseTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('dronehub_tutorial_seen', 'true');
        setActiveFeature('Chatbot'); // Reset to default view
    };

    const startTutorial = () => {
        setShowTutorial(true);
    };

    const renderFeature = useCallback(() => {
        switch (activeFeature) {
            case 'Chatbot':
                return <Chatbot history={chatHistory} setHistory={setChatHistory} />;
            case 'Dronepedia':
                return <Dronepedia setActiveFeature={setActiveFeature} setChatHistory={setChatHistory} />;
            case 'FieldNotes':
                return <FieldNotes />;
            case 'DeepAnalysis':
                return <DeepAnalysis />;
            case 'Community':
                return <Community />;
            case 'FlightLog':
                return <FlightLog />;
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
                        <h1 className="text-xl font-bold text-white">DroneHub AI</h1>
                     </div>
                     <button 
                        onClick={startTutorial}
                        className="text-gray-400 hover:text-cyan-400 transition-colors"
                        title="Start Tutorial"
                     >
                        <HelpCircle className="w-6 h-6" />
                     </button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderFeature()}
                </div>
            </main>
            
            {showTutorial && (
                <Tutorial onClose={handleCloseTutorial} setActiveFeature={setActiveFeature} />
            )}
        </div>
    );
}
