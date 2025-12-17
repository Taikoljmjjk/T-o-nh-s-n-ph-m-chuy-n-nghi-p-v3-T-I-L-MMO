import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import type { EditImageData } from '../types';
import { EditIcon, UploadIcon, WandIcon, ShirtIcon } from './ui/Icon';
import { removeBackgroundImage, separateClothing } from '../services/geminiService';
import { processImageFile } from '../utils/fileUtils';

interface ImageEditorProps {
    onEdit: (data: EditImageData) => void;
    isLoading: boolean;
}

const ImageUpload: React.FC<{
    id: string;
    label: string;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    preview: string | null;
}> = ({ id, label, onFileSelect, onClear, preview }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <div
                className="relative w-full h-56 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition bg-white"
                onClick={() => inputRef.current?.click()}
            >
                <input
                    type="file"
                    id={id}
                    ref={inputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="h-full w-full object-contain p-2" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="absolute top-2 right-2 bg-white text-slate-700 rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-600 border border-slate-200"
                            aria-label="Xóa ảnh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <div className="text-center text-slate-400">
                        <UploadIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">Nhấn để tải ảnh lên</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ onEdit, isLoading }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [modelImage, setModelImage] = useState<File | null>(null);
    const [productImage, setProductImage] = useState<File | null>(null);
    const [accessoryImage1, setAccessoryImage1] = useState<File | null>(null);
    const [accessoryImage2, setAccessoryImage2] = useState<File | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [accessory1Preview, setAccessory1Preview] = useState<string | null>(null);
    const [accessory2Preview, setAccessory2Preview] = useState<string | null>(null);
    const [lockDetails, setLockDetails] = useState<boolean>(true);
    
    const [isRemovingModelBackground, setIsRemovingModelBackground] = useState<boolean>(false);
    const [modelBgRemovalError, setModelBgRemovalError] = useState<string | null>(null);
    const [isSeparatingModelClothing, setIsSeparatingModelClothing] = useState<boolean>(false);
    const [modelClothingSeparationError, setModelClothingSeparationError] = useState<string | null>(null);

    const [isRemovingProductBackground, setIsRemovingProductBackground] = useState<boolean>(false);
    const [productBgRemovalError, setProductBgRemovalError] = useState<string | null>(null);
    
    const [isRemovingAccessory1Background, setIsRemovingAccessory1Background] = useState<boolean>(false);
    const [accessory1BgRemovalError, setAccessory1BgRemovalError] = useState<string | null>(null);

    const [isRemovingAccessory2Background, setIsRemovingAccessory2Background] = useState<boolean>(false);
    const [accessory2BgRemovalError, setAccessory2BgRemovalError] = useState<string | null>(null);

    const handleFileSelect = (file: File, type: 'model' | 'product' | 'accessory1' | 'accessory2') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'model') {
                setModelImage(file);
                setModelPreview(reader.result as string);
                setModelBgRemovalError(null);
                setModelClothingSeparationError(null);
            } else if (type === 'product') {
                setProductImage(file);
                setProductPreview(reader.result as string);
                setProductBgRemovalError(null);
            } else if (type === 'accessory1') {
                setAccessoryImage1(file);
                setAccessory1Preview(reader.result as string);
                setAccessory1BgRemovalError(null);
            } else { // accessory2
                setAccessoryImage2(file);
                setAccessory2Preview(reader.result as string);
                setAccessory2BgRemovalError(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleClearModelImage = () => {
        setModelImage(null);
        setModelPreview(null);
        setModelBgRemovalError(null);
        setModelClothingSeparationError(null);
    };

    const handleClearProductImage = () => {
        setProductImage(null);
        setProductPreview(null);
        setProductBgRemovalError(null);
    };

    const handleClearAccessory1Image = () => {
        setAccessoryImage1(null);
        setAccessory1Preview(null);
        setAccessory1BgRemovalError(null);
    };

    const handleClearAccessory2Image = () => {
        setAccessoryImage2(null);
        setAccessory2Preview(null);
        setAccessory2BgRemovalError(null);
    };

    const handleRemoveModelBackground = async () => {
        if (!modelImage) {
            setModelBgRemovalError("Không tìm thấy ảnh người mẫu.");
            return;
        }
        setIsRemovingModelBackground(true);
        setModelBgRemovalError(null);
        setModelClothingSeparationError(null);
        try {
            const imagePart = await processImageFile(modelImage);
            const resultB64 = await removeBackgroundImage(imagePart);
            
            const newPreview = `data:image/png;base64,${resultB64}`;
            const blob = await (await fetch(newPreview)).blob();
            const newFile = new File([blob], "model-no-bg.png", { type: "image/png" });

            setModelImage(newFile);
            setModelPreview(newPreview);

        } catch (err) {
             setModelBgRemovalError(err instanceof Error ? err.message : "Lỗi không xác định khi xóa nền.");
        } finally {
            setIsRemovingModelBackground(false);
        }
    };

    const handleSeparateModelClothing = async () => {
        if (!modelImage) {
            setModelClothingSeparationError("Không tìm thấy ảnh người mẫu.");
            return;
        }
        setIsSeparatingModelClothing(true);
        setModelClothingSeparationError(null);
        setModelBgRemovalError(null);
        try {
            const imagePart = await processImageFile(modelImage);
            const resultB64 = await separateClothing(imagePart);
            
            const newPreview = `data:image/png;base64,${resultB64}`;
            const blob = await (await fetch(newPreview)).blob();
            const newFile = new File([blob], "model-clothing.png", { type: "image/png" });

            setModelImage(newFile);
            setModelPreview(newPreview);

        } catch (err) {
             setModelClothingSeparationError(err instanceof Error ? err.message : "Lỗi không xác định khi tách trang phục.");
        } finally {
            setIsSeparatingModelClothing(false);
        }
    };
    
    const handleRemoveProductBackground = async () => {
        if (!productImage) {
            setProductBgRemovalError("Không tìm thấy ảnh sản phẩm.");
            return;
        }
        setIsRemovingProductBackground(true);
        setProductBgRemovalError(null);
        try {
            const imagePart = await processImageFile(productImage);
            const resultB64 = await removeBackgroundImage(imagePart);
            
            const newPreview = `data:image/png;base64,${resultB64}`;
            const blob = await (await fetch(newPreview)).blob();
            const newFile = new File([blob], "product-no-bg.png", { type: "image/png" });

            setProductImage(newFile);
            setProductPreview(newPreview);

        } catch (err) {
             setProductBgRemovalError(err instanceof Error ? err.message : "Lỗi không xác định khi xóa nền.");
        } finally {
            setIsRemovingProductBackground(false);
        }
    };
    
    const handleRemoveAccessory1Background = async () => {
        if (!accessoryImage1) {
            setAccessory1BgRemovalError("Không tìm thấy ảnh phụ kiện.");
            return;
        }
        setIsRemovingAccessory1Background(true);
        setAccessory1BgRemovalError(null);
        try {
            const imagePart = await processImageFile(accessoryImage1);
            const resultB64 = await removeBackgroundImage(imagePart);
            
            const newPreview = `data:image/png;base64,${resultB64}`;
            const blob = await (await fetch(newPreview)).blob();
            const newFile = new File([blob], "accessory1-no-bg.png", { type: "image/png" });

            setAccessoryImage1(newFile);
            setAccessory1Preview(newPreview);

        } catch (err) {
             setAccessory1BgRemovalError(err instanceof Error ? err.message : "Lỗi không xác định khi xóa nền.");
        } finally {
            setIsRemovingAccessory1Background(false);
        }
    };

    const handleRemoveAccessory2Background = async () => {
        if (!accessoryImage2) {
            setAccessory2BgRemovalError("Không tìm thấy ảnh phụ kiện.");
            return;
        }
        setIsRemovingAccessory2Background(true);
        setAccessory2BgRemovalError(null);
        try {
            const imagePart = await processImageFile(accessoryImage2);
            const resultB64 = await removeBackgroundImage(imagePart);
            
            const newPreview = `data:image/png;base64,${resultB64}`;
            const blob = await (await fetch(newPreview)).blob();
            const newFile = new File([blob], "accessory2-no-bg.png", { type: "image/png" });

            setAccessoryImage2(newFile);
            setAccessory2Preview(newPreview);

        } catch (err) {
             setAccessory2BgRemovalError(err instanceof Error ? err.message : "Lỗi không xác định khi xóa nền.");
        } finally {
            setIsRemovingAccessory2Background(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onEdit({ prompt, modelImage, productImage, accessoryImage1, accessoryImage2, lockDetails });
    };

    // Secondary button component for this form
    const SecondaryButton = ({ onClick, disabled, children, icon: Icon }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center justify-center py-2 px-3 border border-indigo-200 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <ImageUpload 
                            id="model-upload" 
                            label="1. Tải ảnh người mẫu" 
                            onFileSelect={(file) => handleFileSelect(file, 'model')} 
                            onClear={handleClearModelImage}
                            preview={modelPreview} 
                        />
                         {modelPreview && (
                             <div className="mt-2 space-y-2">
                                <SecondaryButton 
                                    onClick={handleRemoveModelBackground}
                                    disabled={isLoading || isRemovingModelBackground || isSeparatingModelClothing}
                                    icon={WandIcon}
                                >
                                    {isRemovingModelBackground ? 'Đang xóa nền...' : 'Xóa nền người mẫu'}
                                </SecondaryButton>
                                {modelBgRemovalError && <p className="text-xs text-red-500 mt-1">{modelBgRemovalError}</p>}
                                
                                <SecondaryButton 
                                    onClick={handleSeparateModelClothing}
                                    disabled={isLoading || isRemovingModelBackground || isSeparatingModelClothing}
                                    icon={ShirtIcon}
                                >
                                    {isSeparatingModelClothing ? 'Đang tách...' : 'Tách trang phục'}
                                </SecondaryButton>
                                {modelClothingSeparationError && <p className="text-xs text-red-500 mt-1">{modelClothingSeparationError}</p>}
                            </div>
                        )}
                    </div>
                    <div>
                        <ImageUpload 
                            id="product-upload" 
                            label="2. Tải ảnh sản phẩm" 
                            onFileSelect={(file) => handleFileSelect(file, 'product')} 
                            onClear={handleClearProductImage}
                            preview={productPreview} 
                        />
                        {productPreview && (
                             <div className="mt-2">
                                <SecondaryButton 
                                    onClick={handleRemoveProductBackground}
                                    disabled={isLoading || isRemovingProductBackground}
                                    icon={WandIcon}
                                >
                                    {isRemovingProductBackground ? 'Đang xóa nền...' : 'Xóa nền sản phẩm'}
                                </SecondaryButton>
                                {productBgRemovalError && <p className="text-xs text-red-500 mt-1">{productBgRemovalError}</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <ImageUpload 
                            id="accessory1-upload" 
                            label="3. Tải ảnh phụ kiện 1 (Tùy chọn)" 
                            onFileSelect={(file) => handleFileSelect(file, 'accessory1')} 
                            onClear={handleClearAccessory1Image}
                            preview={accessory1Preview} 
                        />
                        {accessory1Preview && (
                             <div className="mt-2">
                                <SecondaryButton 
                                    onClick={handleRemoveAccessory1Background}
                                    disabled={isLoading || isRemovingAccessory1Background}
                                    icon={WandIcon}
                                >
                                    {isRemovingAccessory1Background ? 'Đang xóa nền...' : 'Xóa nền phụ kiện'}
                                </SecondaryButton>
                                {accessory1BgRemovalError && <p className="text-xs text-red-500 mt-1">{accessory1BgRemovalError}</p>}
                            </div>
                        )}
                    </div>
                     <div>
                        <ImageUpload 
                            id="accessory2-upload" 
                            label="4. Tải ảnh phụ kiện 2 (Tùy chọn)" 
                            onFileSelect={(file) => handleFileSelect(file, 'accessory2')} 
                            onClear={handleClearAccessory2Image}
                            preview={accessory2Preview} 
                        />
                        {accessory2Preview && (
                             <div className="mt-2">
                                 <SecondaryButton 
                                    onClick={handleRemoveAccessory2Background}
                                    disabled={isLoading || isRemovingAccessory2Background}
                                    icon={WandIcon}
                                >
                                    {isRemovingAccessory2Background ? 'Đang xóa nền...' : 'Xóa nền phụ kiện'}
                                </SecondaryButton>
                                {accessory2BgRemovalError && <p className="text-xs text-red-500 mt-1">{accessory2BgRemovalError}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div>
                    <label htmlFor="lock-details-edit" className="text-sm font-semibold text-indigo-900 block">
                        Khóa chi tiết khuôn mặt
                    </label>
                    <p className="text-xs text-indigo-700 mt-1">Bảo toàn đặc điểm người mẫu khi kết hợp sản phẩm.</p>
                </div>
                <button
                    type="button"
                    id="lock-details-edit"
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

            <div>
                <label htmlFor="prompt-edit" className="block text-sm font-semibold text-slate-700 mb-2">
                    5. Yêu cầu chỉnh sửa (Prompt)
                </label>
                <textarea
                    id="prompt-edit"
                    rows={4}
                    className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-slate-400 shadow-sm"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Đặt lọ kem nền này lên bàn trang điểm bên cạnh người mẫu..."
                />
                <p className="mt-2 text-xs text-slate-500">Mô tả cách bạn muốn AI kết hợp và chỉnh sửa hai hình ảnh.</p>
            </div>

            <div className="pt-2">
                <Button type="submit" disabled={isLoading || !modelImage || !productImage} className="w-full">
                    <EditIcon className="w-5 h-5 mr-2"/>
                    {isLoading ? 'Đang xử lý...' : 'Chỉnh sửa & Kết hợp'}
                </Button>
            </div>
        </form>
    );
};