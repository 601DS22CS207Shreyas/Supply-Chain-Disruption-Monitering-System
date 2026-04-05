import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { shipmentsApi } from '../../api/ShipmentsApi';
import type { DashboardSummaryResponse, ShipmentResponse } from '../../types';

// ── Risk badge ────────────────────────────────────────────────────────────────
const RiskBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    LOW:      'bg-green-100 text-green-700',
    MEDIUM:   'bg-yellow-100 text-yellow-700',
    HIGH:     'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
    UNKNOWN:  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? styles.UNKNOWN}`}>
      {level}
    </span>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING:      'bg-gray-100 text-gray-600',
    IN_TRANSIT:   'bg-blue-100 text-blue-700',
    AT_WAREHOUSE: 'bg-purple-100 text-purple-700',
    DELAYED:      'bg-red-100 text-red-700',
    DELIVERED:    'bg-green-100 text-green-700',
    CANCELLED:    'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

const KpiCard = ({ title, value, subtitle, icon, color }: KpiCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [recentShipments, setRecentShipments] = useState<ShipmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); 

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, shipmentsData] = await Promise.all([
        dashboardApi.getSummary(),
        shipmentsApi.getShipments({ page: 0, size: 5 }),
      ]);
      setSummary(summaryData);
      setRecentShipments(shipmentsData.content);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchData} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Live overview of your supply chain</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI cards ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Shipments"
            value={summary.totalShipments}
            subtitle={`${summary.inTransitCount} in transit`}
            icon={<Package size={18} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <KpiCard
            title="Delayed"
            value={summary.delayedCount}
            subtitle={`${summary.pendingCount} pending`}
            icon={<Clock size={18} className="text-orange-600" />}
            color="bg-orange-50"
          />
          <KpiCard
            title="Active Disruptions"
            value={summary.activeDisruptionEvents}
            subtitle={`${summary.criticalDisruptionEvents} critical`}
            icon={<AlertTriangle size={18} className="text-red-600" />}
            color="bg-red-50"
          />
          <KpiCard
            title="Unread Alerts"
            value={summary.unreadAlertsCount}
            subtitle={`${summary.criticalRiskCount} critical risk`}
            icon={<Bell size={18} className="text-purple-600" />}
            color="bg-purple-50"
          />
        </div>
      )}

      {/* ── Second row: risk overview + delivered ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Avg Risk Score"
            value={`${(summary.averageRiskScore * 100).toFixed(0)}%`}
            subtitle={`${summary.highRiskCount} high risk shipments`}
            icon={<TrendingUp size={18} className="text-yellow-600" />}
            color="bg-yellow-50"
          />
          <KpiCard
            title="Delivered"
            value={summary.deliveredCount}
            subtitle="Successfully completed"
            icon={<CheckCircle size={18} className="text-green-600" />}
            color="bg-green-50"
          />
          <KpiCard
            title="Critical Risk"
            value={summary.criticalRiskCount}
            subtitle="Needs immediate attention"
            icon={<XCircle size={18} className="text-red-600" />}
            color="bg-red-50"
          />
        </div>
      )}

      {/* ── Recent shipments table ── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent Shipments</h3>
          <a href="/shipments" className="text-sm text-blue-600 hover:underline">
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tracking</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Route</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Carrier</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Risk</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentShipments.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/shipments/${shipment.id}`)}
                >
                  <td className="px-5 py-3.5 font-medium text-blue-600">
                    {shipment.trackingNumber}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    <span className="truncate block max-w-[180px]">
                      {shipment.origin} → {shipment.destination}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{shipment.carrier}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskBadge level={shipment.riskLevel} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(shipment.scheduledArrival).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
