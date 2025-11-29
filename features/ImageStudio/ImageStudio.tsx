
import React, { useState } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { ImageGenerator } from './ImageGenerator';
import { ImageEditor } from './ImageEditor';
import { ImageAnalyzer } from './ImageAnalyzer';

type ImageStudioTab = 'generate' | 'edit' | 'analyze';

export const ImageStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ImageStudioTab>('generate');
    const tabs: ImageStudioTab[] = ['generate', 'edit', 'analyze'];

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-1 text-white">Image Studio</h2>
            <p className="text-gray-400 mb-6">Create, modify, and understand drone imagery with AI.</p>
            <Tabs<ImageStudioTab> tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div>
                {activeTab === 'generate' && <ImageGenerator />}
                {activeTab === 'edit' && <ImageEditor />}
                {activeTab === 'analyze' && <ImageAnalyzer />}
            </div>
        </div>
    );
};
