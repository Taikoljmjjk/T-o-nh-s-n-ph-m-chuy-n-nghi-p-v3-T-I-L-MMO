import React from 'react';

interface Tab {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            relative px-4 py-3 sm:px-6 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-200
                            uppercase tracking-wide flex-grow sm:flex-grow-0 text-center
                            ${
                                activeTab === tab.id
                                    ? 'bg-green-400 text-blue-900 translate-y-1 shadow-inner border-b-0 ring-2 ring-green-300' // Trạng thái đang chọn: Nhấn xuống
                                    : 'bg-green-400 text-blue-800 border-b-[6px] border-green-700 hover:bg-green-300 hover:-translate-y-0.5 hover:border-b-[7px]' // Trạng thái bình thường: Nổi 3D
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};