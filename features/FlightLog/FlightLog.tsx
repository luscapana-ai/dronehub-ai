
import React, { useState } from 'react';
import { analyzeFlightLog } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Activity, FileText } from '../../components/Icons';
import Markdown from 'react-markdown';

export const FlightLog: React.FC = () => {
    const [logData, setLogData] = useState('');
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!logData.trim()) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeFlightLog(logData);
            setAnalysis(result);
        } catch (err) {
            console.error('Flight log analysis failed:', err);
            setError('Failed to analyze log. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasteExample = () => {
        setLogData(`Flight Time: 3:42
Max Throttle: 100%
Avg Cell Voltage: 3.6V (Sagged to 3.2V on punches)
Gyro Noise: High oscillation on Yaw axis above 60% throttle.
Motors: Came down hot to the touch.
Blackbox Header: 
looptime: 8k/8k
dshot: 600
pid_profile: 1 (Betaflight 4.5 defaults)
Note: Drone wobbles during prop wash recovery.`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <Activity className="w-8 h-8 text-cyan-400" />
                    Flight Log Analytics
                </h2>
                <p className="text-gray-400 mt-2">
                    Diagnose tuning issues, battery health, and mechanical problems by pasting your flight notes or Blackbox summary.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-medium text-gray-300">Flight Log Data / Notes</label>
                        <button 
                            type="button" 
                            onClick={handlePasteExample}
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                        >
                            Paste Example
                        </button>
                    </div>
                    <textarea
                        id="flightlog-input"
                        value={logData}
                        onChange={(e) => setLogData(e.target.value)}
                        rows={12}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                        placeholder="Paste your flight observations, Blackbox header info, or PID settings here..."
                    />
                    <Button onClick={handleAnalyze} disabled={isLoading || !logData.trim()} className="w-full">
                         {isLoading ? 'Analyzing Telemetry...' : 'Run Diagnostics'}
                    </Button>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 min-h-[400px] flex flex-col">
                    <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400"/>
                        <h3 className="font-semibold text-white">Engineering Report</h3>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                         {isLoading && (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <Spinner />
                                <p className="text-cyan-400 text-sm animate-pulse">Consulting engineering database...</p>
                            </div>
                        )}
                        {error && <p className="text-red-400">{error}</p>}
                        {analysis && (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <Markdown>{analysis}</Markdown>
                            </div>
                        )}
                        {!isLoading && !error && !analysis && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                                <Activity className="w-12 h-12 opacity-20" />
                                <p className="text-center px-8">Awaiting flight data for analysis.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
