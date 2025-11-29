
import { useState, useEffect, useCallback } from 'react';

export const useApiKeyCheck = () => {
    const [isKeyReady, setIsKeyReady] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkKey = useCallback(async () => {
        setIsChecking(true);
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            try {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeyReady(hasKey);
            } catch (error) {
                console.error("Error checking for API key:", error);
                setIsKeyReady(false);
            }
        } else {
            // aistudio might not be available in all environments, assume key is set via env
            setIsKeyReady(true); 
        }
        setIsChecking(false);
    }, []);

    useEffect(() => {
        checkKey();
    }, [checkKey]);
    
    const promptForKey = useCallback(async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           try {
              await window.aistudio.openSelectKey();
              // Optimistically assume the user selected a key.
              setIsKeyReady(true);
           } catch(e) {
                console.error("Error opening key selection dialog:", e);
                setIsKeyReady(false);
           }
        }
    }, []);

    const handleApiError = useCallback((error: any) => {
        if (error?.message?.includes('Requested entity was not found')) {
            setIsKeyReady(false); // Force re-prompt
        }
    }, []);

    return { isKeyReady, isChecking, promptForKey, handleApiError };
};
