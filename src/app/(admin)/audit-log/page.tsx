'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader, AlertCircle, ShieldCheck, Info } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

// ─── Helpers ─────────────────────────────────────────────

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-700';
    case 'UPDATE': return 'bg-blue-100 text-blue-700';
    case 'DELETE': return 'bg-red-100 text-red-600';
    case 'LOGIN':  return 'bg-gray-100 text-gray-600';
    case 'LOGOUT': return 'bg-gray-100 text-gray-600';
    default:       return 'bg-gray-100 text-gray-600';
  }
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    LOGIN:  'Đăng nhập',
    LOGOUT: 'Đăng xuất',
  };
  return labels[action] ?? action;
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN:        'Quản trị',
    DOCTOR:       'Bác sĩ',
    RECEPTIONIST: 'Lễ tân',
    PHARMACIST:   'Dược sĩ',
    ACCOUNTANT:   'Kế toán',
  };
  return labels[role] ?? role;
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const RESOURCE_OPTIONS = [
  'patient', 'appointment', 'invoice', 'drug', 'user',
  'medical-record', 'campaign', 'service', 'supplier',
];

// ─── CSV Export ───────────────────────────────────────────

function exportCSV(data: AuditLog[]) {
  const rows: string[][] = [['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'ID']];
  data.forEach(l =>
    rows.push([
      l.createdAt,
      l.user?.fullName ?? '',
      l.action,
      l.resource,
      l.resourceId ?? '',
    ])
  );
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audit-log.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Hook ─────────────────────────────────────────────────

function useAuditLogs(
  page: number,
  filters: { action: string; resource: string; dateFrom: string; dateTo: string }
) {
  return useQuery<ApiResponse<AuditLog[]>>({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filters.action)   params.set('action', filters.action);
      if (filters.resource) params.set('resource', filters.resource);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo)   params.set('dateTo', filters.dateTo);
      const res = await fetch(`/api/audit-logs?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Lỗi tải dữ liệu');
      }
      return res.json();
    },
    retry: false,
  });
}

// ─── Main Page ────────────────────────────────────────────

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    dateFrom: '',
    dateTo: '',
  });

  const { data, isLoading, error: fetchError } = useAuditLogs(page, filters);
  const logs: AuditLog[] = data?.data ?? [];
  const meta = data?.meta;

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }

  const inputCls = 'px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Nhật ký hoạt động</h1>
        <button
          onClick={() => exportCSV(logs)}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 rounded-lg font-medium transition-colors text-sm"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.action}
          onChange={e => updateFilter('action', e.target.value)}
          className={inputCls}
        >
          <option value="">Tất cả hành động</option>
          <option value="CREATE">Tạo mới</option>
          <option value="UPDATE">Cập nhật</option>
          <option value="DELETE">Xóa</option>
          <option value="LOGIN">Đăng nhập</option>
          <option value="LOGOUT">Đăng xuất</option>
        </select>

        <select
          value={filters.resource}
          onChange={e => updateFilter('resource', e.target.value)}
          className={inputCls}
        >
          <option value="">Tất cả đối tượng</option>
          {RESOURCE_OPTIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Từ ngày</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => updateFilter('dateFrom', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Đến ngày</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => updateFilter('dateTo', e.target.value)}
            className={inputCls}
          />
        </div>

        {(filters.action || filters.resource || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => { setFilters({ action: '', resource: '', dateFrom: '', dateTo: '' }); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Error / Loading / Table */}
      {fetchError ? (
        <div className="flex items-center justify-center h-64 text-red-600">
          <AlertCircle className="w-8 h-8 mr-2" />
          <span>{(fetchError as Error).message || 'Lỗi khi tải dữ liệu'}</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="w-8 h-8 animate-spin text-sky-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3 px-6 text-center">
              <ShieldCheck className="w-10 h-10 opacity-30" />
              <p className="font-medium">Không có nhật ký nào</p>
              <div className="flex items-start gap-2 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3 max-w-md">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <span>Nhật ký hoạt động sẽ được ghi tự động khi hệ thống cập nhật.</span>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Thời gian</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Người dùng</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Vai trò</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Hành động</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Đối tượng</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{log.user?.fullName ?? '—'}</div>
                          <div className="text-xs text-gray-400">{log.user?.email ?? ''}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.user ? getRoleLabel(log.user.role) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{log.resource}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {log.resourceId ? (
                            <span className="truncate block max-w-[120px]" title={log.resourceId}>
                              {log.resourceId}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {log.ipAddress ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                  <span className="text-gray-500">
                    Trang {meta.page}/{meta.totalPages} ({meta.total} bản ghi)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
