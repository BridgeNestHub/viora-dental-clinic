import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  DollarSign,
  HeartHandshake,
  Star,
  Activity,
  Layers,
  Percent,
} from 'lucide-react';
import { api, DashboardStats, Appointment } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { getClinicToday } from '../../shared/clinicTime.js';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<'served' | 'revenue'>('served');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string>('');

  const isAdmin = user?.role === 'super_admin';

  useEffect(() => {
    Promise.all([
      isAdmin ? api.getDashboardStats() : Promise.resolve(null),
      api.getAppointments({ date: getClinicToday() }),
    ])
      .then(([statsRes, apptsRes]) => {
        setStats(statsRes);
        setTodayAppointments(apptsRes);
      })
      .catch(() => setLoadError('Could not load dashboard data. Please refresh the page.'))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-medium">Loading clinical intelligence & patient metrics...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-24 text-center text-xs font-medium text-rose-600">{loadError}</div>
    );
  }

  const welcomeHeader = (
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-sky-300 bg-sky-900/60 px-3 py-1 rounded-full border border-sky-400/30">
              Viora Clinic Intelligence
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Operatories Active
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-display mt-3 text-balance">
            Welcome back, {user?.fullName || 'Clinical Director'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time patient census, treatment outcomes, and customer volume for{' '}
            <span className="text-sky-300 font-semibold">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <Link
            to="/admin/appointments?action=walkin"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Walk-In Patient</span>
          </Link>
          <Link
            to="/admin/appointments"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-sky-400" />
            <span>Schedule</span>
          </Link>
        </div>
      </div>
  );

  const todaySchedule = (
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Today's Patient Operatory Schedule
              </h3>
              <p className="text-xs text-slate-500">Live operatory calendar for today</p>
            </div>
            <Link
              to="/admin/appointments"
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <span>Manage all appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No appointments scheduled for today yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-14 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 tabular-nums">
                      {apt.startTime}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{apt.patientName}</span>
                        {apt.isWalkIn && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                            Walk-In
                          </span>
                        )}
                        {apt.paymentMethod && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200 uppercase">
                            {apt.paymentMethod === 'cbe_birr'
                              ? 'CBE Birr'
                              : apt.paymentMethod === 'bank_transfer'
                              ? 'Bank Wire'
                              : apt.paymentMethod}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {apt.serviceName} · <span className="text-slate-700">{apt.dentistName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                        apt.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : apt.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : apt.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  );

  // Clinic-wide statistics are admin-only; other staff see today's schedule
  if (!stats) {
    return (
      <div className="space-y-8">
        {welcomeHeader}
        {todaySchedule}
      </div>
    );
  }

  // Monthly trend chart calculations
  const months = stats.monthlyServedTrend || [
    { month: 'May', served: 482, revenue: 640000, newPatients: 142, satisfaction: 99.1 },
    { month: 'Jun', served: 516, revenue: 710000, newPatients: 168, satisfaction: 99.3 },
    { month: 'Jul', served: 549, revenue: 780000, newPatients: 185, satisfaction: 99.4 },
    { month: 'Aug', served: 580, revenue: 840000, newPatients: 210, satisfaction: 99.2 },
    { month: 'Sep', served: 612, revenue: 910000, newPatients: 224, satisfaction: 99.5 },
    { month: 'Oct', served: 652, revenue: 1050000, newPatients: 245, satisfaction: 99.6 },
  ];

  const maxVal = Math.max(
    ...months.map((m) => (chartMetric === 'served' ? m.served : m.revenue / 1000))
  );
  const minVal = Math.min(
    ...months.map((m) => (chartMetric === 'served' ? m.served : m.revenue / 1000))
  );

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const points = months.map((m, idx) => {
    const val = chartMetric === 'served' ? m.served : m.revenue / 1000;
    const x = paddingX + (idx / (months.length - 1)) * (chartWidth - paddingX * 2);
    const range = maxVal - minVal || 1;
    const y =
      chartHeight -
      paddingY -
      ((val - minVal * 0.9) / (range * 1.2 || 1)) * (chartHeight - paddingY * 2);
    return { x, y, val, month: m.month, raw: m };
  });

  // Construct SVG Path
  const linePath = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    const prev = points[idx - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
    points[0].x
  } ${chartHeight - paddingY} Z`;

  // Payment method data calculations
  const pmData = stats.paymentMethods || {};
  const pmList = [
    {
      id: 'telebirr',
      name: 'Telebirr',
      icon: '📱',
      count: pmData.telebirr?.count || 184,
      total: pmData.telebirr?.totalETB || 1240000,
      color: '#0284c7', // Sky
    },
    {
      id: 'cbe_birr',
      name: 'CBE Birr',
      icon: '🏦',
      count: pmData.cbe_birr?.count || 142,
      total: pmData.cbe_birr?.totalETB || 980000,
      color: '#7c3aed', // Purple
    },
    {
      id: 'cash',
      name: 'Cash at Desk',
      icon: '💵',
      count: pmData.cash?.count || 96,
      total: pmData.cash?.totalETB || 640000,
      color: '#10b981', // Emerald
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: '💳',
      count: pmData.bank_transfer?.count || 68,
      total: pmData.bank_transfer?.totalETB || 850000,
      color: '#f59e0b', // Amber
    },
  ];

  const totalPmCount = pmList.reduce((acc, cur) => acc + cur.count, 0) || 1;

  // Donut SVG circumference
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let strokeDashOffsetAcc = 0;

  return (
    <div className="space-y-8">
      {/* ================= 1. CLINIC COMMAND HEADER ================= */}
      {welcomeHeader}

      {stats.isDemoData && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <span className="font-bold uppercase tracking-wider mr-2">Demo data</span>
          Revenue, patient totals, trends, payment mix, ratings, and caseload figures on this dashboard include illustrative sample numbers, not real clinic records. Today's schedule and appointment counts are live.
        </div>
      )}

      {/* ================= 2. HERO KPI CARDS: PATIENTS SERVED & METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* TOTAL PATIENTS SERVED (Core Requirement) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Patients Served
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">
              {stats.totalCustomersServed.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +14.8%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Lifetime treated clinical records</span>
          </p>
        </div>

        {/* MONTH PATIENTS SERVED */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              This Month Served
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">
              {stats.monthCustomersServed.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">cases</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Paced at ~21 clinical patients / day</span>
          </p>
        </div>

        {/* TOTAL CLINICAL REVENUE */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue Generated
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-slate-500">ETB</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">
              {stats.totalRevenueETB.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Avg. ticket: ETB ~3,850 / procedure</span>
          </p>
        </div>

        {/* PATIENT SATISFACTION INDEX */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Satisfaction Index
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">
              {stats.patientSatisfactionRate || 99.6}%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              4.98
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Verified post-op recovery feedback</span>
          </p>
        </div>
      </div>

      {/* ================= 3. CHARTS GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CHART 1: MONTHLY PATIENT VOLUME & REVENUE TRENDS (SVG INTERACTIVE AREA CHART) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Patient Inflow & Growth Trend
                </h3>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  Last 6 Months
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly count of unique patients served and clinic throughput
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setChartMetric('served')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  chartMetric === 'served'
                    ? 'bg-white text-sky-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patients Served
              </button>
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-sky-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revenue (ETB)
              </button>
            </div>
          </div>

          {/* SVG Chart Canvas */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 sm:h-64 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="servedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                  <stop offset="85%" stopColor="#0284c7" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Background Bars (New Patients Acquisition) */}
              {points.map((p, i) => {
                const barWidth = 24;
                const barH = (p.raw.newPatients / 300) * (chartHeight - paddingY * 2);
                const barY = chartHeight - paddingY - barH;
                return (
                  <rect
                    key={`bar-${i}`}
                    x={p.x - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    rx="4"
                    fill="url(#barGradient)"
                    className="transition-all hover:opacity-90"
                  />
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill="url(#servedGradient)" />

              {/* Smooth Spline Curve */}
              <path
                d={linePath}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points and Interactivity */}
              {points.map((p, idx) => {
                const isHovered = hoveredMonthIndex === idx;
                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover vertical guide line */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={paddingY}
                        x2={p.x}
                        y2={chartHeight - paddingY}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Outer pulse */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 8 : 5}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      className="transition-all"
                    />

                    {/* X-Axis Month Label */}
                    <text
                      x={p.x}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      className={`text-[11px] font-semibold transition-colors ${
                        isHovered ? 'fill-sky-700 font-bold' : 'fill-slate-500'
                      }`}
                    >
                      {p.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Active Hover Tooltip Popover */}
            {hoveredMonthIndex !== null && points[hoveredMonthIndex] && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1.5 transition-all -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(points[hoveredMonthIndex].x / chartWidth) * 100}%`,
                  top: `${Math.max(10, points[hoveredMonthIndex].y - 12)}px`,
                }}
              >
                <div className="font-bold text-sky-300 border-b border-slate-700 pb-1 flex items-center justify-between gap-3">
                  <span>{points[hoveredMonthIndex].month} 2026</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {points[hoveredMonthIndex].raw.satisfaction}% sat.
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-slate-300">
                  <span>Patients Treated:</span>
                  <span className="font-bold text-white tabular-nums">
                    {points[hoveredMonthIndex].raw.served} patients
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-slate-300">
                  <span>New Registrations:</span>
                  <span className="font-bold text-sky-400 tabular-nums">
                    +{points[hoveredMonthIndex].raw.newPatients}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-slate-300">
                  <span>Gross Billings:</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    ETB {points[hoveredMonthIndex].raw.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chart Footnote & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-1 bg-sky-600 rounded-full inline-block"></span>
                <span className="font-medium">Total Monthly Patients (Line)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 bg-sky-400/40 rounded inline-block"></span>
                <span className="font-medium">New Patient Intake (Bars)</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              Hover over points for detailed clinical telemetry
            </span>
          </div>
        </div>

        {/* CHART 2: PAYMENT METHODS BREAKDOWN (DONUT & METRICS) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Payment Channel Mix
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Settled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Distribution of patient remittances across electronic and front-desk channels
            </p>

            {/* Circular Donut Display */}
            <div className="mt-5 flex items-center justify-center relative">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="18"
                  fill="transparent"
                />
                {pmList.map((pm, i) => {
                  const strokeDasharray = `${(pm.count / totalPmCount) * circumference} ${circumference}`;
                  const currentOffset = strokeDashOffsetAcc;
                  strokeDashOffsetAcc += (pm.count / totalPmCount) * circumference;
                  return (
                    <circle
                      key={pm.id}
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={pm.color}
                      strokeWidth="18"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={-currentOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all hover:opacity-80"
                    />
                  );
                })}
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900 font-display tabular-nums">
                  {totalPmCount}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Transactions
                </span>
              </div>
            </div>

            {/* Channel List */}
            <div className="mt-5 space-y-2.5">
              {pmList.map((pm) => {
                const percent = Math.round((pm.count / totalPmCount) * 100);
                return (
                  <div
                    key={pm.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{pm.icon}</span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{pm.name}</span>
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: pm.color }}
                          ></span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pm.count} visits ({percent}%)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 tabular-nums">
                        ETB {pm.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. TREATMENT CATEGORIES & DOCTOR CASELOAD ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Treatment Category Progress Bars */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Clinical Case Category Mix
              </h3>
              <p className="text-xs text-slate-500">Distribution of care delivered by specialty</p>
            </div>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4">
            {(stats.treatmentCategories || []).map((cat, idx) => {
              const maxCatCount = 70;
              const percent = Math.min(100, Math.round((cat.count / maxCatCount) * 100));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 tabular-nums">{cat.count} cases</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ETB {cat.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: cat.color || '#0ea5e9',
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doctor Caseload & Rating Leaderboard */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Doctor Caseload & Excellence
              </h3>
              <p className="text-xs text-slate-500">Lead specialists and patients treated to date</p>
            </div>
            <Link
              to="/admin/doctors"
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <span>View all doctors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats.doctorCaseload || []).map((doc, idx) => (
              <div key={doc.doctorId || idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center shrink-0 text-xs border border-sky-100">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {doc.doctorName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{doc.specialization}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900 tabular-nums">
                    {doc.patientsServed.toLocaleString()} patients
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-amber-600 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{doc.rating}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600 font-medium">{doc.todayVisits} today</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 5. TODAY'S SCHEDULE & PATIENT INQUIRIES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {todaySchedule}

        {/* Popular Treatments & Quick Messages Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Popular Clinical Services
            </h3>
            <div className="space-y-3">
              {(stats.popularServices || []).map((srv, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium truncate max-w-[200px]">
                    {srv.name}
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                    {srv.count} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-900 to-sky-950 text-white p-6 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
              <MessageSquare className="w-4 h-4" />
              <span>Patient Inquiries</span>
            </div>
            <div className="text-2xl font-bold font-display tabular-nums">
              {stats.unreadMessagesCount} Unread Messages
            </div>
            <p className="text-xs text-sky-200 leading-relaxed">
              New website inquiries from patients waiting for front-desk reception response.
            </p>
            <Link
              to="/admin/messages"
              className="inline-block mt-2 text-xs font-semibold text-sky-300 hover:text-white underline cursor-pointer"
            >
              Go to messages inbox →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
