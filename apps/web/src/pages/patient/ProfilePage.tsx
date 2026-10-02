import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Save, Shield } from 'lucide-react';
import { patientApi, authApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { Select } from '../../components/ui/Select';
import type { Gender } from '../../types';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const { data, isLoading } = useQuery({ queryKey: ['patient-profile'], queryFn: patientApi.getMyProfile });
  const patient = data?.data?.data;

  const [form, setForm] = useState({
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    gender: (patient?.gender as Gender) ?? 'PREFER_NOT_TO_SAY',
    bloodGroup: patient?.bloodGroup ?? '',
    city: patient?.city ?? '',
    state: patient?.state ?? '',
    pincode: patient?.pincode ?? '',
    emergencyContact: patient?.emergencyContact ?? '',
    emergencyPhone: patient?.emergencyPhone ?? '',
  });

  React.useEffect(() => {
    if (patient) {
      setForm({
        firstName: patient.firstName ?? '',
        lastName: patient.lastName ?? '',
        gender: patient.gender ?? 'PREFER_NOT_TO_SAY',
        bloodGroup: patient.bloodGroup ?? '',
        city: patient.city ?? '',
        state: patient.state ?? '',
        pincode: patient.pincode ?? '',
        emergencyContact: patient.emergencyContact ?? '',
        emergencyPhone: patient.emergencyPhone ?? '',
      });
    }
  }, [patient]);

  const updateMutation = useMutation({
    mutationFn: () => patientApi.updateMyProfile(form),
    onSuccess: () => { toast.success('Profile updated'); queryClient.invalidateQueries({ queryKey: ['patient-profile'] }); },
    onError: () => toast.error('Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
    onSuccess: () => { toast.success('Password changed'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: () => toast.error('Failed to change password'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const firstName = patient?.firstName ?? '';
  const lastName = patient?.lastName ?? '';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Avatar firstName={firstName} lastName={lastName} size="xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{firstName} {lastName}</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {([['profile', User, 'Profile'], ['security', Shield, 'Security']] as const).map(([tab, Icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
            options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }, { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }]} />
          <div>
            <label className="label">Blood Group</label>
            <input className="input" placeholder="e.g. A+" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
          </div>
          <h3 className="font-medium text-gray-800 pt-2">Emergency Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Name</label>
              <input className="input" placeholder="Name" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" placeholder="Phone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
            </div>
          </div>
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? <Spinner size="sm" /> : <Save size={16} />}Save Changes
          </button>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Change Password</h2>
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min. 8 characters" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="error-text">Passwords do not match</p>
            )}
          </div>
          <button
            onClick={() => passwordMutation.mutate()}
            disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword || passwordMutation.isPending}
            className="btn-primary">
            {passwordMutation.isPending ? <Spinner size="sm" /> : <Shield size={16} />}Update Password
          </button>
        </div>
      )}
    </div>
  );
};
