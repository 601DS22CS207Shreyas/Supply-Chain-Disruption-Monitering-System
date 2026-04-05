import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { shipmentsApi } from '../../api/ShipmentsApi';
import type { ShipmentResponse, PageResponse } from '../../types';

// ── Reusable badges ───────────────────────────────────────────────────────────
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

const ModeIcon: Record<string, string> = {
  AIR:       '✈',
  SEA:       '🚢',
  ROAD:      '🚛',
  RAIL:      '🚂',
  MULTIMODAL:'🔄',
};

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending',      value: 'PENDING' },
  { label: 'In Transit',   value: 'IN_TRANSIT' },
  { label: 'At Warehouse', value: 'AT_WAREHOUSE' },
  { label: 'Delayed',      value: 'DELAYED' },
  { label: 'Delivered',    value: 'DELIVERED' },
  { label: 'Cancelled',    value: 'CANCELLED' },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<PageResponse<ShipmentResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictingId, setPredictingId] = useState<number | null>(null);

  // ── Filters & pagination state ────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  // ── Fetch shipments ───────────────────────────────────────────────────────
  const fetchShipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await shipmentsApi.getShipments({
        search: search || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      });
      setData(result);
    } catch {
      setError('Failed to load shipments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, [search, status, page]);

  // ── Search submit ─────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  // ── Clear filters ─────────────────────────────────────────────────────────
  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPage(0);
  };

  // ── Trigger risk prediction ───────────────────────────────────────────────
  const handlePredict = async (e: React.MouseEvent, shipmentId: number) => {
    e.stopPropagation(); // prevent row click navigation
    setPredictingId(shipmentId);
    try {
      await shipmentsApi.predictRisk(shipmentId);
      await fetchShipments(); // refresh to show updated risk score
    } catch {
      alert('Prediction failed. Please try again.');
    } finally {
      setPredictingId(null);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shipments</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.totalElements} shipments found` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={fetchShipments}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Search + filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by tracking no, origin, destination, carrier..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400 shrink-0" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {(search || status) && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-gray-600 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchShipments} className="text-blue-600 text-sm hover:underline">
              Retry
            </button>
          </div>
        ) : data?.content.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm">No shipments found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tracking</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Origin</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Destination</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Carrier</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Mode</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Risk</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ETA</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.content.map((shipment) => (
                    <tr
                      key={shipment.id}
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-blue-600 whitespace-nowrap">
                        {shipment.trackingNumber}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[140px] truncate">
                        {shipment.origin}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[140px] truncate">
                        {shipment.destination}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                        {shipment.carrier}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        <span title={shipment.transportMode}>
                          {ModeIcon[shipment.transportMode]} {shipment.transportMode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {shipment.latestRiskScore !== null ? (
                          <div className="flex items-center gap-2">
                            <RiskBadge level={shipment.riskLevel} />
                            <span className="text-xs text-gray-400">
                              {(shipment.latestRiskScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not predicted</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(shipment.scheduledArrival).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={(e) => handlePredict(e, shipment.id)}
                          disabled={predictingId === shipment.id}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md px-2 py-1 hover:bg-blue-50 transition disabled:opacity-50"
                        >
                          {predictingId === shipment.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Zap size={12} />
                          }
                          Predict
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {data && data.totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
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
    </div>
  );
}
