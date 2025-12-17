import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import type { GenerateImageData } from '../types';
import { GenerateIcon, UploadIcon, KeyIcon, WandIcon, ShirtIcon, SparklesIcon } from './ui/Icon';
import { removeBackgroundImage } from '../services/geminiService';
import { processImageFile } from '../utils/fileUtils';

interface ImageGeneratorProps {
    onGenerate: (data: GenerateImageData) => void;
    isLoading: boolean;
}

const PROMPT_MAX_LENGTH = 1000;

const ASPECT_RATIOS = [
    { id: '1:1', label: 'Vuông (1:1)', icon: '⬜' },
    { id: '3:4', label: 'Chân dung (3:4)', icon: '▯' },
    { id: '9:16', label: 'Story (9:16)', icon: '📱' },
    { id: '4:3', label: 'Ngang (4:3)', icon: '▬' },
    { id: '16:9', label: 'Youtube (16:9)', icon: '💻' },
];

const VIDEO_STYLES = [
    { id: 'Cinematic Luxury', label: '✨ Cinematic Luxury (Sang trọng, Điện ảnh)', desc: 'Chuyển động mượt mà, ánh sáng studio, nhạc nền du dương.' },
    { id: 'Fast Paced TikTok', label: '⚡ Fast Paced / TikTok (Nhịp nhanh, Trendy)', desc: 'Cắt cảnh nhanh, hiệu ứng giật, phù hợp giới trẻ.' },
    { id: 'Macro Detail', label: '🔍 Macro / Slow Motion (Cận cảnh chi tiết)', desc: 'Quay chậm, focus vào chất liệu và chi tiết sản phẩm.' },
    { id: 'Minimalist Studio', label: '⚪ Minimalist Clean (Tối giản, Sạch sẽ)', desc: 'Phông nền đơn sắc, chuyển động nhẹ nhàng, tinh tế.' },
    { id: 'Neon Cyberpunk', label: '🌃 Neon Cyberpunk (Hiện đại, Công nghệ)', desc: 'Ánh sáng neon, tương phản cao, nhạc điện tử.' },
    { id: 'Nature Organic', label: '🌿 Nature / Organic (Thiên nhiên, Tươi mát)', desc: 'Ánh sáng tự nhiên, gió thổi nhẹ, cảm giác trong lành.' },
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onGenerate, isLoading }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [sourceImages, setSourceImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [outfitImage, setOutfitImage] = useState<File | null>(null);
    const [outfitPreview, setOutfitPreview] = useState<string | null>(null);
    const [accessoryImage, setAccessoryImage] = useState<File | null>(null);
    const [accessoryPreview, setAccessoryPreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('3:4'); // Default to Portrait for Face ID
    const [videoStyle, setVideoStyle] = useState<string>(VIDEO_STYLES[0].id);
    const [processingImageIndex, setProcessingImageIndex] = useState<number | null>(null);
    
    // Default to true for better results since we removed template
    const [lockDetails, setLockDetails] = useState<boolean>(true);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const outfitInputRef = useRef<HTMLInputElement>(null);
    const accessoryInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            setSourceImages(prev => [...prev, ...files]);

            for (const file of files) {
                if (file instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            setPreviews(prev => [...prev, e.target.result as string]);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };
    
    const handleOutfitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setOutfitImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setOutfitPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAccessoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setAccessoryImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setAccessoryPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = (indexToRemove: number) => {
        setSourceImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeOutfit = () => {
        setOutfitImage(null);
        setOutfitPreview(null);
        if (outfitInputRef.current) outfitInputRef.current.value = '';
    };

    const removeAccessory = () => {
        setAccessoryImage(null);
        setAccessoryPreview(null);
        if (accessoryInputRef.current) accessoryInputRef.current.value = '';
    };

    const handleRemoveBackground = async (index: number) => {
        const file = sourceImages[index];
        if (!file) return;

        setProcessingImageIndex(index);
        try {
            // Use processImageFile to convert AVIF/unsupported types to JPEG before sending
            const imagePart = await processImageFile(file);
            
            // Call API to remove background
            const resultBase64 = await removeBackgroundImage(imagePart);
            
            // Convert result back to File object
            const byteCharacters = atob(resultBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const newFile = new File([byteArray], `nobg-${file.name.replace(/\.[^/.]+$/, "")}.png`, { type: 'image/png' });
            
            // Create new preview URL
            const newPreviewUrl = `data:image/png;base64,${resultBase64}`;

            // Update state
            setSourceImages(prev => {
                const newArr = [...prev];
                newArr[index] = newFile;
                return newArr;
            });
            setPreviews(prev => {
                const newArr = [...prev];
                newArr[index] = newPreviewUrl;
                return newArr;
            });

        } catch (error) {
            console.error("Failed to remove background:", error);
            alert("Không thể xóa nền ảnh này. Vui lòng thử lại.");
        } finally {
            setProcessingImageIndex(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            // Send null for templateImage as it's removed
            onGenerate({ 
                prompt, 
                sourceImages, 
                templateImage: null, 
                outfitImage,
                accessoryImage,
                lockDetails,
                aspectRatio,
                videoStyle
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg flex-shrink-0 shadow-sm">
                         <KeyIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-purple-900">Công nghệ Deep-ID Lora (V7 Alpha)</h3>
                            <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">LORA ADAPTER</span>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">Kích hoạt Adapter Low-Rank để "train" nóng dữ liệu khuôn mặt vào bộ nhớ đệm AI.</p>
                    </div>
                </div>
            </div>

            {/* NEW: Multi-angle Guidance */}
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                 <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <span className="text-xl">📸</span>
                    <h3>Yêu cầu dữ liệu Lora (3 Góc độ)</h3>
                 </div>
                 <p className="text-sm text-amber-800">
                    Để Lora Adapter học được cấu trúc 3D của khuôn mặt, vui lòng tải lên <b>ít nhất 3 ảnh</b> theo hướng dẫn:
                 </p>
                 <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-2 text-lg">👤</div>
                        <span className="text-xs font-bold text-slate-700">1. Chính diện</span>
                        <span className="text-[10px] text-slate-500">Nhìn thẳng</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-2 text-lg">⬅️</div>
                        <span className="text-xs font-bold text-slate-700">2. Góc trái</span>
                        <span className="text-[10px] text-slate-500">Nghiêng 45°</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-2 text-lg">➡️</div>
                        <span className="text-xs font-bold text-slate-700">3. Góc phải</span>
                        <span className="text-[10px] text-slate-500">Nghiêng 45°</span>
                    </div>
                 </div>
            </div>

            {/* Section 1: Face Upload */}
            <div>
                 <label htmlFor="source-images-upload" className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-1">
                    <span>1. Tải ảnh khuôn mặt (Dataset)</span>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sourceImages.length >= 3 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {sourceImages.length >= 3 ? '✅ Đủ dữ liệu train' : `Đã chọn: ${sourceImages.length}/3`}
                    </span>
                </label>
                <p className="text-xs text-slate-500 mb-3">Sử dụng công cụ xóa nền để khuôn mặt rõ nét hơn.</p>

                <input
                    type="file"
                    id="source-images-upload"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex justify-center items-center px-4 py-8 border-2 border-dashed rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${sourceImages.length >= 3 ? 'border-green-300 bg-green-50 hover:bg-green-100' : 'border-slate-300 bg-white hover:bg-purple-50 hover:border-purple-400'}`}
                >
                    <div className="text-center">
                        <UploadIcon className={`w-8 h-8 mx-auto mb-2 ${sourceImages.length >= 3 ? 'text-green-500' : 'text-purple-400'}`}/>
                        <span className={`block font-semibold ${sourceImages.length >= 3 ? 'text-green-700' : 'text-purple-600'}`}>
                            {sourceImages.length >= 3 ? 'Đã tải lên đủ ảnh' : 'Nhấn để tải Dataset'}
                        </span>
                         {sourceImages.length < 3 && <span className="text-xs text-slate-400 mt-1">Chọn cùng lúc nhiều ảnh</span>}
                    </div>
                </button>

                 {previews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {previews.map((src, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-sm border border-slate-200" />
                                
                                {/* Image Overlay Controls */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveBackground(index)}
                                        className="bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition-colors"
                                        title="Xóa nền ảnh này"
                                        disabled={processingImageIndex === index}
                                    >
                                        {processingImageIndex === index ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <WandIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                        title="Xóa ảnh"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1 rounded-br">#{index + 1}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 2 & 3: Outfit and Accessory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Outfit Upload */}
                <div>
                     <label htmlFor="outfit-upload" className="block text-sm font-semibold text-slate-700 mb-1">
                        2. Tải ảnh trang phục (Outfit)
                    </label>
                    <input
                        type="file"
                        id="outfit-upload"
                        ref={outfitInputRef}
                        accept="image/*"
                        onChange={handleOutfitChange}
                        className="hidden"
                    />
                     {!outfitPreview ? (
                        <div
                            onClick={() => outfitInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-purple-400 transition"
                        >
                            <ShirtIcon className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 text-center px-2">Nhấn để tải trang phục</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-40 border border-slate-200 rounded-lg overflow-hidden group bg-slate-50">
                            <img src={outfitPreview} alt="Outfit" className="w-full h-full object-contain" />
                            <button
                                type="button"
                                onClick={removeOutfit}
                                className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow hover:bg-red-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Accessory Upload */}
                <div>
                     <label htmlFor="accessory-upload" className="block text-sm font-semibold text-slate-700 mb-1">
                        3. Tải ảnh phụ kiện (Option)
                    </label>
                    <input
                        type="file"
                        id="accessory-upload"
                        ref={accessoryInputRef}
                        accept="image/*"
                        onChange={handleAccessoryChange}
                        className="hidden"
                    />
                     {!accessoryPreview ? (
                        <div
                            onClick={() => accessoryInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-purple-400 transition"
                        >
                            <SparklesIcon className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 text-center px-2">Túi xách, đồng hồ, giày...</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-40 border border-slate-200 rounded-lg overflow-hidden group bg-slate-50">
                            <img src={accessoryPreview} alt="Accessory" className="w-full h-full object-contain" />
                            <button
                                type="button"
                                onClick={removeAccessory}
                                className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow hover:bg-red-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {sourceImages.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm ring-1 ring-slate-100">
                    <div>
                        <label htmlFor="lock-details-generate" className="text-sm font-bold text-slate-900 block flex items-center">
                            <span className="mr-2">🧬</span> Kích hoạt Lora Face Adapter
                        </label>
                         <p className="text-xs text-slate-500 mt-1">Train nóng dữ liệu khuôn mặt vào bộ nhớ đệm để tăng độ giống.</p>
                    </div>
                    
                    <button
                        type="button"
                        id="lock-details-generate"
                        role="switch"
                        aria-checked={lockDetails}
                        onClick={() => setLockDetails(!lockDetails)}
                        className={`relative inline-flex flex-shrink-0 items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                            lockDetails ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${
                                lockDetails ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            )}
            
            {/* Video Style Selection - NEW for Face ID */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label htmlFor="video-style-faceid" className="block text-sm font-semibold text-slate-700 mb-2">
                    4. Phong cách quảng cáo Veo3 (Để tạo Prompt Video)
                </label>
                <div className="relative">
                    <select
                        id="video-style-faceid"
                        value={videoStyle}
                        onChange={(e) => setVideoStyle(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none shadow-sm cursor-pointer"
                    >
                        {VIDEO_STYLES.map((style) => (
                            <option key={style.id} value={style.id}>
                                {style.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
                <p className="mt-2 text-xs text-purple-600">
                    *Tự động tạo prompt video quảng cáo dựa trên ảnh đã tạo.
                </p>
            </div>

            <div>
                <label htmlFor="prompt-generate" className="block text-sm font-semibold text-slate-700 mb-2">
                    5. Mô tả bối cảnh (Context)
                </label>
                <textarea
                    id="prompt-generate"
                    rows={5}
                    className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition placeholder-slate-400 shadow-sm"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Đang đi dạo trên đường phố Paris mùa thu, ánh nắng vàng rực rỡ, phong cách thời trang đường phố (street style)..."
                    maxLength={PROMPT_MAX_LENGTH}
                />
                 <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>Mẹo: Ảnh gốc càng nét và rõ mặt thì kết quả càng giống.</span>
                     <span className={prompt.length > PROMPT_MAX_LENGTH - 100 ? 'text-red-500' : ''}>
                        {prompt.length}/{PROMPT_MAX_LENGTH}
                    </span>
                 </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    6. Kích thước ảnh đầu ra
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.id}
                            type="button"
                            onClick={() => setAspectRatio(ratio.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                aspectRatio === ratio.id
                                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                        >
                            <span className="text-xl mb-1">{ratio.icon}</span>
                            <span className="text-xs font-bold">{ratio.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none shadow-lg">
                    <GenerateIcon className="w-6 h-6 mr-2" />
                    {isLoading ? 'Đang train Lora...' : 'Tạo ảnh với Lora Face'}
                </Button>
            </div>
        </form>
    );
};