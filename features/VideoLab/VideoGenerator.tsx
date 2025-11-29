
import React, { useState, useEffect } from 'react';
import { generateVideoFromText, checkVideoOperationStatus } from '../../services/geminiService';
import type { VeoState } from '../../types';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useApiKeyCheck } from '../../hooks/useApiKeyCheck';
import { ApiKeyPrompt } from '../ApiKeyPrompt';

const VEO_MESSAGES = [
    "Warming up the rendering engines...",
    "Choreographing digital flight paths...",
    "Processing scenes frame by frame...",
    "This can take a few minutes. Great things are worth the wait!",
    "Polishing the final cut...",
    "Almost there, adding the finishing touches..."
];

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A drone flying through a spectacular canyon, cinematic 4k');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [veoState, setVeoState] = useState<VeoState>({ status: 'idle', message: '' });
    
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !isKeyReady) return;

        setVeoState({ status: 'generating', message: VEO_MESSAGES[0] });

        try {
            let operation = await generateVideoFromText(prompt, aspectRatio);
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await checkVideoOperationStatus(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                setVeoState({ status: 'success', message: 'Video generated successfully!', videoUrl });
            } else {
                throw new Error('Video generation completed but no URL was found.');
            }
        } catch (err) {
            console.error('Video generation failed:', err);
            setVeoState({ status: 'error', message: 'Failed to generate video.', error: (err as Error).message });
            handleApiError(err);
        }
    };
    
    if (isChecking) return <Spinner text="Checking API Key..." />;
    if (!isKeyReady) return <ApiKeyPrompt onSelectKey={promptForKey} featureName="Veo Video Generation" />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Video Prompt</label>
                    <textarea
                        id="video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
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
                <Button type="submit" disabled={veoState.status === 'generating'}>
                    {veoState.status === 'generating' ? 'Generating...' : 'Generate Video'}
                </Button>
            </form>
            <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-dashed border-gray-600 min-h-[300px] p-4">
                {veoState.status === 'generating' && <Spinner text={veoState.message}/>}
                {veoState.status === 'error' && <p className="text-red-400 text-center">{veoState.message}<br/>{veoState.error}</p>}
                {veoState.status === 'success' && veoState.videoUrl && (
                    <video src={veoState.videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-md"/>
                )}
                {veoState.status === 'idle' && <p className="text-gray-500">Your generated video will appear here.</p>}
            </div>
        </div>
    );
};
