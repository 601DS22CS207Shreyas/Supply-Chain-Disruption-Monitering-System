import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Radio,
} from 'lucide-react';
import { disruptionsApi } from '../../api/disruptionsApi';
import type { DisruptionEventResponse, PageResponse } from '../../types';
import useAuthStore from '../../store/authStore';

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

// ── Event type badge ──────────────────────────────────────────────────────────
const EventTypeBadge = ({ type }: { type: string }) => {
  const styles: Record<string, string> = {
    NATURAL_DISASTER: 'bg-blue-100 text-blue-700',
    LABOR_STRIKE:     'bg-purple-100 text-purple-700',
    ACCIDENT:         'bg-red-100 text-red-700',
    GEOPOLITICAL:     'bg-orange-100 text-orange-700',
    INFRASTRUCTURE:   'bg-yellow-100 text-yellow-700',
    WEATHER:          'bg-cyan-100 text-cyan-700',
    OTHER:            'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] ?? 'bg-gray-100 text-gray-500'}`}>
      {type.replaceAll('_', ' ')}
    </span>
  );
};

// ── Disruption card ───────────────────────────────────────────────────────────
const DisruptionCard = ({ event }: { event: DisruptionEventResponse }) => (
  <div className={`bg-white rounded-xl border p-5 space-y-3 ${
    event.severity === 'CRITICAL' ? 'border-red-200' :
    event.severity === 'HIGH'     ? 'border-orange-200' :
    'border-gray-200'
  }`}>
    {/* Header */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <AlertTriangle
          size={16}
          className={`shrink-0 mt-0.5 ${
            event.severity === 'CRITICAL' ? 'text-red-500' :
            event.severity === 'HIGH'     ? 'text-orange-500' :
            event.severity === 'MEDIUM'   ? 'text-yellow-500' :
            'text-gray-400'
          }`}
        />
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">{event.title}</h3>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {event.isActive && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <Radio size={10} /> Active
          </span>
        )}
        <SeverityBadge severity={event.severity} />
      </div>
    </div>

    {/* Description */}
    {event.description && (
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
        {event.description}
      </p>
    )}

    {/* Meta info */}
    <div className="flex flex-wrap items-center gap-2">
      <EventTypeBadge type={event.eventType} />
      <span className="text-xs text-gray-400">•</span>
      <span className="text-xs text-gray-500">{event.location}</span>
      <span className="text-xs text-gray-400">•</span>
      <span className="text-xs text-gray-400">
        {new Date(event.eventDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </span>
      {event.impactRadiusKm && (
        <>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400">{event.impactRadiusKm} km radius</span>
        </>
      )}
    </div>

    {/* Source link */}
    {event.sourceUrl && event.sourceUrl !== 'https://example.com' && (
      <div className="flex items-center gap-1.5">
        <Newspaper size={12} className="text-gray-400" />
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {event.sourceName ?? 'View source'}
        </a>
      </div>
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function DisruptionsPage() {
  const { isAdmin } = useAuthStore();

  const [data, setData] = useState<PageResponse<DisruptionEventResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [activeOnly, setActiveOnly] = useState(false);
  const PAGE_SIZE = 9;

  const fetchDisruptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeOnly) {
        const active = await disruptionsApi.getActive();
        setData({
          content: active,
          totalElements: active.length,
          totalPages: 1,
          size: active.length,
          number: 0,
          first: true,
          last: true,
          empty: active.length === 0,
        });
      } else {
        const result = await disruptionsApi.getAll({ page, size: PAGE_SIZE });
        setData(result);
      }
    } catch {
      setError('Failed to load disruption events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDisruptions(); }, [page, activeOnly]);

  const handleFetchNews = async () => {
    setIsFetching(true);
    try {
      const result = await disruptionsApi.fetchLatestNews();
      alert(`Fetch complete. ${result.newEventsAdded} new events added.`);
      await fetchDisruptions();
    } catch {
      alert('Failed to fetch latest news.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Disruption Events</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.totalElements} events found` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin() && (
            <button
              onClick={handleFetchNews}
              disabled={isFetching}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60"
            >
              {isFetching
                ? <Loader2 size={14} className="animate-spin" />
                : <Newspaper size={14} />
              }
              {isFetching ? 'Fetching...' : 'Fetch News'}
            </button>
          )}
          <button
            onClick={fetchDisruptions}
            className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => { setActiveOnly(e.target.checked); setPage(0); }}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Active events only</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500">Critical</span>
          <span className="w-2 h-2 rounded-full bg-orange-400 ml-2" />
          <span className="text-xs text-gray-500">High</span>
          <span className="w-2 h-2 rounded-full bg-yellow-400 ml-2" />
          <span className="text-xs text-gray-500">Medium</span>
          <span className="w-2 h-2 rounded-full bg-green-400 ml-2" />
          <span className="text-xs text-gray-500">Low</span>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchDisruptions} className="text-blue-600 text-sm hover:underline">Retry</button>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">No disruption events found.</p>
        </div>
      ) : (
        <>
          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.content.map((event) => (
              <DisruptionCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Page {data.number + 1} of {data.totalPages}
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
