import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import type { CreateImageData } from '../types';
import { PaletteIcon, UploadIcon, ShirtIcon, WandIcon } from './ui/Icon';
import { separateClothing } from '../services/geminiService';
import { processImageFile } from '../utils/fileUtils';

interface ImageCreatorProps {
    onCreate: (data: CreateImageData) => void;
    isLoading: boolean;
}

const ASPECT_RATIOS = [
    { id: '1:1', label: 'Vuông (1:1)', icon: '⬜' },
    { id: '16:9', label: 'Ngang (16:9)', icon: '▭' },
    { id: '9:16', label: 'Dọc (9:16)', icon: '▯' },
    { id: '4:3', label: 'Ngang (4:3)', icon: '▬' },
    { id: '3:4', label: 'Dọc (3:4)', icon: '▮' },
];

const VIDEO_STYLES = [
    { id: 'Cinematic Luxury', label: '✨ Cinematic Luxury (Sang trọng, Điện ảnh)', desc: 'Chuyển động mượt mà, ánh sáng studio, nhạc nền du dương.' },
    { id: 'Fast Paced TikTok', label: '⚡ Fast Paced / TikTok (Nhịp nhanh, Trendy)', desc: 'Cắt cảnh nhanh, hiệu ứng giật, phù hợp giới trẻ.' },
    { id: 'Macro Detail', label: '🔍 Macro / Slow Motion (Cận cảnh chi tiết)', desc: 'Quay chậm, focus vào chất liệu và chi tiết sản phẩm.' },
    { id: 'Minimalist Studio', label: '⚪ Minimalist Clean (Tối giản, Sạch sẽ)', desc: 'Phông nền đơn sắc, chuyển động nhẹ nhàng, tinh tế.' },
    { id: 'Neon Cyberpunk', label: '🌃 Neon Cyberpunk (Hiện đại, Công nghệ)', desc: 'Ánh sáng neon, tương phản cao, nhạc điện tử.' },
    { id: 'Nature Organic', label: '🌿 Nature / Organic (Thiên nhiên, Tươi mát)', desc: 'Ánh sáng tự nhiên, gió thổi nhẹ, cảm giác trong lành.' },
];

const POSING_GROUPS = [
    {
        label: "A. Dáng Di Chuyển & Chuyển Động (Movement)",
        options: [
            { id: "Walking Stride", label: "Walking Stride (Bước đi dứt khoát)", prompt: "Walking Stride: Bước đi dứt khoát, một chân hơi nhấc lên, đầu gối mở rộng, mắt nhìn thẳng phía trước hoặc chếch nhẹ." },
            { id: "Just Arrived", label: "Just Arrived (Vừa mới đến)", prompt: "Just Arrived Pose: Đứng hơi nghiêng, một tay đang kéo nhẹ quai túi xách/balo như vừa mới đến nơi." },
            { id: "Wipe Hair", label: "Wipe Hair (Vuốt tóc tự nhiên)", prompt: "Wipe Hair Action: Vừa đi vừa đưa tay vuốt nhẹ tóc, tạo cảm giác khoảnh khắc bị bắt trọn (candid)." },
            { id: "Looking Back", label: "Looking Back (Ngoái nhìn lại)", prompt: "Looking Back Pose: Đang bước đi, đột ngột quay đầu lại nhìn về phía camera với nụ cười hoặc biểu cảm bất ngờ." },
            { id: "Slow Spin", label: "Slow Spin (Xoay người nhẹ)", prompt: "Slow Spin Action: Xoay người chậm rãi để tà áo hoặc váy bay nhẹ, chụp liên tiếp." }
        ]
    },
    {
        label: "B. Tương Tác Đạo Cụ & Tay (Props)",
        options: [
            { id: "The Pocket Hand", label: "The Pocket Hand (Tay đút túi)", prompt: "The Pocket Hand: Đút hờ một tay vào túi quần hoặc áo khoác, tay còn lại buông lỏng hoặc cầm phụ kiện." },
            { id: "Coffee Prop", label: "Coffee Prop (Cầm ly cà phê)", prompt: "Coffee Prop: Dùng ly cà phê làm đạo cụ, đưa ly lên ngang mặt, mắt nhìn chếch xuống." },
            { id: "Phone Scroll", label: "Phone Scroll (Lướt điện thoại)", prompt: "Phone Scroll: Ngồi hoặc đứng, giả vờ đang lướt điện thoại (không nhìn vào màn hình), thể hiện sự bận rộn." },
            { id: "Wall Lean", label: "Wall Lean (Tựa tường)", prompt: "Wall Lean: Tựa nhẹ vai hoặc lưng vào tường, một chân làm trụ, chân còn lại hơi cong/nhấc lên." },
            { id: "Hat Shadow", label: "Hat Shadow (Đội mũ nghệ thuật)", prompt: "Hat Shadow: Đội mũ, tay chạm nhẹ vành mũ, mặt hơi cúi để tạo bóng đổ nghệ thuật." },
            { id: "Grasping Edge", label: "Grasping Edge (Nắm mép áo/túi)", prompt: "Grasping Edge: Hai tay nắm nhẹ mép áo khoác, cổ áo, hoặc dây đeo túi." },
            { id: "The Adjuster", label: "The Adjuster (Chỉnh trang phục)", prompt: "The Adjuster: Giả vờ đang chỉnh lại cổ tay áo, thắt lưng, hoặc vòng cổ." },
            { id: "Sitting On Steps", label: "Sitting On Steps (Ngồi cầu thang)", prompt: "Sitting On Steps: Ngồi thoải mái trên cầu thang, hai tay đặt chống ra phía sau hoặc đặt nhẹ trên đầu gối." }
        ]
    },
    {
        label: "C. Dáng Ngẫu Hứng & Biểu Cảm (Candid)",
        options: [
            { id: "Gazing Away", label: "Gazing Away (Nhìn xa xăm)", prompt: "Gazing Away: Đứng nghiêng 3/4, mắt nhìn xa xăm, tạo sự mơ màng." },
            { id: "Cover Face", label: "Che Mặt/Cười Tự Nhiên", prompt: "Candid Laugh: Đưa tay lên che miệng khi cười hoặc dùng tay che nhẹ ánh nắng." },
            { id: "Detail Shot", label: "Cận Cảnh Chi Tiết", prompt: "Detail Shot: Chụp cận cảnh trang sức, giày dép, hoặc chi tiết đặc biệt của trang phục." },
            { id: "Squatting Cool", label: "Ngồi xổm (Cool Ngầu)", prompt: "Squatting Cool: Ngồi xổm, tay chống đầu gối, mặt hơi nghiêng, phong cách streetwear." },
            { id: "Cross Legged", label: "Chân bắt chéo (Standing)", prompt: "Standing Cross-Legged: Đứng thẳng, hai chân bắt chéo nhau tạo đường cong cơ thể." },
            { id: "Laughing Out Loud", label: "Laughing Out Loud (Cười lớn)", prompt: "Laughing Out Loud: Cười lớn hoặc giả vờ đang nói chuyện với ai đó." },
            { id: "Back Shot", label: "Lưng Hướng Camera", prompt: "Back Shot: Đứng quay lưng, tập trung khoe bối cảnh và chi tiết sau lưng của trang phục." },
            { id: "Window Reflection", label: "Phản chiếu qua kính", prompt: "Window Reflection: Chụp qua gương hoặc kính cửa sổ để lấy ảnh phản chiếu." },
            { id: "Resting Pose", label: "Giả vờ nghỉ ngơi", prompt: "Resting Pose: Nằm dài trên ghế dài, hoặc ngồi dựa đầu vào ghế/tường, nhắm mắt thư giãn." },
            { id: "Head Tilt", label: "Head Tilt (Nghiêng đầu)", prompt: "Head Tilt: Nghiêng đầu nhẹ sang một bên khi nhìn thẳng vào camera, vẻ đáng yêu tinh nghịch." },
            { id: "Using Hair", label: "Using Hair (Nghịch tóc)", prompt: "Using Hair: Cầm lọn tóc, kéo nhẹ tóc ra phía sau tai, hoặc lắc nhẹ đầu để tóc bay." },
            { id: "Hands on Hips", label: "Hands on Hips (Chống hông)", prompt: "Hands on Hips: Dáng đứng tự tin, một tay chống hông để tạo độ cong cho eo." }
        ]
    }
];

const FASHION_GROUPS = [
    {
        label: "A. Women: Tối Giản & Thanh Lịch (Minimalism)",
        options: [
            { id: "Oversized Blazer", label: "Oversized Blazer Set", prompt: "Wearing Oversized Blazer Set: Blazer dáng rộng + Áo crop-top + Quần âu suông." },
            { id: "Full Set Tweed", label: "Full Set Tweed", prompt: "Wearing Full Set Tweed: Set áo khoác và váy/chân váy tweed sang trọng." },
            { id: "Slip Dress", label: "Váy Slip Dress Satin", prompt: "Wearing Slip Dress Satin: Váy hai dây lụa satin đơn sắc, giày gót mảnh." },
            { id: "Oversized Silk Shirt", label: "Sơ Mi Lụa Dáng Rộng", prompt: "Wearing Oversized Silk Shirt: Áo sơ mi lụa rộng phối quần jeans ống đứng (trắng kem/xanh bạc hà)." },
            { id: "Jersey Maxi", label: "Váy Maxi Jersey", prompt: "Wearing Jersey Maxi: Váy dài chất liệu jersey ôm nhẹ, tôn dáng." },
            { id: "Pastel Blazer", label: "Blazer Pastel", prompt: "Wearing Pastel Blazer: Blazer màu be sữa/hồng nhạt/xanh ngọc." },
            { id: "Flared Jeans", label: "Quần Jeans Ống Loe", prompt: "Wearing Flared Jeans: Quần Jeans ống loe kết hợp với áo thun ôm sát hoặc áo kiểu có cổ Peter Pan." }
        ]
    },
    {
        label: "B. Women: Lãng Mạn & Cổ Điển (Coquette/Retro)",
        options: [
            { id: "Bubble Skirt", label: "Chân Váy Phồng (Bubble Skirt)", prompt: "Wearing Bubble Skirt: Chân váy phom bồng bềnh kết hợp áo ôm hoặc corset nhẹ." },
            { id: "Coquette Style", label: "Phong cách Coquette", prompt: "Coquette Style: Trang phục nhiều nơ, ren, bèo nhún, tông hồng/trắng." },
            { id: "Off Shoulder", label: "Áo Trễ Vai (Off-Shoulder)", prompt: "Wearing Off-Shoulder Top: Áo trễ vai chất liệu voan hoặc lụa khoe xương quai xanh." },
            { id: "Polka Dot", label: "Họa tiết Chấm Bi", prompt: "Wearing Polka Dot Midi/Maxi Dress: Váy họa tiết chấm bi cổ điển, thanh lịch." },
            { id: "Robe de Style", label: "Váy Robe de Style", prompt: "Wearing Robe de Style Dress: Thiết kế dáng loe rộng từ điểm hạ eo, thập niên 1920." }
        ]
    },
    {
        label: "C. Women: Cá Tính & Hiện Đại (Streetwear)",
        options: [
            { id: "Wide Leg Jeans", label: "Quần Jeans Ống Rộng", prompt: "Wearing Wide-Leg Jeans: Quần jeans ống rộng phối áo khoác da hoặc graphic tee." },
            { id: "Metallic", label: "Trang Phục Ánh Kim", prompt: "Wearing Metallic Fabric: Váy hoặc chân váy ánh nhũ bạc/vàng kim." },
            { id: "Leather Crop", label: "Crop Top & Đồ Da", prompt: "Wearing Crop Top & Leather: Áo crop top + Quần da/Váy da ngắn cá tính." },
            { id: "High Boots", label: "Boots Cao Gối & Midi", prompt: "Wearing High Knee Boots & Midi Skirt: Phối cùng áo len hoặc blazer dáng dài." },
            { id: "Eco Fur", label: "Áo Khoác Lông (Eco Fur)", prompt: "Wearing Eco Fur Coat: Áo khoác lông thú to bản hoặc viền lông thú ở cổ." },
            { id: "Slouchy Bags", label: "Slouchy Bags (Túi mềm)", prompt: "Holding Slouchy Bag: Túi xách phom dáng mềm mại, rộng rãi, làm phụ kiện nhấn." }
        ]
    },
    {
        label: "D. Women: Chất Liệu & Tiên Phong (Avant-Garde)",
        options: [
            { id: "Sustainable Fashion", label: "Thời Trang Bền Vững", prompt: "Sustainable Fashion: Trang phục từ chất liệu hữu cơ, tái chế, tông màu tự nhiên." },
            { id: "Marine Style", label: "Phong Cách Hàng Hải", prompt: "Marine Style: Họa tiết kẻ sọc Breton, xanh navy và trắng kem." },
            { id: "Sheer Mesh", label: "Vải Xuyên Thấu (Sheer)", prompt: "Wearing Sheer/Mesh Fabric: Đầm dài xuyên thấu hoặc áo lưới layer bên ngoài crop top." },
            { id: "Micro Shorts", label: "Quần Short Micro", prompt: "Wearing Micro Shorts: Quần short siêu ngắn phối sơ mi oversize trùm ngoài." },
            { id: "Faux Croc", label: "Chất Liệu Faux Croc", prompt: "Wearing Faux Croc: Phụ kiện hoặc áo khoác giả da cá sấu." },
            { id: "Animal Print", label: "Hoạ Tiết Động Vật", prompt: "Wearing Animal Print: Trang phục họa tiết da báo hoặc zebra." },
            { id: "Matching Set", label: "Áo Nỉ Bộ (Athleisure)", prompt: "Wearing Matching Sweat Set: Bộ nỉ thể thao năng động đơn giản." }
        ]
    },
    {
        label: "E. Men's Classic (Nam: Lịch Lãm & Cổ Điển)",
        options: [
            { id: "Classic Suit", label: "Classic Suit (Vest Cổ Điển)", prompt: "Men's Fashion: Wearing Classic Suit, white crisp shirt, silk tie, polished leather shoes. Gentleman look." },
            { id: "Double Breasted", label: "Double-Breasted Blazer", prompt: "Men's Fashion: Wearing Double-Breasted Blazer (Vest 2 hàng khuy), tailored trousers. Sophisticated style." },
            { id: "Tuxedo", label: "Black Tie Tuxedo", prompt: "Men's Fashion: Wearing Black Tuxedo with Bow Tie. Evening gala style." },
            { id: "Old Money", label: "Old Money Aesthetic", prompt: "Men's Fashion: Wearing Knitted Polo Shirt, beige Chinos pants, loafers. Old Money aesthetic." },
            { id: "Trench Coat", label: "Classic Trench Coat", prompt: "Men's Fashion: Wearing Long Beige Trench Coat over a turtleneck sweater and wool trousers." },
            { id: "Linen Set", label: "Linen Shirt & Trousers", prompt: "Men's Fashion: Wearing White Linen Shirt (unbuttoned top) and Linen Trousers. Summer resort vibe." },
            { id: "Smart Casual Blazer", label: "Smart Casual Blazer", prompt: "Men's Fashion: Wearing Navy Blazer over a white t-shirt and grey jeans." }
        ]
    },
    {
        label: "F. Men's Streetwear (Nam: Đường Phố & Cá Tính)",
        options: [
            { id: "Oversized Cargo", label: "Oversized Tee & Cargo", prompt: "Men's Fashion: Wearing Oversized Graphic T-shirt and loose Cargo Pants, chunky sneakers." },
            { id: "Bomber Layering", label: "Bomber Jacket Layering", prompt: "Men's Fashion: Wearing Bomber Jacket over a Hoodie, distressed jeans." },
            { id: "Denim on Denim", label: "Denim on Denim", prompt: "Men's Fashion: Wearing Denim Jacket matching with Jeans (Canadian Tuxedo), white tee inside." },
            { id: "Flannel Grunge", label: "Flannel Shirt (Grunge)", prompt: "Men's Fashion: Wearing Checkered Flannel Shirt unbuttoned over a band t-shirt, ripped black jeans." },
            { id: "Varsity Jacket", label: "Varsity Jacket (Bóng chày)", prompt: "Men's Fashion: Wearing Varsity Jacket with leather sleeves, baseball cap, loose jeans." },
            { id: "Leather Biker", label: "Leather Biker Jacket", prompt: "Men's Fashion: Wearing Black Leather Biker Jacket, black skinny jeans, chelsea boots." },
            { id: "Techwear Full", label: "Techwear Style", prompt: "Men's Fashion: Wearing Black Techwear Jacket with multiple straps and pockets, cargo joggers, combat boots." },
            { id: "Utility Vest", label: "Utility Vest", prompt: "Men's Fashion: Wearing Utility Vest (Gile túi hộp) over an oversized t-shirt." }
        ]
    },
    {
        label: "G. Men's Korean & Casual (Nam: Hàn Quốc & Trẻ Trung)",
        options: [
            { id: "Cardigan Soft", label: "Soft Cardigan & Tee", prompt: "Men's Fashion: Wearing Soft Wool Cardigan over a white t-shirt, straight leg jeans. Soft boy aesthetic." },
            { id: "Oversized Shirt", label: "Oversized Dress Shirt", prompt: "Men's Fashion: Wearing Oversized Long-sleeve Shirt (un-tucked) with wide-leg trousers. Korean minimalist style." },
            { id: "Turtleneck Blazer", label: "Turtleneck & Blazer", prompt: "Men's Fashion: Wearing Black Turtleneck inside a Checkered Blazer, wool trousers." },
            { id: "Sweater Vest", label: "Sweater Vest Layering", prompt: "Men's Fashion: Wearing Knitted Sweater Vest over a white oversized shirt." },
            { id: "All Black", label: "All Black Minimalist", prompt: "Men's Fashion: Wearing All Black outfit (Tee, Trousers, Derby shoes). Minimalist cool." },
            { id: "Cuban Shirt", label: "Cuban Collar Shirt", prompt: "Men's Fashion: Wearing Short-sleeve Cuban Collar Shirt with geometric print, shorts." },
            { id: "Wide Leg Trousers", label: "Wide Leg Pleated Pants", prompt: "Men's Fashion: Wearing High-waisted Wide Leg Pleated Trousers, tucked-in t-shirt." },
            { id: "Hoodie Jogger", label: "Pastel Hoodie Set", prompt: "Men's Fashion: Wearing Pastel colored Hoodie and matching Sweatpants (Joggers). Comfortable look." }
        ]
    },
    {
        label: "H. Men's Sporty & Active (Nam: Thể Thao)",
        options: [
            { id: "Tracksuit", label: "Retro Tracksuit", prompt: "Men's Fashion: Wearing Retro Color-block Tracksuit (Jacket and Pants), running shoes." },
            { id: "Gym Shark", label: "Gym/Workout Gear", prompt: "Men's Fashion: Wearing Stringer Tank Top and compression shorts. Muscular physique highlight." },
            { id: "Windbreaker", label: "Windbreaker Jacket", prompt: "Men's Fashion: Wearing Nylon Windbreaker Jacket, sport shorts, leggings underneath." },
            { id: "Safari Style", label: "Safari Explorer", prompt: "Men's Fashion: Wearing Safari Jacket (Beige/Khaki) with belt, chinos." },
            { id: "Hoodie Shorts", label: "Hoodie & Shorts (Athleisure)", prompt: "Men's Fashion: Wearing Hoodie combined with Gym Shorts and high socks." },
            { id: "Puffer Jacket", label: "Puffer Jacket", prompt: "Men's Fashion: Wearing Thick Puffer Jacket (North Face style), beanie hat." },
            { id: "Golf Attire", label: "Modern Golf Style", prompt: "Men's Fashion: Wearing Performance Polo, slim fit trousers, cap." }
        ]
    }
];

export const ImageCreator: React.FC<ImageCreatorProps> = ({ onCreate, isLoading }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [videoStyle, setVideoStyle] = useState<string>(VIDEO_STYLES[0].id);
    const [sourceImages, setSourceImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [outfitImage, setOutfitImage] = useState<File | null>(null);
    const [outfitPreview, setOutfitPreview] = useState<string | null>(null);
    
    const [selectedPose, setSelectedPose] = useState<string>('');
    const [selectedFashion, setSelectedFashion] = useState<string>('');

    const [isSeparatingOutfit, setIsSeparatingOutfit] = useState<boolean>(false);
    const [outfitSeparationError, setOutfitSeparationError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const outfitInputRef = useRef<HTMLInputElement>(null);

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
            reader.onload = (e) => {
                setOutfitPreview(e.target?.result as string);
                setOutfitSeparationError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSeparateOutfit = async () => {
        if (!outfitImage) return;
        
        setIsSeparatingOutfit(true);
        setOutfitSeparationError(null);
        
        try {
            const imagePart = await processImageFile(outfitImage);
            const resultB64 = await separateClothing(imagePart);
            
            const newPreview = `data:image/png;base64,${resultB64}`;
            const response = await fetch(newPreview);
            const blob = await response.blob();
            const newFile = new File([blob], `separated-${outfitImage.name.replace(/\.[^/.]+$/, "")}.png`, { type: 'image/png' });

            setOutfitImage(newFile);
            setOutfitPreview(newPreview);
        } catch (err) {
            setOutfitSeparationError(err instanceof Error ? err.message : "Không thể tách trang phục.");
        } finally {
            setIsSeparatingOutfit(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setSourceImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeOutfit = () => {
        setOutfitImage(null);
        setOutfitPreview(null);
        setOutfitSeparationError(null);
        if (outfitInputRef.current) outfitInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalPrompt = prompt;
        const additionalDetails = [];
        if (selectedPose) additionalDetails.push(`[POSE/ACTION]: ${selectedPose}`);
        if (selectedFashion) additionalDetails.push(`[FASHION STYLE 2025]: ${selectedFashion}`);
        
        if (additionalDetails.length > 0) {
            finalPrompt = `${finalPrompt}\n\n${additionalDetails.join('\n')}`;
        }

        if (finalPrompt.trim()) {
            onCreate({ prompt: finalPrompt, sourceImages, outfitImage, aspectRatio, videoStyle });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg flex-shrink-0">
                        <PaletteIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900">Công nghệ Banana Nano (Siêu Tốc)</h3>
                        <p className="text-sm text-indigo-700 mt-1">Sáng tạo hình ảnh nghệ thuật từ văn bản và ảnh tham khảo.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Image Reference Upload */}
                <div>
                    <label className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2">
                        1. Ảnh bối cảnh tham khảo
                        <span className="text-xs font-normal text-slate-500">Tải lên nhiều ảnh</span>
                    </label>
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition bg-white shadow-sm"
                    >
                        <UploadIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 font-medium">Chọn ảnh bối cảnh</span>
                    </button>

                    {previews.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {previews.map((src, index) => (
                                <div key={index} className="relative aspect-square shadow-sm">
                                    <img src={src} alt={`Ref ${index}`} className="w-full h-full object-cover rounded-md border border-slate-200" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Outfit Upload */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        2. Ảnh Trang phục (Outfit)
                    </label>
                    <input
                        type="file"
                        ref={outfitInputRef}
                        accept="image/*"
                        onChange={handleOutfitChange}
                        className="hidden"
                    />
                    {!outfitPreview ? (
                        <button
                            type="button"
                            onClick={() => outfitInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition bg-white shadow-sm"
                        >
                            <ShirtIcon className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 font-medium text-center px-4">Tải ảnh trang phục (có thể có mẫu)</span>
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="relative w-full h-32 border border-slate-200 rounded-lg overflow-hidden group bg-slate-50 shadow-sm">
                                <img src={outfitPreview} alt="Outfit" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={removeOutfit}
                                    className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow-md hover:bg-red-50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleSeparateOutfit}
                                disabled={isLoading || isSeparatingOutfit}
                                className="w-full flex items-center justify-center py-2 px-3 border border-indigo-200 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isSeparatingOutfit ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Đang tách lấy trang phục...
                                    </>
                                ) : (
                                    <>
                                        <ShirtIcon className="w-4 h-4 mr-2" />
                                        Tách trang phục (Isolate Clothing)
                                    </>
                                )}
                            </button>
                            {outfitSeparationError && <p className="text-[10px] text-red-500 font-medium">{outfitSeparationError}</p>}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label htmlFor="pose-select" className="block text-sm font-semibold text-slate-700 mb-2">
                        3a. Gợi ý Dáng chụp (Posing)
                    </label>
                    <select
                        id="pose-select"
                        value={selectedPose}
                        onChange={(e) => setSelectedPose(e.target.value)}
                        className="w-full p-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Chọn dáng chụp tự nhiên --</option>
                        {POSING_GROUPS.map((group, idx) => (
                            <optgroup key={idx} label={group.label}>
                                {group.options.map((opt) => (
                                    <option key={opt.id} value={opt.prompt}>
                                        {opt.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label htmlFor="fashion-select" className="block text-sm font-semibold text-slate-700 mb-2">
                        3b. Xu hướng Thời trang 2025
                    </label>
                    <select
                        id="fashion-select"
                        value={selectedFashion}
                        onChange={(e) => setSelectedFashion(e.target.value)}
                        className="w-full p-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Chọn Style trang phục --</option>
                        {FASHION_GROUPS.map((group, idx) => (
                            <optgroup key={idx} label={group.label}>
                                {group.options.map((opt) => (
                                    <option key={opt.id} value={opt.prompt}>
                                        {opt.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label htmlFor="video-style" className="block text-sm font-semibold text-slate-700 mb-2">
                    4. Phong cách quảng cáo Veo3 (Video)
                </label>
                <div className="relative">
                    <select
                        id="video-style"
                        value={videoStyle}
                        onChange={(e) => setVideoStyle(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg appearance-none shadow-sm cursor-pointer"
                    >
                        {VIDEO_STYLES.map((style) => (
                            <option key={style.id} value={style.id}>
                                {style.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="create-prompt" className="block text-sm font-semibold text-slate-700 mb-2">
                    5. Mô tả ý tưởng (Context)
                </label>
                <textarea
                    id="create-prompt"
                    rows={4}
                    className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Mô tả bối cảnh chính..."
                    maxLength={2000}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    6. Chọn tỷ lệ khung hình
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.id}
                            type="button"
                            onClick={() => setAspectRatio(ratio.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                aspectRatio === ratio.id
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="text-2xl mb-1">{ratio.icon}</span>
                            <span className="text-xs font-medium">{ratio.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <Button type="submit" disabled={isLoading || isSeparatingOutfit || (!prompt.trim() && !selectedPose && !selectedFashion)} className="w-full py-4 text-lg">
                    <PaletteIcon className="w-6 h-6 mr-2" />
                    {isLoading ? 'Banana Nano đang chạy...' : 'Kích hoạt Banana Nano'}
                </Button>
            </div>
        </form>
    );
};