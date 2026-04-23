'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type WholesaleApplication = {
  id: string;
  user_id: string;
  status: string;
  business_info: {
    name: string;
    location: string;
    whatsapp: string;
  };
  created_at: string;
};

const rejectionReasons = [
  'Outside Delivery Zone',
  'Insufficient Business Proof',
  'Incomplete Application',
  'Business Not Verified',
];

export default function PartnersPage() {
  const [applications, setApplications] = useState<WholesaleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<WholesaleApplication | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('wholesale_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      setToast('Error loading applications');
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    // Optimistic update
    setApplications(prev => prev.filter(app => app.id !== selectedApp.id));
    setShowApproveModal(false);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.rpc('handle_wholesale_approval', {
        app_id: selectedApp.id,
        target_user_id: selectedApp.user_id,
        new_status: 'approved',
      });

      if (error) throw error;

      setToast(`Success: ${selectedApp.business_info.name} is now a verified Wholesale Partner.`);
    } catch (error) {
      console.error('Error approving application:', error);
      setToast('Error approving application. Please try again.');
      // Add back to list
      setApplications(prev => [...prev, selectedApp]);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !selectedReason) return;

    // Optimistic update
    setApplications(prev => prev.filter(app => app.id !== selectedApp.id));
    setShowRejectModal(false);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.rpc('handle_wholesale_approval', {
        app_id: selectedApp.id,
        target_user_id: selectedApp.user_id,
        new_status: 'rejected',
        rejection_reason: selectedReason,
      });

      if (error) throw error;

      setToast(`Application from ${selectedApp.business_info.name} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting application:', error);
      setToast('Error rejecting application. Please try again.');
      // Add back to list
      setApplications(prev => [...prev, selectedApp]);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (toast) showToast(toast);
  }, [toast]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Wholesale Partners Review Queue</h1>

      {toast && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {toast}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Business Name</th>
              <th className="px-4 py-2 border">Location</th>
              <th className="px-4 py-2 border">WhatsApp</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td className="px-4 py-2 border">{app.business_info.name}</td>
                <td className="px-4 py-2 border">{app.business_info.location}</td>
                <td className="px-4 py-2 border">
                  <a href={`https://wa.me/${app.business_info.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    {app.business_info.whatsapp}
                  </a>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => { setSelectedApp(app); setShowApproveModal(true); }}
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { setSelectedApp(app); setShowRejectModal(true); }}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded">
            <h2 className="text-xl mb-4">Confirm Approval</h2>
            <p>Elevate {selectedApp.business_info.name} to Wholesale Partner?</p>
            <div className="mt-4">
              <button onClick={handleApprove} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
                Confirm
              </button>
              <button onClick={() => setShowApproveModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded">
            <h2 className="text-xl mb-4">Reject Application</h2>
            <p>Select a reason for rejecting {selectedApp.business_info.name}:</p>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="mt-2 p-2 border rounded w-full"
            >
              <option value="">Select reason</option>
              {rejectionReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            <div className="mt-4">
              <button onClick={handleReject} className="bg-red-500 text-white px-4 py-2 rounded mr-2" disabled={!selectedReason}>
                Reject
              </button>
              <button onClick={() => setShowRejectModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
