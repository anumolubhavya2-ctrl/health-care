import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, CheckCircle, Shield } from 'lucide-react';
import { appointmentApi, paymentApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
  { id: 'CARD', label: 'Card', icon: '💳', description: 'Debit / Credit card' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: '🏦', description: 'All major banks' },
  { id: 'WALLET', label: 'Wallet', icon: '👛', description: 'Paytm, Amazon Pay' },
];

export const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') ?? '';
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('UPI');

  const { data: apptData, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentApi.getById(appointmentId),
    enabled: !!appointmentId,
  });
  const appt = apptData?.data?.data;

  const payMutation = useMutation({
    mutationFn: () => paymentApi.pay(appointmentId, selectedMethod),
    onSuccess: () => {
      toast.success('Payment successful!');
      navigate(`/appointments/${appointmentId}`);
    },
    onError: () => toast.error('Payment failed. Please try again.'),
  });

  if (!appointmentId) return (
    <div className="page-container py-16 text-center">
      <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No appointment selected</p>
      <Link to="/appointments" className="btn-primary mt-4 inline-flex">View Appointments</Link>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!appt) return <div className="page-container py-10 text-center text-gray-500">Appointment not found</div>;

  if (appt.payment?.status === 'PAID') return (
    <div className="page-container py-16 max-w-md text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Already Paid</h2>
      <p className="text-gray-500 mt-2">This appointment has already been paid for.</p>
      <Link to={`/appointments/${appt.id}`} className="btn-primary mt-6 inline-flex">View Appointment</Link>
    </div>
  );

  return (
    <div className="page-container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h1>

      <div className="grid gap-6">
        {/* Order summary */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Appointment Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Doctor</span>
              <span className="font-medium">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Specialty</span>
              <span className="font-medium">{appt.doctor.specialties?.[0]?.specialty?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium">{formatDate(appt.scheduledDate)} at {formatTime(appt.scheduledTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">{appt.consultationType.replace('_', ' ')}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-700">Total Amount</span>
              <span className="font-bold text-xl text-gray-900">{appt.payment ? formatCurrency(appt.payment.amount) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Select Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">{method.icon}</div>
                <p className="font-medium text-gray-800 text-sm">{method.label}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
          <Shield size={18} className="text-emerald-600 flex-shrink-0" />
          <p>Your payment is secured with 256-bit SSL encryption. This is a demo environment — no real payment is processed.</p>
        </div>

        <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending} className="btn-primary btn-lg w-full">
          {payMutation.isPending ? <Spinner size="sm" /> : <CreditCard size={18} />}
          {payMutation.isPending ? 'Processing...' : `Pay ${appt.payment ? formatCurrency(appt.payment.amount) : ''}`}
        </button>
      </div>
    </div>
  );
};
