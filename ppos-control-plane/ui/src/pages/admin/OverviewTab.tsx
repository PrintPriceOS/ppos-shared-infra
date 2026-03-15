// ppos-control-plane/ui/src/pages/admin/OverviewTab.tsx
import React, { useEffect, useState } from "react";
import { getOverview, getActivePolicies, setQueueState, getGovernanceMetrics } from "../../lib/adminApi";
import {
    Square3Stack3DIcon,
    CheckBadgeIcon,
    BoltIcon,
    ArrowTrendingUpIcon,
    BanknotesIcon,
    ScaleIcon,
    QueueListIcon,
    ClockIcon,
    PauseIcon,
    PlayIcon,
    GlobeAltIcon,
    ShieldCheckIcon
} from "@heroicons/react/24/outline";

type Range = "24h" | "7d" | "30d";

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-600/10", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-600/10", text: "text-emerald-600" },
    amber: { bg: "bg-amber-600/10", text: "text-amber-600" },
    indigo: { bg: "bg-indigo-600/10", text: "text-indigo-600" },
    violet: { bg: "bg-violet-600/10", text: "text-violet-600" },
    pink: { bg: "bg-pink-600/10", text: "text-pink-600" },
    orange: { bg: "bg-orange-600/10", text: "text-orange-600" },
    cyan: { bg: "bg-cyan-600/10", text: "text-cyan-600" },
};

const KpiCard = ({ title, value, sub, Icon, color }: { title: string; value: string; sub?: string; Icon: any; color: keyof typeof COLOR_MAP }) => {
    const theme = COLOR_MAP[color];
    return (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className={`p-2.5 rounded-lg ${theme.bg}`}>
                <Icon className={`w-5 h-5 ${theme.text}`} />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">{title}</div>
                <div className="flex items-baseline gap-2">
                    <div className="text-xl font-black text-slate-900 tracking-tight">{value}</div>
                    {sub && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub}</span>}
                </div>
            </div>
        </div>
    );
};

export const OverviewTab: React.FC<{ range: Range; operator: any }> = ({ range, operator }) => {
    const [stats, setStats] = useState<any>(null);
    const [govStats, setGovStats] = useState<any>(null);
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = () => {
        setLoading(true);
        Promise.all([getOverview(range), getActivePolicies(), getGovernanceMetrics(range)])
            .then(([s, p, g]) => {
                setStats(s);
                setPolicies(p);
                setGovStats(g);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [range]);

    const handleQueueAction = async (queue: string, state: 'PAUSED' | 'RUNNING') => {
        const reason = window.prompt(`Reason for setting ${queue} to ${state}:`);
        if (!reason) return;

        setActionLoading(true);
        try {
            await setQueueState(queue, state, reason);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const isQueuePaused = (queue: string) => {
        return policies.some(p => p.entity_type === 'queue' && p.entity_id === queue && p.policy_type === 'PAUSE' && p.is_active);
    };

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Live Metrics...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Operational Error: {error}</div>;
    if (!stats) return null;

    const preflightPaused = isQueuePaused('PREFLIGHT_PRIMARY');
    const canGovern = operator?.role === 'admin' || operator?.role === 'super-admin' || operator?.role === 'operator';

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard Icon={Square3Stack3DIcon} color="blue" title="Platform Volume" value={String(stats.totalJobs)} sub="Total Jobs" />
                <KpiCard Icon={CheckBadgeIcon} color="emerald" title="SLA Compliance" value={`${stats.successRate.toFixed(1)}%`} />
                <KpiCard Icon={BanknotesIcon} color="emerald" title="AutoFix Value" value={`$${Math.round(stats.totalValueGenerated).toLocaleString()}`} />
                <KpiCard Icon={ClockIcon} color="blue" title="Efficiency Gain" value={`${stats.totalHoursSaved.toFixed(1)} h`} />
                <KpiCard Icon={ArrowTrendingUpIcon} color="indigo" title="Improvement Delta" value={`${stats.deltaImprovementRate.toFixed(1)}%`} />
                <KpiCard Icon={ScaleIcon} color="violet" title="Risk Reduction" value={`${(stats.avgRiskBefore - stats.avgRiskAfter).toFixed(1)} pts`} />
                <KpiCard Icon={BoltIcon} color="amber" title="Mean Latency" value={`${stats.avgLatencyMs} ms`} />
                <KpiCard Icon={QueueListIcon} color="orange" title="Live Backlog" value={String(stats.queueBacklog || 0)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <ShieldCheckIcon className="w-5 h-5 text-slate-400" />
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Queue Governance Controller</h2>
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${preflightPaused ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                        <QueueListIcon className={`w-6 h-6 ${preflightPaused ? 'text-red-600' : 'text-emerald-600'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-900">PREFLIGHT_PRIMARY</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Primary Execution Stream</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${preflightPaused ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {preflightPaused ? 'Halted' : 'Ingestion Active'}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">Status</span>
                                    </div>

                                    {canGovern && (
                                        preflightPaused ? (
                                            <button 
                                                disabled={actionLoading}
                                                onClick={() => handleQueueAction('PREFLIGHT_PRIMARY', 'RUNNING')}
                                                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                            >
                                                <PlayIcon className="w-3.5 h-3.5" />
                                                Resume Queue
                                            </button>
                                        ) : (
                                            <button 
                                                disabled={actionLoading}
                                                onClick={() => handleQueueAction('PREFLIGHT_PRIMARY', 'PAUSED')}
                                                className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                            >
                                                <PauseIcon className="w-3.5 h-3.5" />
                                                Emergency Halt
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Governance Metrics */}
                    {govStats && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <ScaleIcon className="w-5 h-5 text-slate-400" />
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Platform Governance & Risk</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Enforcement Hits</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xl font-black text-slate-900">{govStats.blockedJobs}</div>
                                        <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Jobs Blocked</div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Restrictions</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xl font-black text-slate-900">{govStats.activePolicies}</div>
                                        <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Across {govStats.restrictedTenants} Tenants</div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prevented ROI Loss</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xl font-black text-emerald-600">${govStats.estimatedPreventedCost?.toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Est. Savings</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Health */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <GlobeAltIcon className="w-5 h-5 text-slate-400" />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">System Health Signals</h2>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database Persistence</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Worker Registry</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auth Bridge</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Governance Gate 19.C</div>
                        </div>
                    </div>

                    {/* Resource Physics Summary */}
                    {govStats && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resource Physics</div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-600">Active Concurrency</span>
                                    <span className="text-sm font-black text-slate-900">{govStats.activeConcurrencySlots || 0} slots</span>
                                </div>
                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-slate-900 transition-all" 
                                        style={{ width: `${Math.min(100, (govStats.activeConcurrencySlots || 0) * 10)}%` }} 
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-[10px] font-bold text-slate-600">Throttled (24h)</span>
                                    <span className="text-[10px] font-black text-amber-600">{govStats.throttledJobs || 0} events</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-600">Denied by Quota</span>
                                    <span className="text-[10px] font-black text-red-600">{govStats.deniedByQuota || 0} events</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
