
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Users, Send, MessageSquare } from '../../components/Icons';
import { generatePersonaResponse } from '../../services/geminiService';

interface ChatMessage {
    id: number;
    user: string;
    message: string;
    isUser: boolean;
    color?: string;
}

export const Community: React.FC = () => {
    const [callSign, setCallSign] = useState('');
    const [joined, setJoined] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, user: 'System', message: 'Welcome to the Pilot Hub! Global channel is active.', isUser: false, color: 'text-gray-400' },
        { id: 2, user: 'SpeedDemon_FPV', message: 'Anyone going to the multigp qualifier this weekend?', isUser: false, color: 'text-red-400' },
        { id: 3, user: 'CineWhoop_Steve', message: 'Just finished editing my mountain dive footage. The O3 unit is insane.', isUser: false, color: 'text-blue-400' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (callSign.trim()) {
            setJoined(true);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMsg: ChatMessage = {
            id: Date.now(),
            user: callSign,
            message: inputValue,
            isUser: true
        };

        setMessages(prev => [...prev, newUserMsg]);
        const currentInput = inputValue;
        setInputValue('');
        setIsTyping(true);

        // Simulate network delay and AI response
        try {
            // Context is last 5 messages
            const context = messages.slice(-5).map(m => ({ user: m.user, message: m.message }));
            
            // Random delay between 2-5 seconds for realism
            const delay = Math.random() * 3000 + 2000;
            
            setTimeout(async () => {
                const response = await generatePersonaResponse(currentInput, context);
                
                const newAiMsg: ChatMessage = {
                    id: Date.now() + 1,
                    user: response.user,
                    message: response.message,
                    isUser: false,
                    color: response.avatarColor
                };
                
                setMessages(prev => [...prev, newAiMsg]);
                setIsTyping(false);
            }, delay);

        } catch (error) {
            console.error("Failed to generate community response", error);
            setIsTyping(false);
        }
    };

    if (!joined) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
                <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="bg-cyan-500/20 p-4 rounded-full">
                            <Users className="w-10 h-10 text-cyan-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-2">Join Pilot Hub</h2>
                    <p className="text-gray-400 text-center mb-6 text-sm">Connect with drone enthusiasts worldwide.</p>
                    
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilot Call Sign</label>
                            <input 
                                type="text" 
                                value={callSign}
                                onChange={(e) => setCallSign(e.target.value)}
                                placeholder="e.g. Maverick_FPV"
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                maxLength={15}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={!callSign.trim()}>
                            Enter Channel
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
            {/* Header */}
            <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    <div>
                        <h3 className="font-bold text-white text-sm">#global-hangout</h3>
                        <p className="text-xs text-gray-400">1,420 pilots online</p>
                    </div>
                </div>
                <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl p-3 ${msg.isUser ? 'bg-cyan-600 rounded-tr-none' : 'bg-gray-700 rounded-tl-none'}`}>
                            {!msg.isUser && (
                                <p className={`text-xs font-bold mb-1 ${msg.color}`}>{msg.user}</p>
                            )}
                            <p className="text-sm text-gray-100">{msg.message}</p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                         <div className="bg-gray-700 rounded-xl rounded-tl-none p-3 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Message #${callSign}...`}
                    className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500"
                />
                <Button type="submit" disabled={!inputValue.trim()}>
                    <Send className="w-5 h-5" />
                </Button>
            </form>
        </div>
    );
};
