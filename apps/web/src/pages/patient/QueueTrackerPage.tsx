import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, Hash, RefreshCw, User, AlertTriangle } from 'lucide-react';
import { queueApi } from '../../api/endpoints';
import { DoctorStatusBadge } from '../../components/ui/DoctorStatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { useSocket } from '../../hooks/useSocket';
import type { DoctorStatus } from '../../types';

export const QueueTrackerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId') ?? '';
  const appointmentId = searchParams.get('appointmentId') ?? '';
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['queue', doctorId],
    queryFn: () => queueApi.getByDoctor(doctorId),
    enabled: !!doctorId,
    refetchInterval: 15000,
  });

  const { data: myPositionData } = useQuery({
    queryKey: ['my-queue-position', appointmentId],
    queryFn: () => queueApi.getMyPosition(appointmentId),
    enabled: !!appointmentId,
    refetchInterval: 15000,
  });

  const handleQueueUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['queue', doctorId] });
    queryClient.invalidateQueries({ queryKey: ['my-queue-position', appointmentId] });
    setLastUpdated(new Date());
  }, [doctorId, appointmentId, queryClient]);

  useSocket({ subscribeQueue: doctorId || undefined, onQueueUpdate: handleQueueUpdate });

  const queueInfo = data?.data?.data;
  const doctor = queueInfo?.doctor;
  const queue = queueInfo?.queue;
  const myEntry = Array.isArray(myPositionData?.data?.data) ? null : myPositionData?.data?.data;

  if (!doctorId) return (
    <div className="p-6 text-center text-gray-500">
      <Activity size={48} className="text-gray-300 mx-auto mb-3" />
      <p>No doctor selected. Open this page from your appointment details.</p>
    </div>
  );

  const activeEntries = queue?.entries?.filter(e => !e.completedAt && !e.isSkipped) ?? [];
  const currentToken = queue?.currentToken ?? 0;
  const aheadCount = myEntry ? (myEntry as { aheadCount?: number }).aheadCount ?? 0 : 0;
  const estimatedWait = myEntry ? (myEntry as { estimatedWaitMinutes?: number }).estimatedWaitMinutes ?? 0 : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5">Updated {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary btn-sm"><RefreshCw size={15} />Refresh</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-5">
          {/* Doctor status */}
          {doctor && (
            <div className="card p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Dr. {(doctor as { firstName?: string }).firstName} {(doctor as { lastName?: string }).lastName}</p>
                <div className="mt-1.5">
                  <DoctorStatusBadge status={(doctor as { status?: DoctorStatus }).status ?? 'OFFLINE'} />
                </div>
                {(doctor as { statusMessage?: string }).statusMessage && (
                  <p className="text-sm text-gray-500 mt-1">{(doctor as { statusMessage?: string }).statusMessage}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Serving now</p>
                <p className="text-3xl font-black text-primary-700">#{currentToken}</p>
              </div>
            </div>
          )}

          {/* My position */}
          {myEntry && (
            <div className="card p-5 border-2 border-primary-200 bg-primary-50/30">
              <h3 className="font-semibold text-primary-900 mb-4">Your Position</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Hash size={20} className="text-white" />
                  </div>
                  <p className="text-2xl font-black text-primary-700">#{(myEntry as { tokenNumber?: number }).tokenNumber}</p>
                  <p className="text-xs text-gray-500">Your Token</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <User size={20} className="text-amber-700" />
                  </div>
                  <p className="text-2xl font-black text-amber-700">{aheadCount}</p>
                  <p className="text-xs text-gray-500">Ahead of you</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Clock size={20} className="text-teal-700" />
                  </div>
                  <p className="text-2xl font-black text-teal-700">~{estimatedWait}m</p>
                  <p className="text-xs text-gray-500">Est. wait</p>
                </div>
              </div>

              {aheadCount === 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm">
                  <Activity size={16} className="animate-pulse" />It's almost your turn! Please be ready.
                </div>
              )}
              {aheadCount === 1 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-sm">
                  <AlertTriangle size={16} />One patient ahead — please proceed to the clinic.
                </div>
              )}
            </div>
          )}

          {/* Queue list */}
          {queue && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Queue ({activeEntries.length} waiting)</h3>
                <span className="text-xs text-gray-500">Avg {queue.avgWaitMinutes} min/patient</span>
              </div>

              {activeEntries.length === 0 ? (
                <p className="text-center text-gray-400 py-6">Queue is empty</p>
              ) : (
                <div className="space-y-2">
                  {activeEntries.slice(0, 10).map((entry, idx) => (
                    <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                        {entry.position}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Token #{entry.tokenNumber}</p>
                        {entry.checkedInAt && <p className="text-xs text-emerald-600">Checked in ✓</p>}
                      </div>
                      {idx === 0 && <span className="text-xs text-primary-600 font-medium bg-primary-100 px-2 py-0.5 rounded-full">Current</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
