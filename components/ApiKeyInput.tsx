import React, { useState } from 'react';
import { Button } from './ui/Button';
import { KeyIcon } from './ui/Icon';

interface ApiKeyInputProps {
    onSave: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSave }) => {
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputKey.trim()) {
            setError('Vui lòng nhập API Key.');
            return;
        }
        if (!inputKey.startsWith('AIza')) {
            setError('API Key không hợp lệ (thường bắt đầu bằng "AIza").');
            return;
        }
        onSave(inputKey.trim());
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-slate-200 p-8">
                <div className="text-center mb-8">
                    <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <KeyIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Cấu hình Google Gemini API</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        Ứng dụng chạy trực tiếp trên trình duyệt của bạn. API Key được lưu an toàn trong Local Storage và không bao giờ được gửi đi đâu khác ngoài server Google.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-bold text-slate-700 mb-2">
                            Nhập Gemini API Key của bạn
                        </label>
                        <input
                            type="password"
                            id="apiKey"
                            value={inputKey}
                            onChange={(e) => {
                                setInputKey(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="AIzaSy..."
                        />
                        {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-bold mb-1 flex items-center">
                            <span className="bg-blue-200 text-blue-700 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs mr-2">?</span>
                            Chưa có API Key?
                        </p>
                        <ol className="list-decimal list-inside space-y-1 ml-1 text-blue-700/80">
                            <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-blue-900">Google AI Studio</a>.</li>
                            <li>Đăng nhập tài khoản Google.</li>
                            <li>Nhấn nút <b>"Create API key"</b>.</li>
                            <li>Sao chép mã Key và dán vào ô bên trên.</li>
                        </ol>
                    </div>

                    <Button type="submit" className="w-full py-4 text-lg shadow-lg shadow-indigo-200">
                        Lưu & Bắt đầu sử dụng
                    </Button>
                </form>

                <div className="mt-6 text-center border-t border-slate-100 pt-4">
                     <p className="text-xs text-slate-400">
                        Powered by Google Gemini 2.5 Flash
                    </p>
                </div>
            </div>
        </div>
    );
};