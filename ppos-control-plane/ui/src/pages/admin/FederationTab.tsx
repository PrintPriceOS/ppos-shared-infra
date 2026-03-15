// ppos-control-plane/ui/src/pages/admin/FederationTab.tsx
import React, { useEffect, useState } from "react";
import { 
    getFederationOverview, 
    getFederationPrinters, 
    getFederationStuckJobs,
    forceRedispatch
} from "../../lib/adminApi";
import { 
    ServerIcon, 
    GlobeAltIcon, 
    ExclamationTriangleIcon, 
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";

export const FederationTab: React.FC = () => {
    const [overview, setOverview] = useState<any>(null);
    const [printers, setPrinters] = useState<any[]>([]);
    const [stuckJobs, setStuckJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ov, pr, st] = await Promise.all([
                getFederationOverview(),
                getFederationPrinters(),
                getFederationStuckJobs()
            ]);
            setOverview(ov);
            setPrinters(pr);
            setStuckJobs(st);
        } catch (err) {
            console.error("Failed to fetch federation data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRedispatch = async (jobId: string) => {
        if (!confirm("Are you sure you want to force a redispatch for this job?")) return;
        try {
            await forceRedispatch(jobId);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading && !overview) {
        return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading Federation Pulse...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <GlobeAltIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Network Nodes</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{printers.length}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2">ACTIVE FEDERATED PRINTERS</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600">
                            <ServerIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Available Health</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {overview?.printers?.find((p: any) => p.availability_state === 'available')?.count || 0}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500 mt-2 uppercase">STABLE NODES ONLINE</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Incidents 24h</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{overview?.incidents?.critical_sla_24h || 0}</div>
                    <div className="text-[10px] font-bold text-amber-500 mt-2 uppercase tracking-widest leading-none">CRITICAL SLA BREACHES</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                            <ArrowPathIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Redispatches</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{overview?.incidents?.redispatches_24h || 0}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-none">AUTO-RECOVERS COMPLETED</div>
                </div>
            </div>

            {/* Stuck Jobs Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Stuck Job Monitor</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">High dwell time & SLA risks</p>
                    </div>
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {stuckJobs.length} AT-RISK WORKLOADS
                    </div>
                </div>
                
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-8 py-4">Job / Dispatch</th>
                            <th className="px-8 py-4">Current State</th>
                            <th className="px-8 py-4">Dwell Time</th>
                            <th className="px-8 py-4">Attempts</th>
                            <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {stuckJobs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-sm font-bold text-slate-400">
                                    Network clear. No stuck jobs detected.
                                </td>
                            </tr>
                        ) : (
                            stuckJobs.map(job => (
                                <tr key={job.dispatch_id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900">{job.job_id.substring(0, 12)}...</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">DISPATCH: {job.dispatch_id.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            job.current_state === 'PRINTING' ? 'bg-blue-100 text-blue-700' :
                                            job.current_state === 'FAILED' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {job.current_state}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${job.dwell_minutes > 120 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                            <span className="text-sm font-black text-slate-900">{job.dwell_minutes}m</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-slate-400">
                                        {job.attempt_number} / 3
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => handleRedispatch(job.job_id)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors shadow-sm"
                                        >
                                            Force Redispatch
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Printer Registry Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight text-white">Federated Printer Registry</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live status & capabilities</p>
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search printers..."
                            className="bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-2 text-sm font-bold w-64 focus:ring-2 focus:ring-slate-900 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-8 py-4">Printer Node</th>
                            <th className="px-8 py-4">Health</th>
                            <th className="px-8 py-4">Acceptance</th>
                            <th className="px-8 py-4">Failure %</th>
                            <th className="px-8 py-4">Queue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {printers.filter(p => !searchTerm || p.display_name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                                            p.availability_state === 'available' ? 'bg-emerald-50 text-emerald-600' :
                                            p.availability_state === 'degraded' ? 'bg-amber-50 text-amber-600' :
                                            'bg-slate-50 text-slate-400'
                                        }`}>
                                            {p.id.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900">{p.display_name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.printer_code} • {p.country_code}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            p.availability_state === 'available' ? 'bg-emerald-500' :
                                            p.availability_state === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                            'bg-slate-300'
                                        }`} />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-900">{p.availability_state}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1 w-24">
                                        <div className="flex justify-between text-[10px] font-black italic">
                                            <span>{p.acceptance_rate_24h}%</span>
                                        </div>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-slate-900 rounded-full" 
                                                style={{ width: `${p.acceptance_rate_24h}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-sm font-black ${p.failure_rate_24h > 10 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {p.failure_rate_24h}%
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center justify-between group-hover:px-2 transition-all">
                                        <span className="text-sm font-black text-slate-900">{p.queue_depth} jobs</span>
                                        <ChevronRightIcon className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
