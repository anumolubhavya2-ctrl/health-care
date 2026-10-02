import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Plus, AlertTriangle, ChevronRight, ArrowUpCircle } from 'lucide-react';
import { supportApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../utils/helpers';
import type { SupportMessage } from '../../types';
import toast from 'react-hot-toast';

const TicketList: React.FC = () => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['my-tickets'], queryFn: supportApi.getMyTickets });
  const tickets = data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => supportApi.createTicket(form),
    onSuccess: () => {
      toast.success('Support ticket created');
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setShowNewModal(false);
      setForm({ subject: '', description: '', category: '' });
    },
  });

  const statusColors: Record<string, string> = {
    OPEN: 'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    ESCALATED: 'bg-orange-100 text-orange-700',
    RESOLVED: 'bg-gray-100 text-gray-600',
    CLOSED: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-500 mt-0.5">Get help from our team</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary btn-sm"><Plus size={15} />New Ticket</button>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> :
        tickets.length === 0 ? (
          <EmptyState icon={<MessageCircle size={48} />} title="No support tickets"
            description="Have an issue? Create a support ticket and our team will help you."
            action={<button onClick={() => setShowNewModal(true)} className="btn-primary">Create Ticket</button>} />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link key={ticket.id} to={`/support/${ticket.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                    {ticket.messages?.[0]?.message ?? ticket.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(ticket.updatedAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`badge text-xs ${statusColors[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>{ticket.status}</span>
                  <span className="text-xs text-gray-400">{ticket._count?.messages ?? 0} messages</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
            ))}
          </div>
        )}

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Support Ticket">
        <div className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" placeholder="Brief description of your issue" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              <option value="appointment">Appointment Issue</option>
              <option value="payment">Payment / Refund</option>
              <option value="doctor">Doctor Complaint</option>
              <option value="technical">Technical Problem</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={4} placeholder="Describe your issue in detail..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.subject || !form.description || createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? <Spinner size="sm" /> : 'Submit Ticket'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const TicketChat: React.FC<{ ticketId: string }> = ({ ticketId }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['ticket', ticketId], queryFn: () => supportApi.getTicketById(ticketId) });
  const ticket = data?.data?.data;

  const handleNewMessage = useCallback((msg: unknown) => {
    queryClient.setQueryData(['ticket', ticketId], (old: typeof data) => {
      if (!old?.data?.data) return old;
      return { ...old, data: { ...old.data, data: { ...old.data.data, messages: [...(old.data.data.messages ?? []), msg as SupportMessage] } } };
    });
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketId, queryClient]);

  useSocket({ subscribeSupport: ticketId, onSupportMessage: handleNewMessage });

  const sendMutation = useMutation({
    mutationFn: () => supportApi.sendMessage(ticketId, message),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () => supportApi.escalate(ticketId),
    onSuccess: () => { toast.success('Ticket escalated to human support'); queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] }); },
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.messages]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!ticket) return <div className="p-6 text-center text-gray-500">Ticket not found</div>;

  const isClosed = ['RESOLVED', 'CLOSED'].includes(ticket.status);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="card p-4 mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold text-gray-900">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge text-xs ${ticket.status === 'ESCALATED' ? 'bg-orange-100 text-orange-700' : 'bg-primary-100 text-primary-700'}`}>{ticket.status}</span>
            <span className="badge text-xs bg-gray-100 text-gray-600">{ticket.priority}</span>
          </div>
        </div>
        {!isClosed && ticket.status !== 'ESCALATED' && (
          <button onClick={() => escalateMutation.mutate()} disabled={escalateMutation.isPending} className="btn-secondary btn-sm text-orange-600 border-orange-200 hover:bg-orange-50">
            <ArrowUpCircle size={14} />Escalate to Human
          </button>
        )}
      </div>

      {ticket.status === 'ESCALATED' && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl text-sm text-orange-700 mb-4">
          <AlertTriangle size={16} />Escalated — a human agent will respond shortly.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {ticket.messages?.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                {!isMe && <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender?.role === 'ADMIN' ? '🛡️ Support Agent' : 'You'}</p>}
                <p>{msg.message}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>{formatRelativeTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMutation.mutate(); }} className="flex gap-3">
          <input className="input flex-1" placeholder="Type your message..."
            value={message} onChange={(e) => setMessage(e.target.value)} />
          <button type="submit" disabled={!message.trim() || sendMutation.isPending} className="btn-primary px-4">
            {sendMutation.isPending ? <Spinner size="sm" /> : <Send size={18} />}
          </button>
        </form>
      ) : (
        <div className="text-center p-4 bg-gray-100 rounded-xl text-sm text-gray-500">This ticket is {ticket.status.toLowerCase()}</div>
      )}
    </div>
  );
};

export const SupportChatPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId?: string }>();
  return ticketId ? <TicketChat ticketId={ticketId} /> : <TicketList />;
};
