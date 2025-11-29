
import React, { useState } from 'react';
import { generateChatResponse } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import Markdown from 'react-markdown';
import { BrainCircuit, X } from '../../components/Icons';

export const DeepAnalysis: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Using an empty history for a single-turn deep analysis
            const response = await generateChatResponse([], prompt, 'gemini-3-pro-preview', true);
            setResult(response.text);
        } catch (err) {
            console.error('Deep analysis failed:', err);
            setError('Failed to get deep analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-1 text-white">Deep Analysis</h2>
            <p className="text-gray-400 mb-6">Tackle complex problems with advanced AI reasoning. Ask detailed questions and get comprehensive answers.</p>
            
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex flex-col gap-4">
                    <label htmlFor="deep-prompt" className="block text-sm font-medium text-gray-300">Your Complex Query</label>
                    <div className="relative">
                        <textarea
                            id="deep-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={6}
                            className="w-full p-3 pr-10 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                            placeholder="e.g., Analyze the tactical advantages of using a swarm of autonomous drones for aerial surveillance versus a single high-altitude long-endurance (HALE) drone."
                        />
                        {prompt && (
                            <button
                                type="button"
                                onClick={() => setPrompt('')}
                                className="absolute right-3 top-3 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-600 transition-colors"
                                title="Clear text"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" disabled={isLoading} className="self-start">
                        <BrainCircuit className="w-5 h-5 mr-2" />
                        {isLoading ? 'Thinking...' : 'Analyze'}
                    </Button>
                </div>
            </form>

            <div className="bg-gray-800 rounded-lg border border-gray-700 min-h-[300px] p-6">
                <h3 className="font-semibold text-lg mb-4 text-white">Analysis Result</h3>
                {isLoading && <Spinner text="Performing deep analysis... This may take a moment."/>}
                {error && <p className="text-red-400">{error}</p>}
                {result && (
                    <div className="prose prose-invert max-w-none">
                        <Markdown>{result}</Markdown>
                    </div>
                )}
                {!isLoading && !error && !result && <p className="text-gray-500">The AI's detailed analysis will appear here.</p>}
            </div>
        </div>
    );
};
