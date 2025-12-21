
import React, { useState } from 'react';
import { getAirspaceInfo } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ShieldCheck, Search } from '../../components/Icons';
import Markdown from 'react-markdown';

export const Regulations: React.FC = () => {
    const [location, setLocation] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const info = await getAirspaceInfo(location);
            setResult(info);
        } catch (err) {
            console.error("Failed to check regulations", err);
            setError("Could not retrieve regulations. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    Airspace & Regulations
                </h2>
                <p className="text-gray-400 mt-2">Check local flight rules, airspace class, and temporary restrictions.</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 md:p-8 shadow-xl">
                <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location (e.g., 'Central Park, NYC' or 'Santa Monica Pier')"
                            className="w-full p-3 pl-10 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || !location.trim()} className="md:w-48 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">
                        {isLoading ? 'Checking...' : 'Check Airspace'}
                    </Button>
                </form>

                <div className="min-h-[200px] border-t border-gray-700 pt-6">
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Spinner />
                            <p className="text-emerald-400 font-medium animate-pulse">Consulting aviation maps and local laws...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 py-8">
                            <p>{error}</p>
                        </div>
                    ) : result ? (
                        <div className="prose prose-invert max-w-none">
                            <Markdown>{result}</Markdown>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                            <ShieldCheck className="w-16 h-16 opacity-20 mb-4" />
                            <p>Enter a location to see flight safety information.</p>
                            <p className="text-xs mt-2 text-gray-600">Always follow official FAA/EASA guidelines. This tool uses AI grounding and is for reference only.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
