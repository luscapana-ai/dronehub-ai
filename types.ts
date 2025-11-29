
export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    sources?: GroundingSource[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
export type ImageSize = "1K" | "2K" | "4K";

export interface VeoState {
    status: 'idle' | 'generating' | 'success' | 'error';
    message: string;
    videoUrl?: string;
    error?: string;
}
