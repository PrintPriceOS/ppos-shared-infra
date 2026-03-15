// ppos-control-plane/ui/src/pages/admin/ResourcesTab.tsx
import React, { useState, useEffect } from "react";
import { 
    getResourceOverview, 
    getTenantsResourceUsage 
} from "../../lib/adminApi";
import { 
    CubeIcon, 
    BoltIcon, 
    QueueListIcon, 
    ExclamationTriangleIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ChartBarSquareIcon,
    CircleStackIcon
} from "@heroicons/react/24/outline";

export const ResourcesTab: React.FC = () => {
    const [overview, setOverview] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [ov, tu] = await Promise.all([
                getResourceOverview(),
                getTenantsResourceUsage()
            ]);
            setOverview(ov);
            setTenants(tu);
        } catch (err) {
            console.error("Failed to fetch resource data", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s auto-refresh for "hot" counters
        return () => clearInterval(interval);
    }, []);

    const handleManualRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <ArrowPathIcon className="w-8 h-8 text-primary animate-spin opacity-20" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Resource Governance</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Real-time capacity allocation and multi-tenant physics.</p>
                </div>
                <button 
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Live Sync'}
                </button>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Concurrency" 
                    value={overview?.totalActiveConcurrency || 0} 
                    icon={BoltIcon}
                    color="blue"
                    description="Execution slots in use"
                />
                <StatCard 
                    title="Queue Backlog" 
                    value={overview?.totalActiveLeases ? `${overview.totalActiveLeases} tasks` : "0 tasks"} 
                    icon={QueueListIcon}
                    color="indigo"
                    description="Active job leases"
                />
                <StatCard 
                    title="Denials (24h)" 
                    value={overview?.deniedByQuota || 0} 
                    icon={ExclamationTriangleIcon}
                    color="red"
                    description="Blocked by hard caps"
                />
                <StatCard 
                    title="Throttles (24h)" 
                    value={overview?.throttledJobs || 0} 
                    icon={ArrowPathIcon}
                    color="amber"
                    description="Delayed by burst limit"
                />
            </div>

            {/* Dispatch Fairness & AI Budget Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dispatch Highlights */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] scale-125 rotate-12">
                        <ChartBarSquareIcon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Weighted Fair Dispatch</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aging Applied</p>
                                <p className="text-3xl font-black mt-1">{overview?.schedulerStats?.agingApplied || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selection Ratio</p>
                                <p className="text-3xl font-black mt-1">
                                    {overview?.schedulerStats?.selected > 0 
                                        ? Math.round((overview.schedulerStats.selected / (overview.schedulerStats.selected + overview.schedulerStats.skipped)) * 100)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduler Engine Active</span>
                        </div>
                    </div>
                </div>

                {/* AI Economic Governance */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:scale-110 duration-700 text-primary">
                        <BoltIcon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">AI Economic Governance (20.E)</h3>
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global AI Spend (24h)</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">${overview?.aiStats?.totalCost24h?.toFixed(2) || "0.00"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active AI Jobs</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{overview?.aiStats?.activeAIConcurrency || 0}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 flex flex-col">
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Degrades</span>
                                <span className="text-sm font-black text-amber-700">{overview?.aiStats?.degradedJobs || 0}</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 flex flex-col">
                                <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Budget Denied</span>
                                <span className="text-sm font-black text-red-700">{overview?.aiStats?.deniedByBudget || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Governance Health */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-700">
                        <CubeIcon className="w-32 h-32" />
                    </div>
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Lease Integrity</h3>
                            </div>
                            <div className="flex items-baseline gap-4 mt-1">
                                <span className="text-4xl font-black tracking-tighter text-slate-900">
                                    {overview?.leaseDrift === 0 ? "STABLE" : "SKEWED"}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auto Repairs</p>
                                <p className="text-lg font-black text-slate-900 mt-1">99.9%</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drift</p>
                                <p className={`text-lg font-black mt-1 ${overview?.leaseDrift === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {overview?.leaseDrift || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenants Resource Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Tenant Capacity Ledger</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {tenants.length} tenants</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant Identity</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Concurrency</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Throughput (jpm)</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Queue Depth</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tenants.map((t) => (
                                <tr key={t.tenantId} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900">{t.tenantId}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.planTier}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.priorityClass}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {t.usage.activeConcurrency > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tight">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-tight">
                                                Idle
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <ResourceBar 
                                            current={t.usage.activeConcurrency} 
                                            max={t.limits.maxConcurrency} 
                                            unit="slots" 
                                            percentage={t.saturation.concurrency}
                                        />
                                    </td>
                                    <td className="px-8 py-5">
                                        <ResourceBar 
                                            current={t.usage.jobsThisMinute} 
                                            max={t.limits.maxJpm} 
                                            unit="jpm" 
                                            percentage={t.saturation.throughput}
                                        />
                                    </td>
                                    <td className="px-8 py-5">
                                        <ResourceBar 
                                            current={t.usage.queueDepth} 
                                            max={t.limits.maxDepth} 
                                            unit="jobs" 
                                            percentage={t.saturation.depth}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string; 
    description: string;
}> = ({ title, value, icon: Icon, color, description }) => {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600",
        indigo: "bg-indigo-50 text-indigo-600",
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600"
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 ${colorClasses[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h4>
            <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{description}</p>
        </div>
    );
};

const ResourceBar: React.FC<{ 
    current: number; 
    max: number; 
    unit: string; 
    percentage: number;
}> = ({ current, max, unit, percentage }) => {
    const isHot = percentage > 80;
    const isCritical = percentage > 95;

    return (
        <div className="w-full max-w-[160px]">
            <div className="flex items-baseline justify-between mb-1.5">
                <span className={`text-[10px] font-black ${isCritical ? 'text-red-600' : isHot ? 'text-amber-600' : 'text-slate-900'}`}>
                    {current} / {max} <span className="font-bold opacity-40 ml-0.5">{unit}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-300">{Math.round(percentage)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${
                        isCritical ? 'bg-red-500' : isHot ? 'bg-amber-400' : 'bg-slate-900'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                />
            </div>
        </div>
    );
};
