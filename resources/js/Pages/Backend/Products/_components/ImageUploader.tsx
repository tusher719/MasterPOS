import { useRef, useState } from "react";
import { Star, Trash2, Upload, ImageIcon, Maximize2 } from "lucide-react";
import ImageLightbox, { LightboxImage, formatBytes } from "./ImageLightbox";

export interface ImageFile {
    file: File;
    preview: string;
    isPrimary: boolean;
}

export interface ExistingImage {
    id: number;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
    file_name?: string;
    file_size?: number;
}

interface Props {
    newImages: ImageFile[];
    onNewImagesChange: (images: ImageFile[]) => void;
    existingImages?: ExistingImage[];
    onDeleteExisting?: (id: number) => void;
    onSetExistingPrimary?: (id: number) => void;
}

const MAX_IMAGES = 20;

function ImageCaption({ name, size }: { name: string; size?: number }) {
    const sizeLabel = formatBytes(size);
    return (
        <div className="mt-1 min-w-0">
            <p
                className="truncate text-xs font-medium text-gray-600"
                title={name}
            >
                {name}
            </p>
            {sizeLabel && (
                <p className="text-[11px] text-gray-400">{sizeLabel}</p>
            )}
        </div>
    );
}

export default function ImageUploader({
    newImages,
    onNewImagesChange,
    existingImages = [],
    onDeleteExisting,
    onSetExistingPrimary,
}: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const totalCount = existingImages.length + newImages.length;
    const remaining = MAX_IMAGES - totalCount;

    const primaryExisting = existingImages.find((i) => i.is_primary);
    const primaryNewIndex = newImages.findIndex((i) => i.isPrimary);
    const primaryNew =
        primaryNewIndex >= 0 ? newImages[primaryNewIndex] : undefined;

    const galleryExisting = existingImages.filter((i) => !i.is_primary);
    const galleryNew = newImages
        .map((img, index) => ({ ...img, index }))
        .filter((img) => !img.isPrimary);

    // Flat list, in display order, that feeds the lightbox (thumbnail first,
    // then galleries) so click-to-open and swipe navigation line up.
    const lightboxImages: LightboxImage[] = [
        ...(primaryExisting
            ? [
                  {
                      key: `existing-${primaryExisting.id}`,
                      url: primaryExisting.image_url,
                      name:
                          primaryExisting.file_name ??
                          `Image #${primaryExisting.id}`,
                      size: primaryExisting.file_size,
                      isPrimary: true,
                      isNew: false,
                  },
              ]
            : []),
        ...(primaryNew
            ? [
                  {
                      key: `new-${primaryNewIndex}`,
                      url: primaryNew.preview,
                      name: primaryNew.file.name,
                      size: primaryNew.file.size,
                      isPrimary: true,
                      isNew: true,
                  },
              ]
            : []),
        ...galleryExisting.map((img) => ({
            key: `existing-${img.id}`,
            url: img.image_url,
            name: img.file_name ?? `Image #${img.id}`,
            size: img.file_size,
            isPrimary: false,
            isNew: false,
        })),
        ...galleryNew.map((img) => ({
            key: `new-${img.index}`,
            url: img.preview,
            name: img.file.name,
            size: img.file.size,
            isPrimary: false,
            isNew: true,
        })),
    ];

    const openLightbox = (key: string) => {
        const idx = lightboxImages.findIndex((img) => img.key === key);
        if (idx >= 0) setLightboxIndex(idx);
    };

    const addFiles = (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        const sliced = files.slice(0, remaining);
        if (sliced.length === 0) return;

        const mapped: ImageFile[] = sliced.map((file, i) => ({
            file,
            preview: URL.createObjectURL(file),
            isPrimary: totalCount === 0 && i === 0,
        }));

        onNewImagesChange([...newImages, ...mapped]);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (remaining > 0 && e.dataTransfer.files)
            addFiles(e.dataTransfer.files);
    };

    const removeNew = (index: number) => {
        const wasPrimary = newImages[index].isPrimary;
        const updated = newImages.filter((_, i) => i !== index);
        if (wasPrimary && existingImages.length === 0 && updated.length > 0) {
            updated[0].isPrimary = true;
        }
        onNewImagesChange(updated);
    };

    const setNewPrimary = (index: number) => {
        onSetExistingPrimary?.(-1); // clears any existing-image primary
        onNewImagesChange(
            newImages.map((img, i) => ({ ...img, isPrimary: i === index })),
        );
    };

    return (
        <div className="space-y-5">
            {/* Single upload zone — handles thumbnail + gallery both */}
            <div
                onClick={() => remaining > 0 && fileRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (remaining > 0) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                    remaining === 0
                        ? "cursor-not-allowed border-gray-200 bg-gray-50"
                        : dragOver
                          ? "cursor-pointer border-indigo-500 bg-indigo-50"
                          : "cursor-pointer border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                }`}
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Upload size={18} />
                </div>
                {remaining > 0 ? (
                    <>
                        <p className="text-sm font-medium text-gray-700">
                            Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-gray-400">
                            PNG, JPG, WEBP — {remaining} of {MAX_IMAGES} slots
                            left
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-400">
                        Maximum {MAX_IMAGES} images reached
                    </p>
                )}
            </div>

            <input
                ref={fileRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFiles}
            />

            {/* Thumbnail — the single primary image */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Thumbnail
                </p>
                {primaryExisting ? (
                    <div className="w-32">
                        <div
                            onClick={() =>
                                openLightbox(`existing-${primaryExisting.id}`)
                            }
                            className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-lg border-2 border-indigo-500"
                        >
                            <img
                                src={primaryExisting.image_url}
                                alt="thumbnail"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                                <Maximize2 size={16} className="text-white" />
                            </div>
                            <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                Primary
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteExisting?.(primaryExisting.id);
                                }}
                                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-gray-500 hover:text-red-500"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <ImageCaption
                            name={
                                primaryExisting.file_name ??
                                `Image #${primaryExisting.id}`
                            }
                            size={primaryExisting.file_size}
                        />
                    </div>
                ) : primaryNew ? (
                    <div className="w-72">
                        <div
                            onClick={() =>
                                openLightbox(`new-${primaryNewIndex}`)
                            }
                            className="group relative h-40 w-72 cursor-pointer overflow-hidden rounded-lg border-2 border-indigo-500"
                        >
                            <img
                                src={primaryNew.preview}
                                alt="thumbnail"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                                <Maximize2 size={16} className="text-white" />
                            </div>
                            <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                Primary
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeNew(primaryNewIndex);
                                }}
                                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-gray-500 hover:text-red-500"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <ImageCaption
                            name={primaryNew.file.name}
                            size={primaryNew.file.size}
                        />
                    </div>
                ) : (
                    <div className="flex h-40 w-72 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-300">
                        <ImageIcon size={20} />
                        <span className="text-[11px] text-gray-400">
                            No thumbnail
                        </span>
                    </div>
                )}
            </div>

            {/* Gallery — everything else */}
            {(galleryExisting.length > 0 || galleryNew.length > 0) && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Gallery ({galleryExisting.length + galleryNew.length})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {galleryExisting.map((img) => (
                            <div key={`existing-${img.id}`} className="min-w-0">
                                <div
                                    onClick={() =>
                                        openLightbox(`existing-${img.id}`)
                                    }
                                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200"
                                >
                                    <img
                                        src={img.image_url}
                                        alt="product"
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openLightbox(
                                                    `existing-${img.id}`,
                                                );
                                            }}
                                            title="View full size"
                                            className="rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-indigo-600"
                                        >
                                            <Maximize2 size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSetExistingPrimary?.(img.id);
                                            }}
                                            title="Set as thumbnail"
                                            className="rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-amber-500"
                                        >
                                            <Star size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteExisting?.(img.id);
                                            }}
                                            title="Remove"
                                            className="rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-red-500"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                <ImageCaption
                                    name={img.file_name ?? `Image #${img.id}`}
                                    size={img.file_size}
                                />
                            </div>
                        ))}
                        {galleryNew.map((img) => (
                            <div key={`new-${img.index}`} className="min-w-0">
                                <div
                                    onClick={() =>
                                        openLightbox(`new-${img.index}`)
                                    }
                                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200"
                                >
                                    <img
                                        src={img.preview}
                                        alt="preview"
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openLightbox(
                                                    `new-${img.index}`,
                                                );
                                            }}
                                            title="View full size"
                                            className="rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-indigo-600"
                                        >
                                            <Maximize2 size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setNewPrimary(img.index);
                                            }}
                                            title="Set as thumbnail"
                                            className="rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-amber-500"
                                        >
                                            <Star size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNew(img.index);
                                            }}
                                            title="Remove"
                                            className="rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-red-500"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                <ImageCaption
                                    name={img.file.name}
                                    size={img.file.size}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox — rendered via portal, so it always overlays the
                whole page instead of being clipped/overlapped by ancestor
                stacking contexts (e.g. the sticky image panel). */}
            {lightboxIndex !== null && lightboxImages.length > 0 && (
                <ImageLightbox
                    images={lightboxImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
