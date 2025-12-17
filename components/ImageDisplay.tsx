import React, { useState, useEffect } from 'react';
import { Spinner } from './ui/Spinner';
import { Button } from './ui/Button';
import { DownloadIcon, ImageIcon } from './ui/Icon';

interface ImageDisplayProps {
    isLoading: boolean;
    loadingMessage: string;
    images: string[]; // Changed from imageSrc: string | null to array
    error: string | null;
    timer: number;
    veoPrompt?: string | null;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ isLoading, loadingMessage, images, error, timer, veoPrompt }) => {
    const [copied, setCopied] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

    // Reset selection when images change
    useEffect(() => {
        if (images.length > 0) {
            setSelectedImageIndex(0);
        }
    }, [images]);

    const handleCopy = () => {
        if (veoPrompt) {
            navigator.clipboard.writeText(veoPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const currentImage = images[selectedImageIndex];

    const angleLabels = ['Toàn cảnh (Wide)', 'Trung cảnh (Medium)', 'Cận cảnh (Close-up)', 'Nghệ thuật (Artistic)'];

    return (
        <div className="w-full flex flex-col h-full">
            <div className="w-full min-h-[500px] flex-grow bg-slate-50 rounded-xl flex flex-col p-4 relative overflow-hidden border border-slate-200">
                
                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                        <Spinner />
                        <p className="mt-6 text-lg font-semibold text-slate-800 animate-pulse">{loadingMessage || 'Đang xử lý...'}</p>
                        <p className="font-mono text-2xl my-3 text-indigo-600 font-bold" aria-live="assertive">{formatTime(timer)}</p>
                        <p className="text-sm text-slate-500">Đang tạo 4 góc máy cùng lúc...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                        <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-100">
                            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="font-bold text-red-800 text-lg mb-1">Đã xảy ra lỗi</p>
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* Content State */}
                {images.length > 0 && !isLoading && (
                     <div className="flex flex-col h-full gap-4">
                        {/* Main Viewer */}
                        <div className="flex-1 relative bg-checkerboard rounded-lg overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center min-h-[300px]">
                             <img src={currentImage} alt="Generated Main" className="max-w-full max-h-full object-contain" />
                             <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {images.length > 1 ? angleLabels[selectedImageIndex] || `Ảnh #${selectedImageIndex + 1}` : 'Kết quả'}
                             </div>
                        </div>

                        {/* Controls & Thumbnails */}
                        <div className="flex flex-col gap-4">
                            {/* Thumbnails Grid */}
                            {images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                                selectedImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-400'
                                            }`}
                                        >
                                            <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white text-center py-0.5 truncate px-1">
                                                {angleLabels[idx] || `#${idx + 1}`}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Download Button */}
                            <div className="text-center w-full">
                                <a
                                    href={currentImage}
                                    download={`banana-ai-${selectedImageIndex}-${new Date().getTime()}.jpg`}
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform hover:scale-105 w-full sm:w-auto"
                                >
                                    <DownloadIcon className="w-5 h-5 mr-2"/>
                                    Tải ảnh này về
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && images.length === 0 && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-4">
                                <ImageIcon className="w-16 h-16 text-slate-300"/>
                            </div>
                            <p className="text-xl font-semibold text-slate-700 mb-2">Không gian sáng tạo</p>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">Kết quả 4 góc máy sẽ xuất hiện tại đây.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Veo3 Video Prompt Display */}
            {veoPrompt && !isLoading && !error && (
                <div className="mt-6 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl p-5 text-white shadow-lg border border-indigo-500/30">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                             <span className="text-2xl">🎥</span>
                             <h3 className="font-bold text-lg">Gợi ý Prompt Video (Veo3)</h3>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                copied 
                                ? 'bg-green-500 text-white' 
                                : 'bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/20'
                            }`}
                        >
                            {copied ? 'Đã sao chép!' : 'Sao chép Prompt'}
                        </button>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                        <p className="font-mono text-sm text-indigo-100 leading-relaxed selection:bg-indigo-500 selection:text-white">
                            {veoPrompt}
                        </p>
                    </div>
                    <p className="text-xs text-indigo-300 mt-2 opacity-80">
                        Dùng prompt này để tạo video quảng cáo sản phẩm chất lượng cao với Google Veo.
                    </p>
                </div>
            )}
            
             {images.length > 0 && !isLoading && (
                <div className="mt-4 pt-4 border-t border-slate-200 w-full text-center">
                    <p className="mb-1 text-sm font-medium text-slate-700">Cần hỗ trợ?</p>
                    <p>
                        <a href="https://zalo.me/g/drfpfr389" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-medium">
                            Cộng đồng tài nguyên miễn phí TÀI LÊ MMO
                        </a>
                    </p>
                </div>
             )}
        </div>
    );
};