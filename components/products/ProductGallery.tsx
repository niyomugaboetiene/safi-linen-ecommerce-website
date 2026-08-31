'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: Array<{
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
  }>;
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-neutral-100 rounded-xl flex items-center justify-center">
        <span className="text-neutral-400">No image available</span>
      </div>
    );
  }

  const handlePrev = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-neutral-100 rounded-xl overflow-hidden group">
        <Image
          src={images[selectedImage].url}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            'object-cover transition-transform duration-300',
            isZoomed ? 'scale-150' : 'group-hover:scale-105'
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-neutral-700" />
            </button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-3 right-3 p-2 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-4 w-4 text-neutral-700" />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.publicId}
              onClick={() => setSelectedImage(index)}
              className={cn(
                'relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                selectedImage === index
                  ? 'border-primary-600'
                  : 'border-transparent hover:border-neutral-300'
              )}
            >
              <Image
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}