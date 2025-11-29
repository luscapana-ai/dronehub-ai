
import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../../services/geminiService';
import { extractFramesFromVideo } from '../../utils/fileUtils';
import { Button } from '../../components/ui/Button';
import { Upload, X, BrainCircuit, Trash } from '../../components/Icons';
import { Spinner } from '../../components/ui/Spinner';
import Markdown from 'react-markdown';

export const FieldNotes: React.FC = () => {
    const [note, setNote] = useState('');
    const [video, setVideo] = useState<{ file: File, url: string } | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideo({ file, url: URL.createObjectURL(file) });
            setAnalysis(null);
            setError(null);
        }
    };

    const handleRemoveVideo = () => {
        if (video) {
            URL.revokeObjectURL(video.url);
        }
        setVideo(null);
        setAnalysis(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear the note, video, and analysis? This action cannot be undone.")) {
            if (video) {
                URL.revokeObjectURL(video.url);
            }
            setVideo(null);
            setNote('');
            setAnalysis(null);
            setError(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSubmit = async () => {
        if (!video) {
            setError("Please upload a video to analyze.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            setLoadingMessage('Processing video frames...');
            const frames = await extractFramesFromVideo(video.file, 15);
            
            setLoadingMessage('Analyzing content...');
            const promptText = note.trim() || "Analyze this video footage and provide a summary of the drone flight, maneuvers, and environment.";
            
            const result = await analyzeVideo(promptText, frames);
            setAnalysis(result);
        } catch (err) {
            console.error("Field note analysis failed:", err);
            setError("Failed to process the entry. Please try again.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
             <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white">Visual Field Notes</h2>
                    <p className="text-gray-400 mt-1">Upload flight footage and add your notes for instant AI analysis.</p>
                </div>
                {(note || video || analysis) && (
                    <Button
                        onClick={handleClearAll}
                        disabled={isLoading}
                        variant="secondary"
                        className="bg-red-900/50 hover:bg-red-800/70 text-red-400 border border-red-800/50 focus:ring-red-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600"
                    >
                        <Trash className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg border border-dashed border-gray-600 p-6 flex flex-col items-center justify-center min-h-[200px] relative">
                        {!video ? (
                            <>
                                <Upload className="w-12 h-12 text-gray-500 mb-4"/>
                                <p className="text-gray-300 font-medium mb-2">Upload Flight Video</p>
                                <p className="text-gray-500 text-sm mb-4 text-center">MP4, WebM, or MOV</p>
                                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                    Select Video
                                </Button>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />
                            </>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-lg overflow-hidden">
                                <video 
                                    src={video.url} 
                                    className="max-h-[250px] w-full object-contain" 
                                    controls 
                                />
                                <button 
                                    onClick={handleRemoveVideo}
                                    className="absolute top-2 right-2 p-2 bg-gray-900/80 text-white rounded-full hover:bg-red-500/80 transition-colors z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-300">Pilot's Log / Instructions</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white resize-none"
                            placeholder="Describe the flight, specific maneuvers to check, or what happened..."
                        />
                    </div>

                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !video} 
                        className="w-full"
                    >
                         {isLoading ? 'Processing...' : (
                            <>
                                <BrainCircuit className="w-5 h-5 mr-2" />
                                Analyze Entry
                            </>
                         )}
                    </Button>
                </div>

                {/* Output Section */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 min-h-[400px] flex flex-col">
                    <div className="p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
                        <h3 className="font-semibold text-white">Analysis Report</h3>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <Spinner />
                                <p className="text-cyan-400 text-sm animate-pulse">{loadingMessage}</p>
                            </div>
                        ) : error ? (
                            <div className="h-full flex items-center justify-center text-red-400">
                                <p>{error}</p>
                            </div>
                        ) : analysis ? (
                            <div className="prose prose-invert max-w-none">
                                <Markdown>{analysis}</Markdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                                <BrainCircuit className="w-12 h-12 opacity-20" />
                                <p>Upload video and text to generate insights</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};