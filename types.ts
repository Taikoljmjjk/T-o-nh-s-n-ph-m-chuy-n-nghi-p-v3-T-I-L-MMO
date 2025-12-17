
export interface GenerateImageData {
    prompt: string;
    sourceImages: File[];
    templateImage?: File | null;
    outfitImage?: File | null;
    accessoryImage?: File | null;
    lockDetails?: boolean;
    aspectRatio?: string;
    videoStyle?: string;
}

export interface EditImageData {
    prompt: string;
    modelImage: File | null;
    productImage: File | null;
    accessoryImage1: File | null;
    accessoryImage2: File | null;
    lockDetails?: boolean;
}

export interface UpscaleImageData {
    originalImage: File;
    faceReferenceImage?: File | null;
    lockDetails?: boolean;
    prompt?: string;
}

export interface CreateImageData {
    prompt: string;
    sourceImages: File[];
    aspectRatio: string;
    videoStyle: string;
}