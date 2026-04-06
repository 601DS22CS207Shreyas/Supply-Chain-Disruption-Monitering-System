import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  Calendar,
  AlertTriangle,
  Zap,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  Weight,
  DollarSign,
} from 'lucide-react';
import { shipmentsApi } from '../../api/ShipmentsApi';
import type { ShipmentDetailResponse } from '../../types';

// ── Badges ────────────────────────────────────────────────────────────────────
const RiskBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    LOW:      'bg-green-100 text-green-700 border-green-200',
    MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    UNKNOWN:  'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[level] ?? styles.UNKNOWN}`}>
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
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
};

// ── Info row helper ───────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="text-gray-400 mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
    </div>
  </div>
);

// ── Risk meter bar ────────────────────────────────────────────────────────────
const RiskMeter = ({ score }: { score: number }) => {
  const pct = Math.round(score * 100);
  const color = score >= 0.9 ? 'bg-red-500'
    : score >= 0.7 ? 'bg-orange-500'
    : score >= 0.4 ? 'bg-yellow-400'
    : 'bg-green-500';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Delay probability</span>
        <span className="font-semibold text-gray-800">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<ShipmentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShipment = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await shipmentsApi.getShipmentById(Number(id));
      setShipment(data);
    } catch {
      setError('Failed to load shipment details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchShipment(); }, [id]);

  const handlePredict = async () => {
    if (!id) return;
    setIsPredicting(true);
    try {
      await shipmentsApi.predictRisk(Number(id));
      await fetchShipment();
    } catch {
      alert('Prediction failed. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 text-sm">{error ?? 'Shipment not found.'}</p>
        <button onClick={() => navigate('/shipments')} className="text-blue-600 text-sm hover:underline">
          Back to Shipments
        </button>
      </div>
    );
  }

  const prediction = shipment.latestPrediction;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Back + header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/shipments')}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{shipment.trackingNumber}</h2>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {shipment.origin} → {shipment.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchShipment}
            className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handlePredict}
            disabled={isPredicting ||
    shipment.status === 'DELIVERED' ||
    shipment.status === 'CANCELLED'}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isPredicting
              ? <Loader2 size={14} className="animate-spin" />
              : <Zap size={14} />
            }
            {isPredicting ? 'Predicting...' : 'Run Prediction'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column: shipment details ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Shipment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={<MapPin size={15} />}
                label="Origin"
                value={shipment.origin}
              />
              <InfoRow
                icon={<MapPin size={15} />}
                label="Destination"
                value={shipment.destination}
              />
              <InfoRow
                icon={<Truck size={15} />}
                label="Carrier"
                value={shipment.carrier}
              />
              <InfoRow
                icon={<Package size={15} />}
                label="Transport Mode"
                value={shipment.transportMode.replaceAll('_', ' ')}
              />
              <InfoRow
                icon={<Calendar size={15} />}
                label="Scheduled Departure"
                value={new Date(shipment.scheduledDeparture).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              />
              <InfoRow
                icon={<Calendar size={15} />}
                label="Scheduled Arrival"
                value={new Date(shipment.scheduledArrival).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              />
              {shipment.cargoDescription && (
                <InfoRow
                  icon={<Package size={15} />}
                  label="Cargo"
                  value={shipment.cargoDescription}
                />
              )}
              {shipment.cargoWeightKg && (
                <InfoRow
                  icon={<Weight size={15} />}
                  label="Weight"
                  value={`${shipment.cargoWeightKg.toLocaleString()} kg`}
                />
              )}
              {shipment.cargoValueUsd && (
                <InfoRow
                  icon={<DollarSign size={15} />}
                  label="Cargo Value"
                  value={`$${shipment.cargoValueUsd.toLocaleString()}`}
                />
              )}
              {shipment.actualArrival && (
                <InfoRow
                  icon={<CheckCircle size={15} />}
                  label="Actual Arrival"
                  value={new Date(shipment.actualArrival).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                />
              )}
            </div>
          </div>

          {/* Waypoints card */}
          {shipment.waypoints && shipment.waypoints.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Route Waypoints</h3>
              <div className="space-y-3">
                {shipment.waypoints.map((wp, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {wp.waypointOrder}
                      </div>
                      {index < shipment.waypoints.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-800">
                        {wp.city}{wp.country ? `, ${wp.country}` : ''}
                      </p>
                      {wp.estimatedArrival && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          ETA: {new Date(wp.estimatedArrival).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                      {wp.actualArrival && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Arrived: {new Date(wp.actualArrival).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent alerts card */}
          {shipment.recentAlerts && shipment.recentAlerts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {shipment.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-100' :
                      alert.severity === 'HIGH'     ? 'bg-orange-50 border-orange-100' :
                      'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <AlertTriangle
                      size={15}
                      className={
                        alert.severity === 'CRITICAL' ? 'text-red-500 shrink-0 mt-0.5' :
                        alert.severity === 'HIGH'     ? 'text-orange-500 shrink-0 mt-0.5' :
                        'text-gray-400 shrink-0 mt-0.5'
                      }
                    />
                    <div>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: risk prediction ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Risk Prediction</h3>
              {prediction && <RiskBadge level={prediction.riskLevel} />}
            </div>

            {prediction ? (
              <div className="space-y-5">
                {/* Risk meter */}
                <RiskMeter score={prediction.delayProbability} />

                {/* Key stats */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Est. delay</span>
                    <span className="font-medium text-gray-800">
                      {prediction.estimatedDelayHours
                        ? `${prediction.estimatedDelayHours.toFixed(0)} hours`
                        : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Primary cause</span>
                    <span className="font-medium text-gray-800 text-right max-w-[160px]">
                      {prediction.primaryCause ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model version</span>
                    <span className="text-gray-400 text-xs">{prediction.modelVersion}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Predicted at</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(prediction.predictedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* LLM explanation */}
                {prediction.llmExplanation && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-1.5">AI Explanation</p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {prediction.llmExplanation}
                    </p>
                  </div>
                )}
              </div>
            ) : shipment.status === 'DELIVERED' ? (
  <div className="flex flex-col items-center justify-center py-8 gap-3">
    <CheckCircle size={32} className="text-green-400" />
    <p className="text-sm text-gray-400 text-center">
      Shipment delivered successfully. No risk prediction needed.
    </p>
  </div>
) : (
  <div className="flex flex-col items-center justify-center py-8 gap-3">
    <Clock size={32} className="text-gray-300" />
    <p className="text-sm text-gray-400 text-center">
      No prediction yet. Click "Run Prediction" to analyse this shipment.
    </p>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}
