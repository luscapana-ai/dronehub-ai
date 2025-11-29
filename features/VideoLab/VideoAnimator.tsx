
import React, { useState, useRef, useEffect } from 'react';
import { generateVideoFromImage, checkVideoOperationStatus } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import type { VeoState } from '../../types';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useApiKeyCheck } from '../../hooks/useApiKeyCheck';
import { ApiKeyPrompt } from '../ApiKeyPrompt';
import { Upload, X } from '../../components/Icons';

const VEO_MESSAGES = [
    "Analyzing image composition...",
    "Bringing your photo to life...",
    "Animating pixels, one by one...",
    "This can take a few minutes. Magic is in the making!",
    "Rendering motion vectors...",
    "Finalizing the animation..."
];

export const VideoAnimator: React.FC = () => {
    const [prompt, setPrompt] = useState('The drone slowly lifts off and flies towards the mountains.');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [image, setImage] = useState<{ file: File, url: string } | null>(null);
    const [veoState, setVeoState] = useState<VeoState>({ status: 'idle', message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isKeyReady, isChecking, promptForKey, handleApiError } = useApiKeyCheck();

    useEffect(() => {
        let intervalId: number | undefined;
        if (veoState.status === 'generating') {
            intervalId = window.setInterval(() => {
                setVeoState(prev => ({ ...prev, message: VEO_MESSAGES[Math.floor(Math.random() * VEO_MESSAGES.length)] }));
            }, 4000);
        }
        return () => clearInterval(intervalId);
    }, [veoState.status]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage({ file, url: URL.createObjectURL(file) });
            setVeoState({ status: 'idle', message: '' });
        }
    };
    
    const handleRemoveImage = () => {
        setImage(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !isKeyReady) return;

        setVeoState({ status: 'generating', message: VEO_MESSAGES[0] });

        try {
            const base64 = await fileToBase64(image.file);
            let operation = await generateVideoFromImage(prompt, base64, image.file.type, aspectRatio);
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await checkVideoOperationStatus(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                setVeoState({ status: 'success', message: 'Video animated successfully!', videoUrl });
            } else {
                throw new Error('Animation completed but no URL was found.');
            }
        } catch (err) {
            console.error('Video animation failed:', err);
            setVeoState({ status: 'error', message: 'Failed to animate image.', error: (err as Error).message });
            handleApiError(err);
        }
    };
    
    if (isChecking) return <Spinner text="Checking API Key..." />;
    if (!isKeyReady) return <ApiKeyPrompt onSelectKey={promptForKey} featureName="Veo Image Animation" />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
                 <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 h-64 p-4 relative">
                    {!image ? (
                        <>
                            <Upload className="w-10 h-10 text-gray-500 mb-2"/>
                            <p className="text-gray-400 mb-3">Upload a starting image</p>
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                Choose File
                            </Button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </>
                    ) : (
                        <>
                            <img src={image.url} alt="Starting frame" className="max-w-full max-h-full object-contain rounded-md"/>
                             <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-gray-900/60 rounded-full hover:bg-gray-800/80 transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </>
                    )}
                </div>
                 <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="anim-prompt" className="block text-sm font-medium text-gray-300 mb-2">Animation Prompt (optional)</label>
                        <textarea
                            id="anim-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                            placeholder="e.g., A first-person view of a racing drone"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                        <div className="flex gap-2">
                            <Button type="button" variant={aspectRatio === '16:9' ? 'primary' : 'secondary'} onClick={() => setAspectRatio('16:9')}>16:9 (Landscape)</Button>
                            <Button type="button" variant={aspectRatio === '9:16' ? 'primary' : 'secondary'} onClick={() => setAspectRatio('9:16')}>9:16 (Portrait)</Button>
                        </div>
                    </div>
                    <Button type="submit" disabled={veoState.status === 'generating' || !image}>
                        {veoState.status === 'generating' ? 'Animating...' : 'Animate Image'}
                    </Button>
                </form>
            </div>
            <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 min-h-[300px] p-4">
                {veoState.status === 'generating' && <Spinner text={veoState.message}/>}
                {veoState.status === 'error' && <p className="text-red-400 text-center">{veoState.message}<br/>{veoState.error}</p>}
                {veoState.status === 'success' && veoState.videoUrl && (
                    <video src={veoState.videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-md"/>
                )}
                {veoState.status === 'idle' && <p className="text-gray-500">Your animated video will appear here.</p>}
            </div>
        </div>
    );
};
