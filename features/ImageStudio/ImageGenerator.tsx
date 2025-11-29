
import React, { useState } from 'react';
import { generateImage } from '../../services/geminiService';
import type { AspectRatio, ImageSize } from '../../types';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useApiKeyCheck } from '../../hooks/useApiKeyCheck';
import { ApiKeyPrompt } from '../ApiKeyPrompt';

const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const imageSizes: ImageSize[] = ["1K", "2K", "4K"];

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A futuristic delivery drone flying over a neon city at night');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [imageSize, setImageSize] = useState<ImageSize>('1K');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const { isKeyReady, isChecking, promptForKey, handleApiError } = useApiKeyCheck();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !isKeyReady) return;

        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const url = await generateImage(prompt, aspectRatio, imageSize);
            setImageUrl(url);
        } catch (err) {
            console.error('Image generation failed:', err);
            setError('Failed to generate image. Please try again.');
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) return <Spinner text="Checking API Key..." />;
    if (!isKeyReady) return <ApiKeyPrompt onSelectKey={promptForKey} featureName="Image Generation" />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                        placeholder="e.g., A cinematic shot of a drone surveying a mountain range"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                        {aspectRatios.map(ar => (
                            <Button type="button" variant={aspectRatio === ar ? 'primary' : 'secondary'} key={ar} onClick={() => setAspectRatio(ar)} className="text-xs">{ar}</Button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Image Size</label>
                    <div className="flex flex-wrap gap-2">
                        {imageSizes.map(size => (
                            <Button type="button" variant={imageSize === size ? 'primary' : 'secondary'} key={size} onClick={() => setImageSize(size)} className="text-xs">{size}</Button>
                        ))}
                    </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </Button>
            </form>

            <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 min-h-[300px] p-4">
                {isLoading && <Spinner text="Creating your image..."/>}
                {error && <p className="text-red-400">{error}</p>}
                {imageUrl && <img src={imageUrl} alt="Generated drone" className="max-w-full max-h-full object-contain rounded-md"/>}
                {!isLoading && !error && !imageUrl && <p className="text-gray-500">Your generated image will appear here.</p>}
            </div>
        </div>
    );
};
