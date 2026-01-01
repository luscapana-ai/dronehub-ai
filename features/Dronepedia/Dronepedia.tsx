
import React, { useState, useEffect } from 'react';
import { generateGroundedResponse, generateChatResponse } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Send, Link, Bot, Search, Filter, X, Activity, Zap, ShieldCheck, Clock, Settings, Layers } from '../../components/Icons';
import Markdown from 'react-markdown';
import type { ChatMessage, GroundingSource } from '../../types';
import type { Feature } from '../../App';

const TRENDS_TOPICS = [
    'AI Drone Swarm Defense 2025',
    'Hydrogen Cell Long-Range Flights',
    'Solid State Battery Prototypes',
    'Remote ID 2.0 Global Standards',
    'Urban Air Mobility Infrastructure'
];

const TECHNIQUES = [
    'High-Speed Split-S',
    'Matty Flip Obstacle Clearance',
    'Precision Proximity Orbit',
    'Cinematic Reveal Dolly',
    'Juicy Flick Flow'
];

const TACTICS = [
    'SAR: Expanding Square Pattern',
    'Industrial: Vertical Grid Scans',
    'Agri: Multispectral Field Audit',
    'Security: 24/7 Tethered Watch',
    'Photogrammetry: Nadir/Oblique Mix'
];

const MAINTENANCE_EQUIPMENT = [
    'TS101 Smart Soldering Iron',
    'ISDT 608AC Smart Charger',
    'SmokeStopper Fuse Logic',
    'VIFLY ShortSaver 2',
    'Ethix Tool Kit V3'
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
    const [newsTicker, setNewsTicker] = useState<string>("Initializing Global Intelligence Stream...");

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await generateGroundedResponse("Top 3 drone industry headlines for today. Concise.", "googleSearch");
                setNewsTicker(response.text || "Systems nominal. All links active.");
            } catch (e) {
                setNewsTicker("Sector news unavailable. Local systems online.");
            }
        };
        fetchNews();
    }, []);

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
                        return null;
                    })
                    .filter((s: any) => s !== null) as GroundingSource[];
                setSources(extractedSources);
            }
        } catch (error) {
            setResult("Tactical link offline. Re-syncing...");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopicClick = (topic: string, category: string) => {
        setSearchPrompt(topic);
        setLastQuery(topic);
        if (category === 'Trends' || category === 'Equipment') {
            performSearch(`Provide a deep dive and 2025 specs for: ${topic}`);
        } else {
            handleGenerate(topic, (t) => `Act as an elite drone pilot/engineer. Deep dive into "${t}" as it relates to ${category}. Structure with: Overview, Tactical Advantages, and Step-by-Step Execution.`);
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
            const response = await generateChatResponse([], prompt, 'gemini-3-pro-preview', true);
            setResult(response.text);
        } catch (error) {
             setResult("Logic engine timeout.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleDiscussInChat = () => {
        if (!result) return;
        setChatHistory(prev => [...prev, 
            { role: 'user', parts: [{ text: lastQuery }] },
            { role: 'model', parts: [{ text: result }], sources: sources }
        ]);
        setActiveFeature('Chatbot');
    };

    const filterTopics = (topics: string[]) => topics.filter(t => t.toLowerCase().includes(topicFilter.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
             <div className="text-center space-y-4">
                <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Tactical Manual</h2>
                <div className="bg-amber-500/10 border border-amber-500/20 py-2 px-6 rounded-full inline-block max-w-2xl overflow-hidden">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap animate-pulse">
                        LIVE INTEL: {newsTicker}
                    </p>
                </div>
             </div>

            <form onSubmit={(e) => { e.preventDefault(); performSearch(searchPrompt); }} className="relative max-w-2xl mx-auto group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                <div className="relative">
                    <input
                        type="text"
                        value={searchPrompt}
                        onChange={(e) => setSearchPrompt(e.target.value)}
                        placeholder="Scan tactics, tools, or news..."
                        className="w-full p-6 pl-14 pr-40 bg-gray-900 border border-gray-700 rounded-full focus:ring-2 focus:ring-amber-500 focus:outline-none text-white font-black uppercase tracking-tight shadow-2xl"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <Button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-8 py-3 bg-amber-600 font-black uppercase tracking-widest text-[10px]">
                        {isLoading ? <Spinner /> : 'Analyze'}
                    </Button>
                </div>
            </form>

            {(result || isLoading) && (
                <div className="bg-gray-800/40 backdrop-blur-3xl rounded-[4rem] p-10 shadow-3xl border border-gray-700/50 animate-fade-in">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <Spinner />
                            <p className="text-amber-500 font-black tracking-widest animate-pulse uppercase text-xs">Accessing Mainframe...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="prose prose-invert max-w-none prose-amber bg-gray-900/50 p-10 rounded-[3rem] border border-gray-700/50 shadow-inner">
                                <Markdown>{result}</Markdown>
                            </div>
                            
                            {sources && sources.length > 0 && (
                                <div className="pt-6 border-t border-gray-700/50">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Referenced Uplinks:</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {sources.map((source, idx) => (
                                            <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] font-black bg-gray-800 hover:bg-gray-700 text-amber-400 px-5 py-3 rounded-2xl transition-all border border-gray-700 hover:border-amber-500/30 uppercase tracking-wider">
                                                <Link className="w-3 h-3 mr-2" /> {source.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4">
                                <Button onClick={handleDiscussInChat} variant="secondary" className="px-10 py-5 bg-gray-900 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-white/5">
                                    <Bot className="w-4 h-4 mr-3 text-amber-500" /> Tactical Briefing
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="max-w-xl mx-auto relative group">
                <input
                    type="text"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    placeholder="Filter Manual Sections..."
                    className="w-full p-4 pl-12 bg-gray-900/40 border border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-amber-500 shadow-inner"
                />
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { title: 'Trends', icon: '📈', color: 'text-amber-400', bg: 'bg-amber-500/10', topics: TRENDS_TOPICS },
                    { title: 'Techniques', icon: '🎮', color: 'text-cyan-400', bg: 'bg-cyan-500/10', topics: TECHNIQUES },
                    { title: 'Tactics', icon: '🎯', color: 'text-emerald-400', bg: 'bg-emerald-500/10', topics: TACTICS },
                    { title: 'Equipment', icon: '🔧', color: 'text-purple-400', bg: 'bg-purple-500/10', topics: MAINTENANCE_EQUIPMENT }
                ].map(cat => (
                    <div key={cat.title} className="bg-gray-800/20 p-8 rounded-[3rem] border border-white/5 space-y-6 group hover:border-white/10 transition-all">
                        <h3 className={`text-xs font-black ${cat.color} flex items-center tracking-[0.2em] uppercase`}>
                            <span className={`${cat.bg} p-3 rounded-2xl mr-3 group-hover:scale-110 transition-transform`}>{cat.icon}</span> {cat.title}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {filterTopics(cat.topics).map((t) => (
                                <button key={t} onClick={() => handleTopicClick(t, cat.title)} className="text-left text-[9px] font-black bg-gray-900/50 hover:bg-gray-800 text-gray-400 hover:text-white px-4 py-3 rounded-xl transition-all border border-gray-800 uppercase tracking-widest">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
