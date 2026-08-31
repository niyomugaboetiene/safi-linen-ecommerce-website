'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  CreditCard,
  CheckCircle2,
  XCircle,
  Smartphone,
} from 'lucide-react';
import { paymentAPI } from '@/lib/api';
import { formatPrice, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments(1);
  }, [search, statusFilter]);

  const fetchPayments = async (page: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await paymentAPI.getPayments(params);
      setPayments(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      await paymentAPI.verifyPayment(selectedPayment._id, {
        status: actionType === 'verify' ? 'verified' : 'rejected',
      });
      toast.success(
        actionType === 'verify'
          ? 'Payment verified successfully'
          : 'Payment rejected'
      );
      setSelectedPayment(null);
      setActionType(null);
      fetchPayments(pagination.page);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchPayments(page);
  };

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const verifiedCount = payments.filter((p) => p.status === 'verified').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Payments
        </h1>
        <p className="text-neutral-600 mt-1">
          Verify and manage customer payments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-800">
                {pendingCount}
              </p>
              <p className="text-sm text-amber-600 mt-1">
                Pending Verification
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-800">
                {verifiedCount}
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                Verified Payments
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-800">
                {rejectedCount}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Rejected Payments
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction ID or phone..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {payment.transactionId}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {payment.phoneNumber}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-900">
                        {payment.user?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {payment.user?.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className={`h-4 w-4 ${
                          payment.method === 'mtn' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                        <span className="text-sm text-neutral-700 uppercase">
                          {payment.method}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} type="payment" />
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setActionType('verify');
                            }}
                            variant="success"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Verify
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setActionType('reject');
                            }}
                            variant="danger"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {payment.status === 'verified' ? 'Verified' : 'Rejected'}
                          {payment.verifiedAt && (
                            <span className="block">
                              {formatDateTime(payment.verifiedAt)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-1">No payments found</p>
              <p className="text-sm text-neutral-400">
                {statusFilter
                  ? `No ${statusFilter} payments found`
                  : 'All customer payments will appear here'}
              </p>
            </div>
          )}
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

      {/* Verify/Reject Modal */}
      <Modal
        isOpen={!!selectedPayment && !!actionType}
        onClose={() => {
          setSelectedPayment(null);
          setActionType(null);
        }}
        title={actionType === 'verify' ? 'Verify Payment' : 'Reject Payment'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Transaction ID:</span>
              <span className="text-sm font-medium text-neutral-900">
                {selectedPayment?.transactionId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Amount:</span>
              <span className="text-sm font-medium text-neutral-900">
                {formatPrice(selectedPayment?.amount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Phone:</span>
              <span className="text-sm font-medium text-neutral-900">
                {selectedPayment?.phoneNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Method:</span>
              <span className="text-sm font-medium text-neutral-900 uppercase">
                {selectedPayment?.method}
              </span>
            </div>
          </div>

          {actionType === 'verify' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                Have you confirmed that the money has been received?
              </p>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Are you sure you want to reject this payment? The customer will be notified.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handlePaymentAction}
              loading={processing}
              variant={actionType === 'verify' ? 'success' : 'danger'}
              fullWidth
            >
              {actionType === 'verify' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Verification
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject Payment
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setSelectedPayment(null);
                setActionType(null);
              }}
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