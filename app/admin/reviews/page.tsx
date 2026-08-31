'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Star,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { reviewAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import RatingStars from '@/components/ui/RatingStars';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReviews(1);
  }, [search]);

  const fetchReviews = async (page: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;

      const response = await reviewAPI.getReviews(params);
      setReviews(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;

    setDeleting(true);
    try {
      await reviewAPI.deleteReview(selectedReview._id);
      toast.success('Review deleted successfully');
      setShowDeleteModal(false);
      fetchReviews(pagination.page);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchReviews(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Reviews
        </h1>
        <p className="text-neutral-600 mt-1">
          Moderate and manage customer reviews
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reviews..."
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600">
                      {review.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-neutral-900">
                        {review.user?.name || 'Customer'}
                      </p>
                      <RatingStars rating={review.rating} size="sm" />
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">
                      {review.comment}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>
                        Product: {review.product?.name || 'N/A'}
                      </span>
                      <span>
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600 transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="py-12 text-center">
          <Star className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No reviews found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Review"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDeleteReview}
              loading={deleting}
              variant="danger"
              fullWidth
            >
              Delete Review
            </Button>
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}