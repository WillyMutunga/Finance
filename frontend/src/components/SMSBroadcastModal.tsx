import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { ApiService } from '../services/api';

interface SMSBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Array<{
    id?: string;
    student_id?: string;
    first_name?: string;
    last_name?: string;
    admission_number?: string;
    guardian_name?: string;
    guardian_phone?: string;
    phone?: string;
    balance?: number;
  }>;
  onSuccess?: () => void;
}

export const SMSBroadcastModal: React.FC<SMSBroadcastModalProps> = ({
  isOpen,
  onClose,
  recipients,
  onSuccess
}) => {
  const [template, setTemplate] = useState(
    'Dear {guardian_name}, fee reminder for {student_name} (Adm: {admission_number}). Current balance is KES {balance}. Pay via Paybill 247247 Acc: {admission_number}.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validRecipients = recipients.filter((r) => Boolean(r.guardian_phone || r.phone));
  const sampleRecipient = validRecipients[0] || {
    guardian_name: 'Parent John',
    first_name: 'Willy',
    last_name: 'Mutunga',
    admission_number: '4000',
    balance: 20000
  };

  const previewMessage = template
    .replace('{guardian_name}', sampleRecipient.guardian_name || 'Parent')
    .replace('{student_name}', `${sampleRecipient.first_name || ''} ${sampleRecipient.last_name || ''}`.trim() || 'Student')
    .replace('{admission_number}', sampleRecipient.admission_number || '4000')
    .replace('{balance}', Number(sampleRecipient.balance || 0).toLocaleString());

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validRecipients.length === 0) {
      setError('No recipients with valid phone numbers available.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = validRecipients.map((r) => ({
        student_id: r.id || r.student_id,
        student_name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        admission_number: r.admission_number,
        guardian_name: r.guardian_name,
        phone: r.guardian_phone || r.phone || '',
        balance: r.balance
      }));

      const res = await ApiService.sendBulkSMS({
        recipients: payload,
        template,
        message_type: 'FEE_REMINDER'
      });

      if (res && res.status === 'success') {
        setResult(res);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      setError(err.message || 'SMS broadcast error');
    } finally {
      setLoading(false);
    }
  };

  const insertTag = (tag: string) => {
    setTemplate((prev) => prev + ' ' + tag);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Fee Balance SMS Broadcaster</h3>
              <p className="text-[11px] text-slate-300">
                Dispatch personalized reminders to {validRecipients.length} guardians
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SMS Broadcast Dispatched Successfully!</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                Sent {result.dispatched_count} SMS notifications (Total Cost: KES {result.cost_kes?.toFixed(2)})
              </p>
            </div>
          )}

          {/* Tag Helpers */}
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
              Click to insert dynamic tags:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['{guardian_name}', '{student_name}', '{admission_number}', '{balance}'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] font-bold transition-colors border border-slate-200"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Template Textarea */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Message Template ({template.length} characters)
            </label>
            <textarea
              required
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Live Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Sample Guardian SMS Preview:
            </span>
            <p className="text-xs text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
              "{previewMessage}"
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Estimated Cost: <span className="font-bold text-slate-800">KES {validRecipients.length * 1}.00</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || validRecipients.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Broadcast ({validRecipients.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};