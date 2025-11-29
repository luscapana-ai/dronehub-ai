import React from 'react';
import type { Feature } from '../App';

interface SidebarProps {
    activeFeature: Feature;
    setActiveFeature: (feature: Feature) => void;
    features: { name: Feature; icon: React.FC<React.SVGProps<SVGSVGElement>> }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature, features }) => {
    return (
        <nav id="sidebar-nav" className="flex flex-col bg-gray-800 w-20 items-center py-6 space-y-4 border-r border-gray-700 z-30">
            {features.map((feature) => {
                // Format the label for display (e.g. DeepAnalysis -> Deep Analysis)
                const label = feature.name
                    .replace(/([A-Z])/g, ' $1')
                    .trim();

                return (
                    <div key={feature.name} className="relative group w-full px-2 flex justify-center">
                        <button
                            id={`nav-${feature.name}`}
                            onClick={() => setActiveFeature(feature.name)}
                            className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 w-12 h-12 ${
                                activeFeature === feature.name
                                    ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                            aria-label={label}
                        >
                            <feature.icon className="w-6 h-6" />
                        </button>
                        
                        {/* Custom Tooltip */}
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-gray-700 shadow-xl z-50">
                            {label}
                            {/* Tooltip Arrow */}
                            <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
                        </div>
                    </div>
                );
            })}
        </nav>
    );
};