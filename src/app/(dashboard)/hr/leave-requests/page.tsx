'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function LeaveRequests() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !profile) {
      router.push('/auth/login');
      return;
    }

    // Only admin and HR can access this page
    if (profile.role !== 'admin' && profile.role !== 'hr') {
      router.push('/dashboard');
      return;
    }

    fetchLeaveRequests();
  }, [user, profile, authLoading, router]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles(id, full_name, avatar_url, job_title)
        `);

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setLeaveRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { ...request, status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() } 
            : request
        )
      );
    } catch (error) {
      console.error('Error approving leave request:', error);
      alert('Failed to approve leave request');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setLeaveRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { ...request, status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() } 
            : request
        )
      );
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      alert('Failed to reject leave request');
    }
  };

  const filteredLeaveRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  };

  if (loading || authLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Leave Requests</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all leave requests from employees including their status, duration, and reason.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search leave requests"
          />
        </div>
        <div className="sm:w-64">
          <select
            id="status-filter"
            name="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Employee</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Duration</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Reason</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {filteredLeaveRequests.length > 0 ? (
                    filteredLeaveRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {request.profiles?.avatar_url ? (
                                <img className="h-10 w-10 rounded-full" src={request.profiles.avatar_url} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    {request.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">{request.profiles?.full_name}</div>
                              <div className="text-gray-500 dark:text-gray-400">{request.profiles?.job_title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div>{formatDate(request.start_date)}</div>
                          <div>to</div>
                          <div>{formatDate(request.end_date)}</div>
                          <div className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">
                            ({calculateDuration(request.start_date, request.end_date)} days)
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {request.reason}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XMarkIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                                Reject
                              </button>
                            </div>
                          )}
                          <Link href={`/hr/leave-requests/${request.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2 block">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No leave requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}