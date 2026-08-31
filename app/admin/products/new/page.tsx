'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Upload,
  X,
  Package,
  ChevronLeft,
} from 'lucide-react';
import { productAPI, categoryAPI, uploadAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface VariantForm {
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  images: any[];
  active: boolean;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    featured: false,
    active: true,
  });

  const [variants, setVariants] = useState<VariantForm[]>([
    {
      sku: '',
      color: '',
      size: '',
      price: 0,
      stock: 0,
      images: [],
      active: true,
    },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories(true);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sku: '',
        color: '',
        size: '',
        price: 0,
        stock: 0,
        images: [],
        active: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantForm,
    value: any
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };
    setVariants(updatedVariants);
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const imageData = response.data;
      const updatedVariants = [...variants];
      updatedVariants[index].images.push(imageData);
      setVariants(updatedVariants);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (variantIndex: number, imageIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setVariants(updatedVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!productData.name || !productData.description || !productData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (variants.length === 0) {
      toast.error('At least one variant is required');
      return;
    }

    for (const variant of variants) {
      if (!variant.sku || variant.price <= 0) {
        toast.error('Please fill in all variant fields');
        return;
      }
    }

    setSaving(true);
    try {
      await productAPI.createProduct({
        ...productData,
        variants: variants.map((v) => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
        })),
      });
      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            Add New Product
          </h1>
          <p className="text-neutral-600 mt-1">
            Create a new product with variants
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">
            Product Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Product Name"
              value={productData.name}
              onChange={(e) =>
                setProductData({ ...productData, name: e.target.value })
              }
              placeholder="e.g., Luxury Bed Cover"
              required
            />
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                Description
              </label>
              <textarea
                value={productData.description}
                onChange={(e) =>
                  setProductData({ ...productData, description: e.target.value })
                }
                rows={4}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="Detailed product description"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                  Category
                </label>
                <select
                  value={productData.category}
                  onChange={(e) =>
                    setProductData({ ...productData, category: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Brand (Optional)"
                value={productData.brand}
                onChange={(e) =>
                  setProductData({ ...productData, brand: e.target.value })
                }
                placeholder="e.g., Luxury Brand"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productData.featured}
                  onChange={(e) =>
                    setProductData({ ...productData, featured: e.target.checked })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Featured Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productData.active}
                  onChange={(e) =>
                    setProductData({ ...productData, active: e.target.checked })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              Variants
            </h2>
            <Button type="button" onClick={handleAddVariant} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Add Variant
            </Button>
          </div>

          <div className="space-y-6">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-neutral-900">
                    Variant {index + 1}
                  </h3>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    label="SKU"
                    value={variant.sku}
                    onChange={(e) =>
                      handleVariantChange(index, 'sku', e.target.value.toUpperCase())
                    }
                    placeholder="e.g., BED-GRN-001"
                    required
                  />
                  <Input
                    label="Color"
                    value={variant.color}
                    onChange={(e) =>
                      handleVariantChange(index, 'color', e.target.value)
                    }
                    placeholder="e.g., Green"
                  />
                  <Input
                    label="Size"
                    value={variant.size}
                    onChange={(e) =>
                      handleVariantChange(index, 'size', e.target.value)
                    }
                    placeholder="e.g., King"
                  />
                  <Input
                    label="Price (RWF)"
                    type="number"
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(index, 'price', Number(e.target.value))
                    }
                    min={0}
                    required
                  />
                  <Input
                    label="Stock"
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(index, 'stock', Number(e.target.value))
                    }
                    min={0}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Images
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {variant.images.map((image, imageIndex) => (
                      <div
                        key={imageIndex}
                        className="relative w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={image.url}
                          alt={`Variant ${index + 1} image ${imageIndex + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index, imageIndex)}
                          className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm hover:bg-neutral-50"
                        >
                          <X className="h-3 w-3 text-neutral-600" />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                      <Upload className="h-6 w-6 text-neutral-400 mb-1" />
                      <span className="text-xs text-neutral-500">
                        {uploading ? 'Uploading...' : 'Upload'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(index, file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" loading={saving} size="lg">
            Create Product
          </Button>
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}