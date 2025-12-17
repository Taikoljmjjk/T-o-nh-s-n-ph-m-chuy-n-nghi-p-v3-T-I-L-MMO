
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            if (base64) {
                resolve(base64);
            } else {
                reject(new Error("Không thể chuyển đổi file sang Base64."));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

export const processImageFile = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        // If the file type is supported, simply read it
        if (supportedTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                if (base64) {
                    resolve({ data: base64, mimeType: file.type });
                } else {
                    reject(new Error("Failed to process image file."));
                }
            };
            reader.onerror = (err) => reject(err);
            return;
        }

        // If unsupported (e.g., image/avif), convert to JPEG using Canvas
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    // Convert to JPEG
                    const mimeType = 'image/jpeg';
                    const dataURL = canvas.toDataURL(mimeType, 0.95);
                    const data = dataURL.split(',')[1];
                    resolve({ data, mimeType });
                } else {
                    reject(new Error("Browser does not support canvas context for image conversion."));
                }
            };
            img.onerror = () => reject(new Error("Failed to load image for format conversion."));
            img.src = event.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};
