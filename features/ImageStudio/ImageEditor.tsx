
import React, { useState, useRef } from 'react';
import { editImage } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Upload, X } from '../../components/Icons';

export const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('Add a retro, vintage filter');
    const [originalImage, setOriginalImage] = useState<{ file: File, url: string } | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImage({ file, url: URL.createObjectURL(file) });
            setEditedImageUrl(null);
            setError(null);
        }
    };
    
    const handleRemoveImage = () => {
        setOriginalImage(null);
        setEditedImageUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !originalImage) return;

        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);

        try {
            const base64 = await fileToBase64(originalImage.file);
            const url = await editImage(prompt, base64, originalImage.file.type);
            setEditedImageUrl(url);
        } catch (err) {
            console.error('Image editing failed:', err);
            setError('Failed to edit image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                    <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Instruction</label>
                    <input
                        id="edit-prompt"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                        placeholder="e.g., Remove the person in the background"
                    />
                </div>
                <div className="pt-0 sm:pt-7">
                    <Button type="submit" disabled={isLoading || !originalImage}>
                        {isLoading ? 'Editing...' : 'Apply Edit'}
                    </Button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 min-h-[300px] p-4 relative">
                    {!originalImage ? (
                        <>
                            <Upload className="w-10 h-10 text-gray-500 mb-2"/>
                            <p className="text-gray-400 mb-3">Upload an image to edit</p>
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                Choose File
                            </Button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </>
                    ) : (
                        <>
                            <img src={originalImage.url} alt="Original" className="max-w-full max-h-full object-contain rounded-md"/>
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-gray-900/60 rounded-full hover:bg-gray-800/80 transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </>
                    )}
                </div>
                <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 min-h-[300px] p-4">
                    {isLoading && <Spinner text="Applying AI edit..."/>}
                    {error && <p className="text-red-400">{error}</p>}
                    {editedImageUrl && <img src={editedImageUrl} alt="Edited drone" className="max-w-full max-h-full object-contain rounded-md"/>}
                    {!isLoading && !error && !editedImageUrl && <p className="text-gray-500">The edited image will appear here.</p>}
                </div>
            </div>
        </div>
    );
};
