import { GoogleGenAI, Modality } from "@google/genai";

// Helper to handle errors more gracefully
const handleServiceError = (error: any, context: string) => {
    console.error(`Lỗi ${context}:`, error);
    const msg = error instanceof Error ? error.message : String(error);
    
    if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
        throw new Error("Hệ thống từ chối xử lý ảnh này do quy định an toàn (Safety Filters). Vui lòng thử ảnh khác ít nhạy cảm hơn hoặc chụp rõ trang phục hơn.");
    }
    if (msg.includes("RECITATION")) {
        throw new Error("Yêu cầu bị chặn do vi phạm bản quyền hoặc nội dung lặp lại.");
    }
    if (msg.includes("SAFETY")) {
        throw new Error("Ảnh hoặc mô tả vi phạm tiêu chuẩn cộng đồng của Google AI.");
    }
    
    throw new Error(`Banana AI gặp sự cố khi ${context}. ${msg}`);
};

// This function now handles both text-to-image and image-and-text-to-image
export const generateImage = async (
    prompt: string,
    sourceImages?: { data: string, mimeType: string }[],
    options?: { aspectRatio?: string }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // Prepare parts
        const parts: any[] = [];
        
        if (sourceImages && sourceImages.length > 0) {
            const imageParts = sourceImages.map(image => ({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType,
                },
            }));
            parts.push(...imageParts);
        }
        
        parts.push({ text: prompt });

        // Config for Banana (Gemini 2.5 Flash Image)
        const config: any = {
            responseModalities: [Modality.IMAGE],
        };

        // Apply aspect ratio if provided
        if (options?.aspectRatio) {
            config.imageConfig = {
                aspectRatio: options.aspectRatio
            };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
                parts: parts,
            },
            config: config,
        });

        // Iterate through parts to find image
        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
             const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
            if(textPart?.text) {
                 // Đôi khi model trả về text từ chối thay vì ảnh
                 throw new Error(`Banana AI phản hồi văn bản: ${textPart.text}`);
            }
            throw new Error("Không nhận được hình ảnh từ Banana AI.");
        }

    } catch (error) {
        handleServiceError(error, "tạo ảnh");
        return "";
    }
};

export const editImage = async (
    modelImage: { data: string, mimeType: string },
    productImage: { data: string, mimeType: string },
    accessoryImages: { data: string, mimeType: string }[],
    prompt: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[] = [
            {
                inlineData: {
                    data: modelImage.data,
                    mimeType: modelImage.mimeType,
                },
            },
            {
                inlineData: {
                    data: productImage.data,
                    mimeType: productImage.mimeType,
                },
            },
        ];

        accessoryImages.forEach(image => {
            parts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType,
                }
            });
        });

        parts.push({
            text: prompt,
        });


        // Sử dụng gemini-2.5-flash-image (Banana)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
            const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
            if(textPart?.text) {
                 throw new Error(`Banana AI phản hồi: ${textPart.text}`);
            }
            throw new Error("Không nhận được hình ảnh đã chỉnh sửa từ Banana AI.");
        }
    } catch (error) {
        handleServiceError(error, "chỉnh sửa ảnh");
        return "";
    }
};

export const removeBackgroundImage = async (
    image: { data: string; mimeType: string }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.data,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        // Use English prompt for better technical execution and safety
                        text: "Remove the background from this image. Keep the main subject on a transparent background. High quality.",
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
            throw new Error("Không nhận được hình ảnh đã xử lý từ Banana AI.");
        }
    } catch (error) {
        handleServiceError(error, "xóa nền");
        return "";
    }
};

export const separateClothing = async (
    image: { data: string; mimeType: string }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.data,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        // Updated prompt to be "safer" and avoid 403 Permission Denied errors (usually due to perceived body modification/nudity).
                        // Focuses on "flat lay" and "product photography" instead of "removing the person".
                        text: "Create a flat lay product photography of the outfit in this image. Isolate the clothing on a pure white background. Do not show any person or body parts. Focus only on the textile and design.",
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
            throw new Error("Không nhận được hình ảnh đã xử lý từ Banana AI.");
        }
    } catch (error) {
        handleServiceError(error, "tách trang phục");
        return "";
    }
};

export const upscaleImage = async (
    originalImage: { data: string, mimeType: string },
    faceReference: { data: string, mimeType: string } | null,
    prompt: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const parts: any[] = [];
        
        parts.push({
            inlineData: {
                data: originalImage.data,
                mimeType: originalImage.mimeType,
            },
        });

        if (faceReference) {
            parts.push({
                inlineData: {
                    data: faceReference.data,
                    mimeType: faceReference.mimeType,
                },
            });
        }

        parts.push({ text: prompt });

        // Sử dụng gemini-2.5-flash-image (Banana)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
            const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
            if (textPart?.text) {
                 throw new Error(`Banana AI phản hồi: ${textPart.text}`);
            }
            throw new Error("Không nhận được hình ảnh nâng cấp từ Banana AI.");
        }
    } catch (error) {
        handleServiceError(error, "upscale ảnh");
        return "";
    }
};