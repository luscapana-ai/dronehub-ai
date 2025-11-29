import { GoogleGenAI, GenerateContentResponse, Type, Part } from "@google/genai";
import type { AspectRatio, ImageSize } from '../types';

// FIX: Removed conflicting global declaration for window.aistudio. 
// This resolves a type error, as the type is likely provided by the execution environment.
const getApiKey = () => process.env.API_KEY;

// CHAT & TEXT
export const generateChatResponse = async (history: { role: 'user' | 'model'; parts: { text: string }[] }[], newMessage: string, model: string, useThinking: boolean = false) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const chat = ai.chats.create({
        model: model,
        history: history,
        config: useThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {}
    });
    const result = await chat.sendMessage({ message: newMessage });
    return result;
};

export const streamChatResponse = async (history: { role: 'user' | 'model'; parts: { text: string }[] }[], newMessage: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const chat = ai.chats.create({ model: 'gemini-3-pro-preview', history: history });
    return chat.sendMessageStream({ message: newMessage });
};

// GROUNDING
export const generateGroundedResponse = async (prompt: string, tool: 'googleSearch' | 'googleMaps') => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let config: any = { tools: [] };
    if (tool === 'googleSearch') {
        config.tools.push({ googleSearch: {} });
    }
    if (tool === 'googleMaps') {
        config.tools.push({ googleMaps: {} });
        // Geolocation removed as per user request
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: config,
    });
    return response;
};

// VIDEO ANALYSIS
export const analyzeVideo = async (prompt: string, frames: { inlineData: { data: string, mimeType: string } }[]) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const textPart: Part = { text: prompt };
    const imageParts: Part[] = frames;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [textPart, ...imageParts] },
    });
    return response.text;
};

// AUDIO
export const transcribeAudio = async (audioBase64: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const audioPart = {
        inlineData: {
            mimeType: 'audio/webm',
            data: audioBase64,
        },
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, {text: "Transcribe this audio."}] },
    });
    return response.text;
};

export const generateSpeech = async (text: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received.");
    }
    return base64Audio;
};

// COMMUNITY SIMULATION
export const generatePersonaResponse = async (userMessage: string, chatContext: { user: string, message: string }[]) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const personas = [
        { name: "SpeedDemon_FPV", style: "Excited, competitive, talks about PID tuning and lap times. Uses slang like 'rip', 'send it', 'gap'." },
        { name: "CineWhoop_Steve", style: "Calm, artistic, focuses on ND filters, smoothness, and composition. Helpful to beginners." },
        { name: "CrashTestDummy", style: "Self-deprecating, funny, constantly breaking parts. Asks for repair advice." },
        { name: "TechGuru_99", style: "Very technical, precise, knows everything about protocols (ELRS, Crossfire) and soldering." },
        { name: "NoobPilot101", style: "Curious, slightly confused, asks beginner questions but is enthusiastic." }
    ];

    const randomPersona = personas[Math.floor(Math.random() * personas.length)];
    
    const prompt = `
        You are roleplaying as a drone enthusiast named "${randomPersona.name}" in a group chat.
        Your personality is: ${randomPersona.style}.
        
        Recent chat history:
        ${chatContext.map(c => `${c.user}: ${c.message}`).join('\n')}
        
        User just said: "${userMessage}"
        
        Write a short, single reply (under 30 words) to the user's message. 
        Do not use hashtags. Keep it casual and conversational.
        Return ONLY the message text.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return {
        user: randomPersona.name,
        message: response.text?.trim() || "Copy that!",
        avatarColor: getRandomColor()
    };
};

function getRandomColor() {
    const colors = ['text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// FLIGHT LOG ANALYSIS
export const analyzeFlightLog = async (logData: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `
        Analyze the following drone flight log data or flight notes.
        Identify any issues with PID tuning, vibration (noise), battery voltage sag, or mechanical problems.
        Provide actionable recommendations to improve flight performance.
        
        Log Data/Notes:
        ${logData}
        
        Format the response in Markdown with these sections:
        1. **Summary of Flight Health**
        2. **Detected Issues**
        3. **Tuning Recommendations**
        4. **Mechanical Checks**
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
    });
    
    return response.text;
};

// IMAGE GENERATION
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, imageSize: ImageSize) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    // Default to nano banana for speed/standard generation
    let model = 'gemini-2.5-flash-image';
    let config: any = {
        imageConfig: {
            aspectRatio: aspectRatio
        }
    };

    // Use Pro model for high resolution/quality requests
    if (imageSize === '2K' || imageSize === '4K') {
        model = 'gemini-3-pro-image-preview';
        config.imageConfig.imageSize = imageSize;
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
};

// IMAGE EDITING
export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                },
                { text: prompt }
            ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No edited image generated");
};

// IMAGE ANALYSIS
export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                },
                { text: prompt }
            ]
        }
    });
    return response.text;
};

// VIDEO GENERATION (VEO)
export const generateVideoFromText = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Using fast-generate-preview for general tasks as per prompt recommendations
    const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
            resolution: '720p'
        }
    });
    return operation;
};

export const generateVideoFromImage = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: '16:9' | '9:16') => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt, 
        image: {
            imageBytes: imageBase64,
            mimeType: mimeType
        },
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
            resolution: '720p'
        }
    });
    return operation;
};

export const checkVideoOperationStatus = async (operation: any) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    return await ai.operations.getVideosOperation({ operation: operation });
};