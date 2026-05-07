'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, FlaskConical, ScanLine, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

function fmtTime(d: any) {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const { data: notifData } = useQuery({
    queryKey: ['lab-notifications'],
    queryFn: async () => {
      const r = await fetch('/api/notifications/lab-results');
      if (!r.ok) return { notifications: [], count: 0 };
      return (await r.json()).data;
    },
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const markRead = useMutation({
    mutationFn: async (ids: { labIds: string[]; imageIds: string[] }) => {
      await fetch('/api/notifications/lab-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-notifications'] }),
  });

  const notifications: any[] = notifData?.notifications ?? [];
  const count = notifData?.count ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleMarkAllRead() {
    const labIds = notifications.filter(n => n.type === 'LAB').map(n => n.id);
    const imageIds = notifications.filter(n => n.type === 'IMAGE').map(n => n.id);
    markRead.mutate({ labIds, imageIds });
    setShowNotif(false);
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{title}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(v => !v)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
          >
            <Bell className={`w-5 h-5 ${count > 0 ? 'text-amber-500' : ''}`} />
            {count > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-gray-800 text-sm">Kết quả xét nghiệm mới</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">{count}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {count > 0 && (
                    <button onClick={handleMarkAllRead}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium px-2 py-1 hover:bg-sky-50 rounded">
                      Đánh dấu đã đọc
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Không có kết quả mới
                  </div>
                ) : (
                  notifications.map(n => (
                    <Link
                      key={`${n.type}-${n.id}`}
                      href={`/medical-records/${n.medicalRecordId}`}
                      onClick={() => {
                        markRead.mutate({
                          labIds: n.type === 'LAB' ? [n.id] : [],
                          imageIds: n.type === 'IMAGE' ? [n.id] : [],
                        });
                        setShowNotif(false);
                      }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${n.type === 'LAB' ? 'bg-purple-100' : 'bg-teal-100'}`}>
                        {n.type === 'LAB'
                          ? <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                          : <ScanLine className="w-3.5 h-3.5 text-teal-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{n.name}</p>
                        <p className="text-xs text-gray-500 truncate">{n.patientName} · {n.patientCode}</p>
                        {n.result && (
                          <p className="text-xs text-green-700 font-medium mt-0.5 truncate">↳ {n.result}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{fmtTime(n.resultDate)}</span>
                    </Link>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <Link href="/lab-orders" onClick={() => setShowNotif(false)}
                    className="text-xs text-sky-600 hover:text-sky-800 font-medium">
                    Xem tất cả kết quả xét nghiệm →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 hidden md:flex">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Tìm kiếm...</span>
        </div>
      </div>
    </header>
  );
}
