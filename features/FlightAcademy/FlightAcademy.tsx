
import React, { useState, useEffect } from 'react';
import { generateVideoFromText, checkVideoOperationStatus } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Gamepad, Play, Video, Activity, Zap, ShieldCheck, X } from '../../components/Icons';
import { useApiKeyCheck } from '../../hooks/useApiKeyCheck';
import { ApiKeyPrompt } from '../ApiKeyPrompt';
import type { VeoState } from '../../types';
import Markdown from 'react-markdown';

interface Tactic {
    id: string;
    name: string;
    category: 'Cinematic' | 'Freestyle' | 'Racing';
    difficulty: 'Basic' | 'Advanced' | 'Elite';
    description: string;
    stickInput: string;
    stressLevel: number; // 1-10
}

const ACADEMY_LIBRARY: Tactic[] = [
    { id: 't1', name: 'Power Loop', category: 'Freestyle', difficulty: 'Advanced', description: 'A massive 360-degree vertical loop.', stickInput: 'Pitch up hard at speed, cut throttle at peak, pitch back.', stressLevel: 7 },
    { id: 't2', name: 'Split-S', category: 'Freestyle', difficulty: 'Basic', description: 'A 180 dive to reverse direction.', stickInput: 'Roll 180, pull pitch back while cutting throttle.', stressLevel: 4 },
    { id: 't3', name: 'Orbit Reveal', category: 'Cinematic', difficulty: 'Basic', description: 'Rotate around subject while slowly rising.', stickInput: 'Yaw right while rolling left, gentle throttle up.', stressLevel: 2 },
    { id: 't4', name: 'Matty Flip', category: 'Freestyle', difficulty: 'Elite', description: 'Backward inverted loop over an obstacle.', stickInput: 'Pitch back under object, throttle punch into roll.', stressLevel: 9 }
];

export const FlightAcademy: React.FC = () => {
    const [activeTactic, setActiveTactic] = useState<Tactic | null>(null);
    const [veoState, setVeoState] = useState<VeoState>({ status: 'idle', message: '' });
    const { isKeyReady, isChecking, promptForKey, handleApiError } = useApiKeyCheck();

    const handleGenerateDemo = async (tactic: Tactic) => {
        if (!isKeyReady) return;
        setVeoState({ status: 'generating', message: "Rendering Technique Demo..." });

        try {
            const prompt = `A first-person view (FPV) drone performing a perfect ${tactic.name} maneuver, smooth cinematic flight, 4k.`;
            let operation = await generateVideoFromText(prompt, '16:9');
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await checkVideoOperationStatus(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                setVeoState({ status: 'success', message: 'Simulation Complete', videoUrl });
            }
        } catch (err) {
            handleApiError(err);
            setVeoState({ status: 'error', message: 'Simulation Failed' });
        }
    };

    if (isChecking) return <Spinner text="Loading Academy..." />;
    if (!isKeyReady) return <ApiKeyPrompt onSelectKey={promptForKey} featureName="Flight Academy Demos" />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
            <div className="text-center">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Flight Academy</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2">Tactical Maneuver Mastery</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {ACADEMY_LIBRARY.map(t => (
                    <button 
                        key={t.id}
                        onClick={() => { setActiveTactic(t); setVeoState({ status: 'idle', message: '' }); }}
                        className={`group bg-gray-800/40 p-8 rounded-[3rem] border transition-all text-left flex flex-col gap-6 hover:border-cyan-500 shadow-xl ${activeTactic?.id === t.id ? 'border-cyan-500 bg-cyan-500/5' : 'border-gray-800'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-2xl bg-gray-900 group-hover:bg-cyan-500/10 transition-colors ${activeTactic?.id === t.id ? 'text-cyan-400' : 'text-gray-600'}`}>
                                <Gamepad className="w-6 h-6" />
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${
                                t.difficulty === 'Elite' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                t.difficulty === 'Advanced' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                            }`}>
                                {t.difficulty}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{t.name}</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2">{t.category}</p>
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-cyan-400" />
                                <span className="text-[9px] font-black text-gray-400 uppercase">Stress: {t.stressLevel}/10</span>
                            </div>
                            <Play className="w-4 h-4 text-gray-700 group-hover:text-cyan-400 transition-colors" />
                        </div>
                    </button>
                ))}
            </div>

            {activeTactic && (
                <div className="bg-gray-800/60 p-12 rounded-[4rem] border border-gray-800 shadow-3xl animate-fade-in relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">{activeTactic.name}</h3>
                                <p className="text-[10px] text-cyan-400 uppercase font-black tracking-widest mt-2 italic">Classified Technique: {activeTactic.difficulty}</p>
                            </div>
                            <button onClick={() => setActiveTactic(null)} className="p-4 bg-gray-700 rounded-3xl text-white hover:bg-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-900/50 p-8 rounded-[2.5rem] border border-gray-700/50">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Mission Profile</h4>
                                <p className="text-sm text-gray-300 leading-relaxed italic">"{activeTactic.description}"</p>
                            </div>

                            <div className="bg-cyan-500/5 p-8 rounded-[2.5rem] border border-cyan-500/10">
                                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Stick Telemetry (Input)
                                </h4>
                                <p className="text-sm text-white font-black leading-relaxed tracking-tight">{activeTactic.stickInput}</p>
                            </div>
                        </div>

                        <Button 
                            onClick={() => handleGenerateDemo(activeTactic)} 
                            disabled={veoState.status === 'generating'}
                            className="w-full py-7 rounded-[2rem] bg-cyan-600 font-black uppercase tracking-[0.4em] shadow-xl shadow-cyan-900/20"
                        >
                            {veoState.status === 'generating' ? <Spinner text="Rendering Tactical Demo..." /> : <><Video className="w-5 h-5 mr-3" /> Execute AI Simulation</>}
                        </Button>
                    </div>

                    <div className="bg-gray-900 rounded-[3rem] border border-gray-700/50 overflow-hidden relative min-h-[400px] flex items-center justify-center">
                        {veoState.status === 'success' && veoState.videoUrl ? (
                            <video src={veoState.videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                        ) : veoState.status === 'generating' ? (
                            <div className="text-center space-y-4">
                                <Spinner text={veoState.message} />
                            </div>
                        ) : (
                            <div className="text-center opacity-20 space-y-4">
                                <Play className="w-20 h-20 mx-auto" />
                                <p className="text-xs font-black uppercase tracking-widest">Awaiting Simulation Uplink</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
