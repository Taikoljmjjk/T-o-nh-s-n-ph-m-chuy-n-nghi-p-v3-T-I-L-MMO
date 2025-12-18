import React, { useState, useEffect } from 'react';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { ImageDisplay } from './components/ImageDisplay';
import { ImageUpscaler } from './components/ImageUpscaler';
import { ImageCreator } from './components/ImageCreator';
import { ApiKeyInput } from './components/ApiKeyInput'; // Import new component
import { Tabs } from './components/ui/Tabs';
import { generateImage, editImage, upscaleImage } from './services/geminiService';
import { processImageFile } from './utils/fileUtils';
import type { EditImageData, GenerateImageData, UpscaleImageData, CreateImageData } from './types';
import { ImageIcon } from './components/ui/Icon';

type Tab = 'generate' | 'edit' | 'upscale' | 'create';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('generate');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [veoPrompt, setVeoPrompt] = useState<string | null>(null);

    // Check for API Key on mount
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else if (process.env.API_KEY) {
            // If environment variable exists, we treat it as logged in
            setApiKey(process.env.API_KEY);
        }
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isLoading) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer + 1);
            }, 1000);
        } else if (!isLoading && timer !== 0) {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading]);

    const handleSaveApiKey = (key: string) => {
        localStorage.setItem('gemini_api_key', key);
        setApiKey(key);
    };

    const handleClearApiKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey(null);
        setGeneratedImages([]);
        setError(null);
    };

    const handleGenerateImage = async (data: GenerateImageData) => {
        setTimer(0);
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setVeoPrompt(null);

        if (data.sourceImages && data.sourceImages.length > 0) {
             setLoadingMessage('Đang khởi tạo Lora Adapter: Train nóng dữ liệu khuôn mặt...');
             if (data.outfitImage) {
                 setLoadingMessage('Lora Fusion: Đồng bộ Face ID vào Outfit (4 Biến thể)...');
             }
        } else {
             setLoadingMessage('Banana AI đang sáng tạo 4 góc máy...');
        }

        try {
            // Prepare source images
            let inputsB64: { data: string; mimeType: string }[] = [];
            
            // 1. Face Images (Highest Priority)
            if (data.sourceImages && data.sourceImages.length > 0) {
                const faces = await Promise.all(
                    data.sourceImages.map(file => processImageFile(file))
                );
                inputsB64 = [...inputsB64, ...faces];
            }

            // 2. Outfit Image
            let hasOutfit = false;
            if (data.outfitImage) {
                hasOutfit = true;
                const outfitProcessed = await processImageFile(data.outfitImage);
                inputsB64.push(outfitProcessed);
            }

            // 3. Accessory Image
            let hasAccessory = false;
            if (data.accessoryImage) {
                hasAccessory = true;
                const accProcessed = await processImageFile(data.accessoryImage);
                inputsB64.push(accProcessed);
            }

            // Define 4 variations of camera angles
            const variations = [
                { suffix: " (Wide Angle Shot: Full body view, showing the environment and context, cinematic composition)." },
                { suffix: " (Medium Shot: Waist-up view, focus on the outfit details and pose, professional portrait lighting)." },
                { suffix: " (Close-up Shot: Focus on face, makeup and expression, bokeh background, high detail texture)." },
                { suffix: " (Artistic Dutch Angle: Dynamic camera angle, dramatic lighting, fashion editorial style)." }
            ];

            // Generate prompt template based on mode
            let basePromptTemplate = "";
            
            if (inputsB64.length > 0) {
                if (hasOutfit) {
                    // MODE: FASHION LOOKBOOK
                    basePromptTemplate = `
                    [SYSTEM: ACTIVATE LORA ADAPTER <FACE_ID_V7>]
                    [TRIGGER WORD: "UserReference"]
                    [LORA WEIGHTS]: Identity=1.9, Texture=1.5, Structure=1.7
                    
                    [INPUTS]: Face="UserReference", Outfit=Provided Image.
                    [GOAL]: Photo of "UserReference" wearing the Outfit.
                    [CONTEXT]: "${data.prompt}"
                    
                    [SHOT TYPE]: <<ANGLE_VAR>>
                    
                    [GUIDELINES]:
                    1. Identity Match: Eyes/Nose/Mouth must match "UserReference".
                    2. Lighting: Realistic, consistent with scene.
                    3. Skin: 8k texture, pores visible.
                    `;
                } else {
                    // Mode: Deep-ID V7 LORA
                    basePromptTemplate = `
                    [SYSTEM: ACTIVATE LORA ADAPTER <FACE_ID_V7>]
                    [TRIGGER WORD: "UserReference"]
                    [GOAL]: Hyper-realistic photo of "UserReference".
                    [CONTEXT]: "${data.prompt}"
                    
                    [SHOT TYPE]: <<ANGLE_VAR>>
                    
                    [GUIDELINES]:
                    1. Structure: Weight 2.0 on facial geometry.
                    2. Style: Raw photo, 8k resolution.
                    `;
                }
            } else {
                 // Pure Generation
                 basePromptTemplate = `
                 Generate a high-quality photo.
                 Context: "${data.prompt}"
                 Shot Type: <<ANGLE_VAR>>
                 Style: Photorealistic, 8k, detailed texture.
                 `;
            }

            // Execute 4 parallel requests
            const promises = variations.map(async (variant) => {
                const finalPrompt = basePromptTemplate.replace("<<ANGLE_VAR>>", variant.suffix);
                const imageB64 = await generateImage(
                    finalPrompt, 
                    inputsB64.length > 0 ? inputsB64 : undefined,
                    { aspectRatio: data.aspectRatio }
                );
                return `data:image/jpeg;base64,${imageB64}`;
            });

            const results = await Promise.all(promises);
            setGeneratedImages(results);
            
            // Generate Veo3 Prompt
            const generatedVeoPrompt = `Cinematic video of ${data.prompt}. Style: ${data.videoStyle || 'Cinematic Luxury'}. Sequence of shots: Wide angle establishing shot, cutting to medium shot of subject, then close-up on details. High resolution 4k, professional commercial lighting.`;
            setVeoPrompt(generatedVeoPrompt);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateImage = async (data: CreateImageData) => {
        setTimer(0);
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setVeoPrompt(null);
        setLoadingMessage('Banana Nano đang vẽ 4 bức tranh nghệ thuật...');

        try {
            let inputsB64: { data: string; mimeType: string }[] = [];

            // Process source images (background/style reference)
            if (data.sourceImages && data.sourceImages.length > 0) {
                 const refs = await Promise.all(
                    data.sourceImages.map(file => processImageFile(file))
                );
                 inputsB64 = [...inputsB64, ...refs];
            }

            // Process outfit image if provided
            if (data.outfitImage) {
                const outfitProcessed = await processImageFile(data.outfitImage);
                inputsB64.push(outfitProcessed);
            }

            const variations = [
                { suffix: " (Wide shot, showing full scene context)." },
                { suffix: " (Medium shot, focus on main subject)." },
                { suffix: " (Close-up detail shot)." },
                { suffix: " (Dynamic/Artistic angle)." }
            ];

            const promises = variations.map(async (variant) => {
                let finalPrompt = `${data.prompt}. ${variant.suffix}`;
                
                // If outfit is provided, make sure the prompt emphasizes wearing it
                if (data.outfitImage) {
                    finalPrompt = `Character must be wearing the exact outfit from the provided image. ${finalPrompt}`;
                }

                const imageB64 = await generateImage(finalPrompt, inputsB64.length > 0 ? inputsB64 : undefined, { aspectRatio: data.aspectRatio });
                return `data:image/jpeg;base64,${imageB64}`;
            });

            const results = await Promise.all(promises);
            setGeneratedImages(results);
            
            const generatedVeoPrompt = `Cinematic video of ${data.prompt}. Style: ${data.videoStyle}. High resolution 4k, professional commercial lighting, smooth camera movement, highly detailed texture.`;
            setVeoPrompt(generatedVeoPrompt);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo ảnh.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditImage = async (data: EditImageData) => {
        if (!data.modelImage || !data.productImage) {
            setError('Vui lòng tải lên cả ảnh người mẫu và ảnh sản phẩm.');
            return;
        }

        setTimer(0);
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setVeoPrompt(null);
        setLoadingMessage('Banana AI đang thực hiện ghép ảnh Studio chuyên nghiệp...');

        try {
            const base64Promises = [
                processImageFile(data.modelImage),
                processImageFile(data.productImage),
            ];
            
            const accessoryFiles = [data.accessoryImage1, data.accessoryImage2].filter(Boolean) as File[];
            accessoryFiles.forEach(file => {
                base64Promises.push(processImageFile(file));
            });
    
            const allProcessed = await Promise.all(base64Promises);
            const modelPart = allProcessed[0];
            const productPart = allProcessed[1];
            const accessoryParts = allProcessed.slice(2);
            
            let finalPrompt = data.prompt;
            if (data.lockDetails) {
                finalPrompt = `
                Professional Product Compositing Task.
                [ASSETS]: Model + Product.
                [GOAL]: Seamlessly integrate Product into Model's environment.
                [CMD]: "${data.prompt}"
                `;
            }
            
            const imageB64 = await editImage(modelPart, productPart, accessoryParts, finalPrompt);
            setGeneratedImages([`data:image/png;base64,${imageB64}`]); // Only 1 image for edit mode

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi chỉnh sửa ảnh.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpscaleImage = async (data: UpscaleImageData) => {
        setTimer(0);
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setVeoPrompt(null);
        setLoadingMessage('Banana AI đang tái tạo chi tiết ảnh...');

        try {
            const originalProcessed = await processImageFile(data.originalImage);
            let faceRefProcessed = null;
            if (data.faceReferenceImage) {
                faceRefProcessed = await processImageFile(data.faceReferenceImage);
            }

            let prompt = "Upscale and Restore. Convert this low-quality image into a high-resolution 4K photo. Fix artifacts, sharpen edges, and de-noise.";
            if (data.lockDetails) {
                 if (data.faceReferenceImage) {
                     prompt += `\n\nFace Restoration Mode: Use Face Ref to reconstruct facial details accurately.`;
                 } else {
                     prompt += `\n\nEnhance facial details while preserving identity.`;
                 }
            }
            if (data.prompt) prompt += `\n\nRequest: "${data.prompt}"`;

            const imageB64 = await upscaleImage(originalProcessed, faceRefProcessed, prompt);
            setGeneratedImages([`data:image/png;base64,${imageB64}`]); // Only 1 image for upscale

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi nâng cấp ảnh.');
        } finally {
            setIsLoading(false);
        }
    };

    // If no API key, render the Input screen
    if (!apiKey) {
        return <ApiKeyInput onSave={handleSaveApiKey} />;
    }

    const tabs = [
        { id: 'generate', label: 'Tạo ảnh Chân dung / Face ID' },
        { id: 'create', label: 'Tạo ảnh Banana Nano' },
        { id: 'edit', label: 'Ghép & Chỉnh sửa ảnh' },
        { id: 'upscale', label: 'Nâng cấp & Phục hồi' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 font-sans p-2 sm:p-4 w-full">
            <div className="w-full mx-auto px-2 lg:px-6">
                <header className="flex flex-col md:flex-row items-center justify-between mb-8 pt-4 gap-4">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-3">
                             <div className="bg-indigo-600 p-2 rounded-lg">
                                <ImageIcon className="w-8 h-8 text-white" />
                             </div>
                             <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Tạo Ảnh Sản Phẩm Chuyên Nghiệp</h1>
                        </div>
                        <p className="mt-2 text-sm md:text-base text-slate-600">
                            Chủ app Tài Lê MMO: 0394342601.{' '}
                            <a href="https://zalo.me/g/drfpfr389" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 font-medium hover:underline">
                              Cộng đồng tài nguyên miễn phí TÀI LÊ MMO
                            </a>
                        </p>
                    </div>

                    <button
                        onClick={handleClearApiKey}
                        className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                        title="Xóa Key khỏi trình duyệt"
                    >
                        Đổi API Key
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 border-b pb-2 border-slate-100">Bảng điều khiển</h2>
                        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as Tab)} />
                        <div className="mt-6">
                            {activeTab === 'generate' && <ImageGenerator onGenerate={handleGenerateImage} isLoading={isLoading} />}
                            {activeTab === 'create' && <ImageCreator onCreate={handleCreateImage} isLoading={isLoading} />}
                            {activeTab === 'edit' && <ImageEditor onEdit={handleEditImage} isLoading={isLoading} />}
                            {activeTab === 'upscale' && <ImageUpscaler onUpscale={handleUpscaleImage} isLoading={isLoading} />}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 flex flex-col">
                         <h2 className="text-2xl font-bold mb-4 text-slate-800 border-b pb-2 border-slate-100">Kết quả</h2>
                        <ImageDisplay
                            isLoading={isLoading}
                            loadingMessage={loadingMessage}
                            images={generatedImages}
                            error={error}
                            timer={timer}
                            veoPrompt={veoPrompt}
                        />
                    </div>
                </div>
                 <footer className="text-center mt-12 text-slate-500 text-sm pb-6">
                    <p>Cung cấp bởi Google Banana AI (Flash 2.5). Thiết kế cho sự sáng tạo trong quảng cáo sản phẩm.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;