// ppos-control-plane/ui/src/pages/admin/PoliciesTab.tsx
import React, { useEffect, useState } from "react";
import { getActivePolicies } from "../../lib/adminApi";
import {
    ShieldCheckIcon,
    ExclamationCircleIcon,
    GlobeAltIcon,
    UserGroupIcon,
    QueueListIcon,
    XMarkIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";

export const PoliciesTab: React.FC = () => {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = () => {
        setLoading(true);
        getActivePolicies()
            .then(setPolicies)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Loading Active Policies...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Policy Load Error: {error}</div>;

    const getScopeIcon = (type: string) => {
        switch (type) {
            case 'global': return <GlobeAltIcon className="w-5 h-5" />;
            case 'tenant': return <UserGroupIcon className="w-5 h-5" />;
            case 'queue': return <QueueListIcon className="w-5 h-5" />;
            default: return <ShieldCheckIcon className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 mb-6 px-2">
                <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Active Governance Policies</h2>
                </div>
                <button 
                    onClick={loadPolicies}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                    Refresh Policies
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {policies.map((policy) => (
                    <div key={policy.id} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm group hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-xl ${policy.action === 'deny' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                {getScopeIcon(policy.scope_type)}
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{policy.policy_type.replace(/_/g, ' ')}</span>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${policy.action === 'deny' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {policy.action}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Scope:</span>
                                    <span className="text-[10px] font-mono font-bold text-slate-600">{policy.scope_type}{policy.scope_id ? ` [${policy.scope_id}]` : ''}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 px-10">
                            <p className="text-xs text-slate-500 italic max-w-md truncate" title={policy.reason}>
                                "{policy.reason}"
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enforced by {policy.created_by}</span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(policy.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Deactivate Policy">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {policies.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <CheckCircleIcon className="w-12 h-12 text-emerald-100 mx-auto mb-4" />
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-sm">No Active Restrictions</h3>
                        <p className="text-slate-300 text-[10px] mt-2 font-medium uppercase tracking-tighter">The platform is currently operating in free-flow mode.</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <ExclamationCircleIcon className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10">
                   <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-2">Emergency Broadcast</h3>
                   <p className="text-slate-400 text-xs font-medium max-w-md mx-auto mb-6">
                       Need to apply a system-wide restriction immediately? Global HALT and Tenant Lock tools are available in the Control section.
                   </p>
                   <div className="flex items-center justify-center gap-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Polices applied in &lt; 10s across cluster</span>
                   </div>
                </div>
            </div>
        </div>
    );
};
