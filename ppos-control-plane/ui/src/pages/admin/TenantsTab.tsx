// ppos-control-plane/ui/src/pages/admin/TenantsTab.tsx
import React, { useEffect, useState } from "react";
import { getTenantsSummary, getActivePolicies, quarantineTenant, pardonTenant } from "../../lib/adminApi";
import {
    UsersIcon,
    GlobeAltIcon,
    CircleStackIcon,
    ClockIcon,
    ShieldExclamationIcon,
    CheckCircleIcon,
    NoSymbolIcon
} from "@heroicons/react/24/outline";

export const TenantsTab: React.FC<{ operator: any }> = ({ operator }) => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = () => {
        setLoading(true);
        Promise.all([getTenantsSummary(), getActivePolicies()])
            .then(([t, p]) => {
                setTenants(t);
                setPolicies(p);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleQuarantine = async (tenantId: string) => {
        const reason = window.prompt(`Enter reason for quarantining tenant ${tenantId}:`);
        if (!reason) return;

        setActionLoading(tenantId);
        try {
            await quarantineTenant(tenantId, reason);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handlePardon = async (tenantId: string) => {
        if (!window.confirm(`Are you sure you want to restore tenant ${tenantId}?`)) return;

        setActionLoading(tenantId);
        try {
            await pardonTenant(tenantId, "Restored by operator");
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const isQuarantined = (tenantId: string) => {
        return policies.some(p => p.entity_type === 'tenant' && p.entity_id === tenantId && p.policy_type === 'QUARANTINE' && p.is_active);
    };

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Aggregating Tenant Signatures...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Operational Error: {error}</div>;

    const canModify = operator?.role === 'admin' || operator?.role === 'super-admin';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 px-2">
                <UsersIcon className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Active Ingestion Sources</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="py-4 px-6 flex items-center gap-2">
                                <GlobeAltIcon className="w-3.5 h-3.5" />
                                Tenant ID
                            </th>
                            <th className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <CircleStackIcon className="w-3.5 h-3.5" />
                                    Aggregate Load
                                </div>
                            </th>
                            <th className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <ShieldExclamationIcon className="w-3.5 h-3.5" />
                                    Security Status
                                </div>
                            </th>
                            <th className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    Last Activity
                                </div>
                            </th>
                            {canModify && <th className="py-4 px-6 text-right">Governance Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tenants.map((r) => {
                            const quarantined = isQuarantined(r.tenant_id);
                            return (
                                <tr key={r.tenant_id} className={`hover:bg-slate-50 transition-colors ${quarantined ? 'bg-red-50/30' : ''}`}>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 font-mono tracking-tight">{r.tenant_id}</span>
                                            {quarantined && (
                                                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">Tenant Quarantined</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <span className="font-semibold">{r.total_jobs}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Jobs</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        {quarantined ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <NoSymbolIcon className="w-3 h-3" />
                                                Quarantined
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircleIcon className="w-3 h-3" />
                                                Active
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-slate-500 text-xs font-medium">
                                            {new Date(r.last_activity).toLocaleString()}
                                        </div>
                                    </td>
                                    {canModify && (
                                        <td className="py-4 px-6 text-right">
                                            {quarantined ? (
                                                <button 
                                                    disabled={actionLoading === r.tenant_id}
                                                    onClick={() => handlePardon(r.tenant_id)}
                                                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                                                >
                                                    Restore Tenant
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled={actionLoading === r.tenant_id}
                                                    onClick={() => handleQuarantine(r.tenant_id)}
                                                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                                                >
                                                    Quarantine
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {tenants.length === 0 && (
                    <div className="py-20 text-center text-slate-400">No active tenants detected in history.</div>
                )}
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center px-10 leading-loose">
                Governance Actions are permanent and individually attributed to your operator identity.<br/>Quarantining a tenant will block all subsequent ingestion and worker execution for that ID.
            </p>
        </div>
    );
};
