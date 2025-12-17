import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import type { UpscaleImageData } from '../types';
import { SparklesIcon, UploadIcon, ImageIcon } from './ui/Icon';

interface ImageUpscalerProps {
    onUpscale: (data: UpscaleImageData) => void;
    isLoading: boolean;
}

export const ImageUpscaler: React.FC<ImageUpscalerProps> = ({ onUpscale, isLoading }) => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    
    const [faceImage, setFaceImage] = useState<File | null>(null);
    const [facePreview, setFacePreview] = useState<string | null>(null);
    
    const [lockDetails, setLockDetails] = useState<boolean>(true);
    const [optionalPrompt, setOptionalPrompt] = useState<string>('');

    const originalInputRef = useRef<HTMLInputElement>(null);
    const faceInputRef = useRef<HTMLInputElement>(null);

    const handleOriginalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setOriginalImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setOriginalPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleFaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFaceImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setFacePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeOriginal = () => {
        setOriginalImage(null);
        setOriginalPreview(null);
        if (originalInputRef.current) originalInputRef.current.value = '';
    };

    const removeFace = () => {
        setFaceImage(null);
        setFacePreview(null);
        if (faceInputRef.current) faceInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (originalImage) {
            onUpscale({
                originalImage,
                faceReferenceImage: faceImage,
                lockDetails,
                prompt: optionalPrompt
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg flex-shrink-0">
                         <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900">Nâng cấp chất lượng ảnh (AI Upscale)</h3>
                        <p className="text-sm text-indigo-700 mt-1">Làm nét ảnh mờ, tăng độ phân giải và phục hồi chi tiết.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Original Image Input */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        1. Ảnh gốc cần nâng cấp
                    </label>
                    <input
                        type="file"
                        ref={originalInputRef}
                        accept="image/*"
                        onChange={handleOriginalChange}
                        className="hidden"
                    />
                    {!originalPreview ? (
                        <div
                            onClick={() => originalInputRef.current?.click()}
                            className="w-full h-56 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition"
                        >
                            <UploadIcon className="w-10 h-10 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500">Tải ảnh gốc (mờ, thấp)</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-56 border border-slate-200 rounded-lg overflow-hidden group">
                            <img src={originalPreview} alt="Original" className="w-full h-full object-contain bg-slate-100" />
                            <button
                                type="button"
                                onClick={removeOriginal}
                                className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow hover:bg-red-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Face Reference Input */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        2. Ảnh rõ mặt (Để phục hồi mặt)
                    </label>
                    <input
                        type="file"
                        ref={faceInputRef}
                        accept="image/*"
                        onChange={handleFaceChange}
                        className="hidden"
                    />
                    {!facePreview ? (
                        <div
                            onClick={() => faceInputRef.current?.click()}
                            className="w-full h-56 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition"
                        >
                            <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500">Tải ảnh mặt rõ nét (Tùy chọn)</span>
                            <span className="text-xs text-slate-400 mt-1 text-center px-4">Giúp AI vẽ lại mặt chính xác hơn</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-56 border border-slate-200 rounded-lg overflow-hidden group">
                            <img src={facePreview} alt="Face Ref" className="w-full h-full object-contain bg-slate-100" />
                            <button
                                type="button"
                                onClick={removeFace}
                                className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow hover:bg-red-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lock Details Toggle */}
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div>
                    <label className="text-sm font-bold text-slate-900 block">
                        🔐 Khóa chi tiết khuôn mặt
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                        {faceImage 
                            ? "Sử dụng ảnh mặt tham chiếu để khôi phục chính xác nhận dạng." 
                            : "Cố gắng giữ nét mặt giống ảnh gốc nhất có thể."}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={lockDetails}
                    onClick={() => setLockDetails(!lockDetails)}
                    className={`relative inline-flex flex-shrink-0 items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        lockDetails ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${
                            lockDetails ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {/* Optional Prompt */}
            <div>
                 <label htmlFor="upscale-prompt" className="block text-sm font-semibold text-slate-700 mb-2">
                    Mô tả bổ sung (Tùy chọn)
                </label>
                <textarea
                    id="upscale-prompt"
                    rows={2}
                    className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-slate-400 shadow-sm text-sm"
                    value={optionalPrompt}
                    onChange={(e) => setOptionalPrompt(e.target.value)}
                    placeholder="Ví dụ: Làm da mịn màng, tăng độ sáng, làm nét tóc..."
                />
            </div>

            <Button type="submit" disabled={isLoading || !originalImage} className="w-full py-4 text-lg">
                <SparklesIcon className="w-6 h-6 mr-2" />
                {isLoading ? 'Đang nâng cấp ảnh...' : 'Nâng cấp & Làm nét ảnh'}
            </Button>
        </form>
    );
};