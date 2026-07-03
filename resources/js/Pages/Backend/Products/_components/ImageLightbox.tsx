import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Star, ImageOff } from "lucide-react";

export interface LightboxImage {
    key: string;
    url: string;
    name: string;
    size?: number;
    isPrimary?: boolean;
    isNew?: boolean;
}

interface Props {
    images: LightboxImage[];
    initialIndex: number;
    onClose: () => void;
}

export function formatBytes(bytes?: number) {
    if (bytes === undefined || bytes === null) return null;
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ImageLightbox({
    images,
    initialIndex,
    onClose,
}: Props) {
    const [index, setIndex] = useState(initialIndex);
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
    const [imgError, setImgError] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const touchDeltaX = useRef(0);

    const current = images[index];
    const total = images.length;

    const goTo = (next: number) => {
        setDims(null);
        setImgError(false);
        setIndex((next + total) % total);
    };

    const goPrev = () => goTo(index - 1);
    const goNext = () => goTo(index + 1);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowLeft") goPrev();
            else if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, total]);

    // Lock body scroll while open
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    // Load natural dimensions of the current image
    useEffect(() => {
        if (!current) return;
        const img = new Image();
        img.onload = () =>
            setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => setImgError(true);
        img.src = current.url;
        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [current?.url]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };

    const handleTouchEnd = () => {
        if (Math.abs(touchDeltaX.current) > 50) {
            if (touchDeltaX.current > 0) goPrev();
            else goNext();
        }
        touchStartX.current = null;
        touchDeltaX.current = 0;
    };

    if (!current) return null;

    const sizeLabel = formatBytes(current.size);

    // Rendered through a portal directly under <body> so it always sits on
    // top of the whole page — nesting it inside form panels (which may use
    // `sticky`, `overflow-hidden`, etc. and create their own stacking
    // contexts) previously caused page inputs to visually bleed through.
    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Top bar */}
            <div
                className="flex items-center justify-between px-4 py-3 text-white sm:px-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="font-medium text-white">{index + 1}</span>
                    <span className="text-gray-500">/</span>
                    <span>{total}</span>
                    {current.isPrimary && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-medium">
                            <Star size={10} className="fill-white" />
                            Primary
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Image stage */}
            <div
                className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-16"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {total > 1 && (
                    <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-4"
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}

                {imgError ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <ImageOff size={32} />
                        <p className="text-sm">Couldn't load this image</p>
                    </div>
                ) : (
                    <img
                        src={current.url}
                        alt={current.name}
                        className="max-h-[70vh] max-w-full select-none rounded-md object-contain shadow-2xl"
                        draggable={false}
                    />
                )}

                {total > 1 && (
                    <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-4"
                    >
                        <ChevronRight size={22} />
                    </button>
                )}
            </div>

            {/* Info footer */}
            <div
                className="px-4 py-3 text-center sm:px-6"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="truncate text-sm font-medium text-white">
                    {current.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                    {[
                        sizeLabel,
                        dims ? `${dims.w} × ${dims.h}px` : null,
                        current.isNew ? "Not yet uploaded" : null,
                    ]
                        .filter(Boolean)
                        .join("  •  ")}
                </p>
            </div>

            {/* Thumbnail strip */}
            {total > 1 && (
                <div
                    className="flex justify-center gap-2 overflow-x-auto px-4 pb-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {images.map((img, i) => (
                        <button
                            key={img.key}
                            type="button"
                            onClick={() => goTo(i)}
                            className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border-2 transition-opacity ${
                                i === index
                                    ? "border-indigo-500 opacity-100"
                                    : "border-transparent opacity-50 hover:opacity-80"
                            }`}
                        >
                            <img
                                src={img.url}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return createPortal(modal, document.body);
}
