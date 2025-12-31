
import React, { useState } from 'react';
import { getAirspaceInfo } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ShieldCheck, Search, Map as MapIcon, AlertCircle, Shield } from '../../components/Icons';
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
            // Updated call with location logic
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
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="text-center">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Strategic Airspace</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2">Legal Compliance & Tactical Safety</p>
            </div>

            <div className="bg-gray-800/40 p-10 rounded-[4rem] border border-gray-800 shadow-2xl backdrop-blur-md">
                <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-6 mb-12">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6" />
                        <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Identify Sector (e.g. Golden Gate Park, CA)..."
                            className="w-full p-6 pl-14 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black uppercase tracking-tight focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner"
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="md:w-64 py-6 bg-emerald-600 rounded-3xl font-black uppercase tracking-widest text-xs">
                        {isLoading ? <Spinner /> : 'Scan Sector'}
                    </Button>
                </form>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <Spinner text="Consulting Aviation Databases & Local Laws..." />
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200"></div>
                                </div>
                            </div>
                        ) : result ? (
                            <div className="prose prose-invert prose-emerald max-w-none animate-fade-in bg-gray-900/50 p-10 rounded-[3rem] border border-gray-700/50">
                                <Markdown>{result}</Markdown>
                            </div>
                        ) : (
                            <div className="py-20 text-center opacity-20 space-y-6">
                                <ShieldCheck className="w-20 h-20 mx-auto" />
                                <p className="text-sm font-black uppercase tracking-widest">Awaiting Site Scan</p>
                            </div>
                        )}
                    </div>

                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-gray-900/50 p-8 rounded-[3rem] border border-gray-700/50 space-y-6">
                            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-4 leading-none">Ops Advisory</h4>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-gray-800 rounded-xl"><MapIcon className="w-5 h-5 text-gray-500" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">Strategic Buffers</p>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-tight mt-1 leading-relaxed">Grounding AI identifies landing zones and RF interference corridors.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="p-3 bg-gray-800 rounded-xl"><Shield className="w-5 h-5 text-gray-500" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">LAANC Interlink</p>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-tight mt-1 leading-relaxed">Real-time checking for TFRs and special flight rules.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 p-8 rounded-[3rem] border border-amber-500/10">
                            <AlertCircle className="w-8 h-8 text-amber-500 mb-4" />
                            <p className="text-[10px] font-black text-gray-500 leading-relaxed uppercase tracking-tight">
                                Important: Information provided is for reference only. AI grounding can lag official NOTAMs. Pilots retain ultimate responsibility.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
