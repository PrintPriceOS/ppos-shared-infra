// ppos-control-plane/ui/src/pages/admin/AuditTab.tsx
import React, { useEffect, useState } from "react";
import { getAuditLogs } from "../../lib/adminApi";
import {
    ClipboardDocumentListIcon,
    CalendarIcon,
    UserCircleIcon,
    TagIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";

export const AuditTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getAuditLogs()
            .then(setLogs)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Retrieving Governance Ledger...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Traceability Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 px-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Governance Audit Trail</h2>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="py-5 px-6">Timestamp</th>
                                <th className="py-5 px-6">Operator</th>
                                <th className="py-5 px-6">Action</th>
                                <th className="py-5 px-6">Target</th>
                                <th className="py-5 px-6">Reason / Context</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                                            <CalendarIcon className="w-3.5 h-3.5 opacity-50" />
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <UserCircleIcon className="w-4 h-4 text-slate-900" />
                                                <span className="font-black text-slate-900">{log.operator_id}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-6">{log.operator_role}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            <TagIcon className="w-3 h-3" />
                                            {log.action_type.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.target_type}</span>
                                            <span className="font-mono text-slate-900 font-bold">{log.target_id}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 max-w-xs">
                                        <div className="flex items-start gap-3">
                                            <InformationCircleIcon className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                            <p className="text-slate-600 text-[11px] font-medium leading-relaxed italic">
                                                "{log.reason}"
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="text-slate-300 mb-4 flex justify-center">
                            <ClipboardDocumentListIcon className="w-12 h-12 opacity-20" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">The Governance Ledger is empty.</p>
                        <p className="text-slate-300 text-[10px] mt-2 font-medium">All future administrative actions will appear here for audit.</p>
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-center gap-2 p-6">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Immutable Chain of Custody Active</span>
            </div>
        </div>
    );
};
