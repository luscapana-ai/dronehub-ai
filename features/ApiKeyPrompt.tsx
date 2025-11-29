
import React from 'react';
import { Button } from '../components/ui/Button';
import { Key, Link } from '../components/Icons';

interface ApiKeyPromptProps {
  onSelectKey: () => void;
  featureName: string;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSelectKey, featureName }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gray-800/50 rounded-lg p-8 border border-dashed border-gray-600">
      <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
        <Key className="w-10 h-10 text-cyan-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{featureName} Requires API Key</h2>
      <p className="text-gray-400 max-w-md mb-6">
        This advanced feature requires a paid Google Cloud project API key. Please select a key to continue.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button onClick={onSelectKey}>
          <Key className="w-5 h-5 mr-2" />
          Select API Key
        </Button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Link className="w-4 h-4 mr-2"/>
          Learn about billing
        </a>
      </div>
    </div>
  );
};
