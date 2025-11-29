
import React, { useState } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { VideoGenerator } from './VideoGenerator';
import { VideoAnimator } from './VideoAnimator';
import { VideoAnalyzer } from './VideoAnalyzer';

type VideoLabTab = 'generate' | 'animate' | 'analyze';

export const VideoLab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<VideoLabTab>('generate');
    const tabs: VideoLabTab[] = ['generate', 'animate', 'analyze'];

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-1 text-white">Video Lab</h2>
            <p className="text-gray-400 mb-6">Bring drone concepts to life with AI-powered video generation and analysis.</p>
            <Tabs<VideoLabTab> tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div>
                {activeTab === 'generate' && <VideoGenerator />}
                {activeTab === 'animate' && <VideoAnimator />}
                {activeTab === 'analyze' && <VideoAnalyzer />}
            </div>
        </div>
    );
};
