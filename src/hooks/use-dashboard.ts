import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  todayAppointmentsTotal: number;
  todayAppointmentsCompleted: number;
  todayAppointmentsPending: number;
  todayAppointmentsInProgress: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  monthRevenue: string;
  unpaidInvoicesCount: number;
  totalUnpaid: string;
  activeDoctors: number;
  appointmentsThisMonth: number;
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/reports/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      return result.data as {
        stats: DashboardStats;
        recentAppointments: any[];
        unpaidInvoices: any[];
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
