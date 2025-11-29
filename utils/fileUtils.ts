// FIX: Changed type from File to Blob to allow for more general use cases, like audio blobs from recordings.
export const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the "data:mime/type;base64," prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const extractFramesFromVideo = (
    videoFile: File,
    frameCount: number = 10
): Promise<{ inlineData: { data: string, mimeType: string } }[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: { inlineData: { data: string, mimeType: string } }[] = [];
        const url = URL.createObjectURL(videoFile);

        if (!context) {
            return reject(new Error('Canvas 2D context is not available.'));
        }

        video.muted = true;
        video.src = url;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const interval = duration / frameCount;

            let currentTime = 0;
            let capturedFrames = 0;

            const captureFrame = () => {
                if (capturedFrames >= frameCount) {
                    URL.revokeObjectURL(url);
                    resolve(frames);
                    return;
                }

                video.currentTime = currentTime;
            };

            video.onseeked = () => {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                frames.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: dataUrl.split(',')[1]
                    }
                });
                capturedFrames++;
                currentTime += interval;
                
                // Add a small delay to ensure the next seek is processed properly
                setTimeout(captureFrame, 100);
            };

            video.onerror = (e) => {
                 URL.revokeObjectURL(url);
                 reject(new Error("Error loading video file for frame extraction."));
            };
            
            captureFrame(); // Start the process
        };

        video.load();
    });
};