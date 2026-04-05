import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { alertsApi } from '../../api/alertsApi';
import type { AlertResponse, PageResponse } from '../../types';

// ── Severity badge ────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles: Record<string, string> = {
    LOW:      'bg-green-100 text-green-700',
    MEDIUM:   'bg-yellow-100 text-yellow-700',
    HIGH:     'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity] ?? 'bg-gray-100 text-gray-500'}`}>
      {severity}
    </span>
  );
};

// ── Alert type label ──────────────────────────────────────────────────────────
const alertTypeLabel: Record<string, string> = {
  HIGH_RISK_SHIPMENT:     'High Risk Shipment',
  CRITICAL_RISK_SHIPMENT: 'Critical Risk Shipment',
  SHIPMENT_DELAYED:       'Shipment Delayed',
  DISRUPTION_NEAR_ROUTE:  'Disruption Near Route',
  DELIVERY_OVERDUE:       'Delivery Overdue',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<PageResponse<AlertResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const PAGE_SIZE = 10;

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await alertsApi.getAlerts({ unreadOnly, page, size: PAGE_SIZE });
      setData(result);
    } catch {
      setError('Failed to load alerts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [unreadOnly, page]);

  const handleMarkRead = async (e: React.MouseEvent, alertId: number) => {
    e.stopPropagation();
    setMarkingId(alertId);
    try {
      await alertsApi.markAsRead(alertId);
      await fetchAlerts();
    } catch {
      alert('Failed to mark as read.');
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = data?.content.filter(a => !a.isRead).length ?? 0;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Alerts</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.totalElements} total` : 'Loading...'}
            {unreadCount > 0 && ` • ${unreadCount} unread on this page`}
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => { setUnreadOnly(e.target.checked); setPage(0); }}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Unread only</span>
        </label>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchAlerts} className="text-blue-600 text-sm hover:underline">Retry</button>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <BellOff size={32} className="text-gray-300" />
          <p className="text-gray-400 text-sm">
            {unreadOnly ? 'No unread alerts.' : 'No alerts found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data?.content.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(`/shipments/${alert.shipmentId}`)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${
                  !alert.isRead ? 'bg-blue-50 hover:bg-blue-50' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-100' :
                  alert.severity === 'HIGH'     ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <Bell size={14} className={
                    alert.severity === 'CRITICAL' ? 'text-red-500' :
                    alert.severity === 'HIGH'     ? 'text-orange-500' :
                    'text-gray-400'
                  } />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      {alertTypeLabel[alert.alertType] ?? alert.alertType}
                    </span>
                    <SeverityBadge severity={alert.severity} />
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-blue-600 font-medium">
                      {alert.trackingNumber}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Mark as read button */}
                {!alert.isRead && (
                  <button
                    onClick={(e) => handleMarkRead(e, alert.id)}
                    disabled={markingId === alert.id}
                    className="shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 border border-gray-200 rounded-md px-2 py-1 hover:bg-green-50 transition disabled:opacity-50"
                    title="Mark as read"
                  >
                    {markingId === alert.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCheck size={12} />
                    }
                    Read
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {data.number + 1} of {data.totalPages} — {data.totalElements} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={data.first}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.last}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
