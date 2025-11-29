
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import type { Feature } from '../../App';

interface TutorialProps {
    onClose: () => void;
    setActiveFeature: (feature: Feature) => void;
}

interface Step {
    title: string;
    description: string;
    targetId?: string;
    feature?: Feature;
    position: 'center' | 'bottom' | 'right' | 'left';
}

const STEPS: Step[] = [
    {
        title: "Welcome to DroneHub AI! 🚁",
        description: "Your all-in-one AI companion for everything drones. Let's take a quick tour of the main features.",
        position: 'center'
    },
    {
        title: "Navigation Sidebar",
        description: "Use this sidebar to switch between different tools like the Chatbot, Encyclopedia, and Analysis tools.",
        targetId: 'sidebar-nav',
        position: 'right'
    },
    {
        title: "AI Chatbot",
        description: "Your personal drone expert. Ask any question about gear, flying, or regulations here.",
        targetId: 'chatbot-input',
        feature: 'Chatbot',
        position: 'bottom'
    },
    {
        title: "Dronepedia",
        description: "A massive knowledge base grounded in real-time data. Search for events, specs, or learn new tactics.",
        targetId: 'dronepedia-search',
        feature: 'Dronepedia',
        position: 'bottom'
    },
    {
        title: "Flight Log Analytics",
        description: "Paste your Blackbox logs or flight notes here. The AI will diagnose tuning issues and mechanical health.",
        targetId: 'flightlog-input',
        feature: 'FlightLog',
        position: 'bottom'
    },
    {
        title: "Ready to Fly?",
        description: "You're all set! Explore the app and level up your piloting skills. Fly safe!",
        position: 'center'
    }
];

export const Tutorial: React.FC<TutorialProps> = ({ onClose, setActiveFeature }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const currentStep = STEPS[currentStepIndex];

    useEffect(() => {
        // Switch feature if needed
        if (currentStep.feature) {
            setActiveFeature(currentStep.feature);
        }

        // Wait a tick for rendering, then measure target
        setTimeout(() => {
            if (currentStep.targetId) {
                const element = document.getElementById(currentStep.targetId);
                if (element) {
                    setTargetRect(element.getBoundingClientRect());
                }
            } else {
                setTargetRect(null);
            }
        }, 300); // Small delay to allow UI transition
    }, [currentStep, setActiveFeature]);

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop / Spotlight */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
            
            {targetRect && (
                <div 
                    className="absolute border-2 border-cyan-500 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300 ease-in-out pointer-events-none bg-transparent"
                    style={{
                        top: targetRect.top - 5,
                        left: targetRect.left - 5,
                        width: targetRect.width + 10,
                        height: targetRect.height + 10,
                    }}
                />
            )}

            {/* Instruction Card */}
            <div 
                className={`absolute bg-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl max-w-sm w-full transition-all duration-300`}
                style={
                    targetRect 
                    ? {
                        top: currentStep.position === 'bottom' ? targetRect.bottom + 20 : 
                             currentStep.position === 'right' ? targetRect.top : undefined,
                        left: currentStep.position === 'right' ? targetRect.right + 20 : 
                              currentStep.position === 'bottom' ? Math.max(20, targetRect.left) : undefined,
                    }
                    : {} // Center layout handled by flex parent if no target
                }
            >
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        Step {currentStepIndex + 1} of {STEPS.length}
                    </span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xs underline">
                        Skip Tour
                    </button>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{currentStep.title}</h3>
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">{currentStep.description}</p>
                
                <div className="flex justify-end gap-3">
                    {currentStepIndex > 0 && (
                         <Button 
                            onClick={() => setCurrentStepIndex(prev => prev - 1)} 
                            variant="secondary"
                            className="text-xs"
                         >
                            Back
                         </Button>
                    )}
                    <Button onClick={handleNext} className="text-sm">
                        {currentStepIndex === STEPS.length - 1 ? "Get Started" : "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
