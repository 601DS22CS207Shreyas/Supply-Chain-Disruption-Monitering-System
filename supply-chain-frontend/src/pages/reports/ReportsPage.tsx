import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { shipmentsApi } from '../../api/ShipmentsApi';
import type { DashboardSummaryResponse, ShipmentResponse } from '../../types';

// ── Colors for charts ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  IN_TRANSIT:   '#3B82F6',
  PENDING:      '#6B7280',
  DELAYED:      '#EF4444',
  DELIVERED:    '#22C55E',
  AT_WAREHOUSE: '#A855F7',
  CANCELLED:    '#9CA3AF',
};

const RISK_COLORS: Record<string, string> = {
  LOW:      '#22C55E',
  MEDIUM:   '#EAB308',
  HIGH:     '#F97316',
  CRITICAL: '#EF4444',
  UNKNOWN:  '#9CA3AF',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, shipmentsData] = await Promise.all([
        dashboardApi.getSummary(),
        shipmentsApi.getShipments({ page: 0, size: 50 }),
      ]);
      setSummary(summaryData);
      setShipments(shipmentsData.content);
    } catch {
      setError('Failed to load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Build chart data from shipments ──────────────────────────────────────
  const statusChartData = summary ? [
    { name: 'In Transit',   value: summary.inTransitCount,  color: STATUS_COLORS.IN_TRANSIT },
    { name: 'Pending',      value: summary.pendingCount,    color: STATUS_COLORS.PENDING },
    { name: 'Delayed',      value: summary.delayedCount,    color: STATUS_COLORS.DELAYED },
    { name: 'Delivered',    value: summary.deliveredCount,  color: STATUS_COLORS.DELIVERED },
  ].filter(d => d.value > 0) : [];

  const riskChartData = (() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      const level = s.riskLevel ?? 'UNKNOWN';
      counts[level] = (counts[level] ?? 0) + 1;
    });
    return Object.entries(counts).map(([level, count]) => ({
      name: level,
      value: count,
      color: RISK_COLORS[level] ?? '#9CA3AF',
    }));
  })();

  const carrierChartData = (() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      counts[s.carrier] = (counts[s.carrier] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([carrier, count]) => ({ carrier, count }));
  })();

  const modeChartData = (() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      counts[s.transportMode] = (counts[s.transportMode] ?? 0) + 1;
    });
    return Object.entries(counts).map(([mode, count]) => ({ mode, count }));
  })();

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
        <button onClick={fetchData} className="text-blue-600 text-sm hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visual insights across your supply chain</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Summary stat row ── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Shipments',   value: summary.totalShipments },
            { label: 'Active Disruptions', value: summary.activeDisruptionEvents },
            { label: 'High Risk',          value: summary.highRiskCount },
            { label: 'Avg Risk Score',     value: `${(summary.averageRiskScore * 100).toFixed(0)}%` },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Shipment status pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-800 text-sm">Shipments by Status</h3>
          </div>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} shipments`, '']} />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No data</div>
          )}
        </div>

        {/* Risk level distribution pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-800 text-sm">Shipments by Risk Level</h3>
          </div>
          {riskChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} shipments`, '']} />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
              No risk predictions yet — run predictions on shipments first
            </div>
          )}
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Shipments by carrier bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-800 text-sm">Shipments by Carrier</h3>
          </div>
          {carrierChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={carrierChartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="carrier"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No data</div>
          )}
        </div>

        {/* Shipments by transport mode bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-800 text-sm">Shipments by Transport Mode</h3>
          </div>
          {modeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modeChartData} margin={{ top: 5, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mode" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
