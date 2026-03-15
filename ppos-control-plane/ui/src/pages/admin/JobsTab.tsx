// ppos-control-plane/ui/src/pages/admin/JobsTab.tsx
import React, { useEffect, useState } from "react";
import { getRecentJobs } from "../../lib/adminApi";
import {
    QueueListIcon,
    MagnifyingGlassIcon,
    TagIcon,
    AdjustmentsHorizontalIcon,
    BoltIcon,
    ShieldCheckIcon,
    WrenchScrewdriverIcon,
    FingerPrintIcon
} from "@heroicons/react/24/outline";

export const JobsTab: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getRecentJobs()
            .then(setJobs)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Scanning Execution Ledger...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Operational Error: {error}</div>;

    return (
        <div className="space-y-6">
             <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="py-4 px-6">Transaction</th>
                            <th className="py-4 px-6">Tenant</th>
                            <th className="py-4 px-6">Process</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Activity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {jobs.map((j) => (
                            <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6">
                                    <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {j.id.split('-')[0]}
                                    </span>
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-700">{j.tenant_id}</td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-900 capitalize">{j.type.replace('_', ' ')}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={[
                                        "px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase",
                                        j.status === "FAILED" ? "bg-red-100 text-red-700" :
                                            j.status === "SUCCEEDED" ? "bg-emerald-100 text-emerald-700" :
                                                j.status === "RUNNING" ? "bg-sky-100 text-sky-700 animate-pulse" :
                                                    "bg-slate-100 text-slate-600"
                                    ].join(" ")}>{j.status}</span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-900">{new Date(j.updated_at).toLocaleTimeString()}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">{new Date(j.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {jobs.length === 0 && (
                    <div className="py-20 text-center">
                        <QueueListIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Jobs Found</div>
                    </div>
                )}
            </div>
        </div>
    );
};
