
import React, { useState, useRef } from 'react';
import { analyzeImage } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Upload, X } from '../../components/Icons';
import Markdown from 'react-markdown';

export const ImageAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Identify the drone model and its key components.');
    const [image, setImage] = useState<{ file: File, url: string } | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage({ file, url: URL.createObjectURL(file) });
            setAnalysis(null);
            setError(null);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setAnalysis(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !image) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const base64 = await fileToBase64(image.file);
            const result = await analyzeImage(prompt, base64, image.file.type);
            setAnalysis(result);
        } catch (err) {
            console.error('Image analysis failed:', err);
            setError('Failed to analyze image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
                 <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 min-h-[300px] p-4 relative">
                    {!image ? (
                        <>
                            <Upload className="w-10 h-10 text-gray-500 mb-2"/>
                            <p className="text-gray-400 mb-3">Upload an image to analyze</p>
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                Choose File
                            </Button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </>
                    ) : (
                        <>
                            <img src={image.url} alt="To be analyzed" className="max-w-full max-h-full object-contain rounded-md"/>
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-gray-900/60 rounded-full hover:bg-gray-800/80 transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="analyze-prompt" className="block text-sm font-medium text-gray-300 mb-2">Analysis Prompt</label>
                        <textarea
                            id="analyze-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                            placeholder="e.g., What kind of damage do you see on this propeller?"
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || !image}>
                        {isLoading ? 'Analyzing...' : 'Analyze Image'}
                    </Button>
                </form>
            </div>
            <div className="flex flex-col bg-gray-800 rounded-lg border border-gray-700 min-h-[400px]">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-semibold">AI Analysis</h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    {isLoading && <Spinner text="Analyzing image..."/>}
                    {error && <p className="text-red-400">{error}</p>}
                    {analysis && (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <Markdown>{analysis}</Markdown>
                        </div>
                    )}
                    {!isLoading && !error && !analysis && <p className="text-gray-500">Your image analysis will appear here.</p>}
                </div>
            </div>
        </div>
    );
};
