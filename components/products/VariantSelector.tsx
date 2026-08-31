'use client';

import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  variants: any[];
  selectedVariant: any;
  onSelect: (variant: any) => void;
}

export default function VariantSelector({
  variants,
  selectedVariant,
  onSelect,
}: VariantSelectorProps) {
  if (!variants || variants.length <= 1) {
    return null;
  }

  const hasColors = variants.some((v) => v.color);
  const hasSizes = variants.some((v) => v.size);

  return (
    <div className="space-y-4">
      {/* Color Variants */}
      {hasColors && (
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-2 block">
            Color:{' '}
            <span className="text-neutral-900 font-semibold">
              {selectedVariant?.color || 'Select color'}
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => (
              <button
                key={variant._id}
                onClick={() => onSelect(variant)}
                className={cn(
                  'group relative px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  selectedVariant?._id === variant._id
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                )}
              >
                {variant.color && (
                  <span
                    className="inline-block w-4 h-4 rounded-full mr-2 align-middle border border-neutral-300"
                    style={{ backgroundColor: variant.color.toLowerCase() }}
                  />
                )}
                {variant.color || 'Default'}
                {selectedVariant?._id === variant._id && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full border-2 border-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Variants */}
      {hasSizes && (
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-2 block">
            Size:{' '}
            <span className="text-neutral-900 font-semibold">
              {selectedVariant?.size || 'Select size'}
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => (
              <button
                key={variant._id}
                onClick={() => onSelect(variant)}
                className={cn(
                  'min-w-[48px] px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  selectedVariant?._id === variant._id
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                )}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Other Variants */}
      {!hasColors && !hasSizes && variants.length > 1 && (
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-2 block">
            Options
          </label>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => (
              <button
                key={variant._id}
                onClick={() => onSelect(variant)}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  selectedVariant?._id === variant._id
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                )}
              >
                {variant.sku}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}