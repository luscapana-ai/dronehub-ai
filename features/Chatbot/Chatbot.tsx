import React, { useState, useRef, useEffect } from 'react';
import { streamChatResponse } from '../../services/geminiService';
import type { ChatMessage } from '../../types';
import { Send, Loader } from '../../components/Icons';
import Markdown from 'react-markdown';
import { GenerateContentResponse } from '@google/genai';

interface ChatbotProps {
    history: ChatMessage[];
    setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const Chatbot: React.FC<ChatbotProps> = ({ history, setHistory }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: prompt }] };
        // Build the new history locally so we can pass the updated context to the streaming service
        const newHistory = [...history, newUserMessage];
        setHistory(newHistory);
        setPrompt('');
        setIsLoading(true);

        try {
            // Pass the updated history (including the just-added user message) to the streaming call
            const stream = await streamChatResponse(newHistory, prompt);

            let modelResponseText = '';
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                modelResponseText += c.text;
                setHistory(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'model', parts: [{ text: modelResponseText }] };
                    return updated;
                });
            }
        } catch (error) {
            console.error('Error streaming response:', error);
            setHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.parts[0].text = "Sorry, I encountered an error. Please try again.";
                } else {
                    newHistory.push({ role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] });
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">AI Drone Expert Chat</h2>
            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4 space-y-4">
                 {history.length === 0 && (
                    <div className="text-center text-gray-500 pt-8">
                        <p>Ask me anything about drones!</p>
                        <p className="text-sm">You can also start a conversation from the Dronepedia tab.</p>
                    </div>
                )}
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <Markdown>{msg.parts[0].text}</Markdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && history[history.length-1]?.role === 'user' && (
                     <div className="flex justify-start">
                        <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200 flex items-center">
                            <Loader className="w-5 h-5 mr-2" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
                <input
                    id="chatbot-input"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="p-3 bg-cyan-500 text-white rounded-lg disabled:bg-gray-600 hover:bg-cyan-600 transition-colors"
                >
                    {isLoading ? <Loader className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                </button>
            </form>
        </div>
    );
};
