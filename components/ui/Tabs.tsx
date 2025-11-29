
import React from 'react';

interface TabsProps<T extends string> {
    tabs: T[];
    activeTab: T;
    onTabChange: (tab: T) => void;
}

export const Tabs = <T extends string>({ tabs, activeTab, onTabChange }: TabsProps<T>) => {
    return (
        <div className="border-b border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`${
                            activeTab === tab
                                ? 'border-cyan-400 text-cyan-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors capitalize`}
                    >
                        {tab.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                ))}
            </nav>
        </div>
    );
};
