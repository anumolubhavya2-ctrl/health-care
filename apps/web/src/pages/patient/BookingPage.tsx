import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Calendar, Clock, Video, Phone, MapPin, AlertCircle } from 'lucide-react';
import { doctorApi, appointmentApi } from '../../api/endpoints';
import { Avatar } from '../../components/ui/Avatar';
import { DoctorStatusBadge } from '../../components/ui/DoctorStatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

type ConsultType = 'IN_PERSON' | 'VIDEO' | 'PHONE';

const generateDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(new Date().getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [consultType, setConsultType] = useState<ConsultType>('IN_PERSON');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');

  const { data: doctorData, isLoading: doctorLoading } = useQuery({
    queryKey: ['doctor', id], queryFn: () => doctorApi.getById(id!), enabled: !!id,
  });
  const doctor = doctorData?.data?.data;

  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['doctor-availability', id, dateStr],
    queryFn: () => doctorApi.getAvailability(id!, dateStr),
    enabled: !!id && !!dateStr,
  });

  const slots = slotsData?.data?.data?.slots ?? [];

  const bookMutation = useMutation({
    mutationFn: () => appointmentApi.book({
      doctorId: id!, scheduledDate: selectedDate!.toISOString(),
      scheduledTime: selectedTime, consultationType: consultType,
      symptoms: symptoms || undefined, notes: notes || undefined,
    }),
    onSuccess: (res) => {
      const appt = res.data?.data?.appointment;
      toast.success(`Appointment booked! Token #${res.data?.data?.tokenNumber}`);
      navigate(`/appointments/${appt?.id}/confirm`);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed.');
    },
  });

  const getFee = () => {
    if (!doctor) return 0;
    if (consultType === 'VIDEO' && doctor.videoFee) return doctor.videoFee;
    if (consultType === 'PHONE' && doctor.phoneFee) return doctor.phoneFee;
    return doctor.consultationFee;
  };

  if (doctorLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!doctor) return <div className="page-container py-10 text-center"><p>Doctor not found</p></div>;

  const dates = generateDates();

  return (
    <div className="page-container py-8 max-w-5xl">
      <Link to={`/doctors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} />Back to doctor profile
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Consultation type */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Consultation Type</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'IN_PERSON' as ConsultType, icon: MapPin, label: 'In Person', fee: doctor.consultationFee, available: true },
                { type: 'VIDEO' as ConsultType, icon: Video, label: 'Video Call', fee: doctor.videoFee, available: doctor.isAvailableForVideo },
                { type: 'PHONE' as ConsultType, icon: Phone, label: 'Phone Call', fee: doctor.phoneFee, available: doctor.isAvailableForPhone },
              ].map(({ type, icon: Icon, label, fee, available }) => (
                <button key={type} disabled={!available} onClick={() => setConsultType(type)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${consultType === type ? 'border-primary-500 bg-primary-50' : available ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 opacity-40 cursor-not-allowed'}`}>
                  <Icon size={20} className={`mx-auto mb-1.5 ${consultType === type ? 'text-primary-600' : 'text-gray-500'}`} />
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  {fee && <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(fee)}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Date selection */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary-600" />Select Date</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((date, i) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                    className={`flex-shrink-0 flex flex-col items-center p-3 min-w-[68px] rounded-xl border-2 transition-all ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-xs text-gray-500 uppercase">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>{date.getDate()}</span>
                    {i === 0 && <span className="text-[10px] text-primary-600 font-medium">Today</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock size={18} className="text-primary-600" />Select Time</h2>
              {slotsLoading ? <div className="flex justify-center py-6"><Spinner /></div> :
                slots.length === 0 ? <p className="text-center text-gray-500 py-4">No slots available for this date</p> : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map((slot) => (
                      <button key={slot.time} disabled={!slot.available} onClick={() => setSelectedTime(slot.time)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${selectedTime === slot.time ? 'border-primary-500 bg-primary-600 text-white' : slot.available ? 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Symptoms & Notes */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Additional Information</h2>
            <div>
              <label className="label">Symptoms / Reason for visit</label>
              <textarea className="input resize-none" rows={3} placeholder="Briefly describe your symptoms..."
                value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
            </div>
            <div>
              <label className="label">Additional notes (optional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Any other info for the doctor..."
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card p-5 space-y-5 sticky top-24">
            <h2 className="font-semibold text-gray-900">Booking Summary</h2>
            <div className="flex items-center gap-3">
              <Avatar firstName={doctor.firstName} lastName={doctor.lastName} image={doctor.profileImage} size="md" />
              <div>
                <p className="font-medium text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</p>
                <p className="text-xs text-gray-500">{doctor.specialties?.[0]?.specialty?.name}</p>
                <DoctorStatusBadge status={doctor.status} />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{consultType.replace('_', ' ')}</span></div>
              {selectedDate && <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{formatDate(selectedDate)}</span></div>}
              {selectedTime && <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{formatTime(selectedTime)}</span></div>}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-gray-500">Fee</span>
                <span className="font-bold text-gray-900 text-base">{formatCurrency(getFee())}</span>
              </div>
            </div>

            {!selectedDate && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <AlertCircle size={14} />Select a date and time to proceed
              </div>
            )}

            <button onClick={() => bookMutation.mutate()} disabled={!selectedDate || !selectedTime || bookMutation.isPending} className="btn-primary w-full">
              {bookMutation.isPending ? <Spinner size="sm" /> : 'Confirm Booking'}
            </button>
            <p className="text-xs text-gray-400 text-center">Free cancellation up to 2 hours before the appointment</p>
          </div>
        </div>
      </div>
    </div>
  );
};
