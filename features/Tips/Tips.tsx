
import React, { useState } from 'react';
import { generateChatResponse } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Lightbulb, Send } from '../../components/Icons';
import Markdown from 'react-markdown';

const CATEGORIES = ['General Flying', 'Cinematography', 'FPV Racing', 'Maintenance', 'Safety', 'Battery Care'];

export const Tips: React.FC = () => {
    const [tip, setTip] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [topic, setTopic] = useState('');

    const fetchTip = async (selectedTopic: string) => {
        setIsLoading(true);
        setTip(null);
        try {
            const prompt = `Give me a unique, actionable, professional tip about "${selectedTopic}" for drone pilots. Keep it concise (under 50 words) but useful.`;
            const response = await generateChatResponse([], prompt, 'gemini-2.5-flash');
            setTip(response.text);
        } catch (error) {
            console.error("Failed to get tip", error);
            setTip("Failed to load tip. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomTopic = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) fetchTip(topic);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <Lightbulb className="w-8 h-8 text-yellow-400" />
                    Drone Pro Tips
                </h2>
                <p className="text-gray-400 mt-2">Level up your skills with AI-curated advice.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Quick Categories</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => (
                                <Button key={cat} variant="secondary" onClick={() => fetchTip(cat)} disabled={isLoading} className="text-sm">
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    <form onSubmit={handleCustomTopic} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ask for a specific tip</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Flying over water..."
                                className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <Button type="submit" disabled={isLoading || !topic.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Display */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 flex flex-col items-center justify-center text-center min-h-[300px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Lightbulb className="w-32 h-32 text-yellow-400" />
                    </div>
                    
                    {isLoading ? (
                         <Spinner text="Finding the best advice..." />
                    ) : tip ? (
                        <div className="z-10 animate-fade-in">
                            <h4 className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-4">Pro Tip</h4>
                            <div className="prose prose-xl prose-invert font-serif">
                                <Markdown>{tip}</Markdown>
                            </div>
                        </div>
                    ) : (
                        <div className="z-10 text-gray-500">
                            <p>Select a category or ask for a specific topic to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
