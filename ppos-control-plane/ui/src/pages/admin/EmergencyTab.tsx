// ppos-control-plane/ui/src/pages/admin/EmergencyTab.tsx
import React, { useState } from "react";
import { flushQueue, purgeHistory } from "../../lib/adminApi";
import {
    FireIcon,
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    TrashIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";

export const EmergencyTab: React.FC<{ operator: any }> = ({ operator }) => {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
    const [typedConfirm, setTypedConfirm] = useState("");
    const [reason, setReason] = useState("");

    const isSuperAdmin = operator?.role === 'super-admin';

    const handleAction = async (action: string) => {
        if (!isSuperAdmin) return;
        
        setActionLoading(action);
        try {
            if (action === 'FLUSH_PREFLIGHT') {
                await flushQueue('PREFLIGHT_PRIMARY', reason);
            } else if (action === 'PURGE_30D') {
                await purgeHistory(30, reason);
            }
            alert("Action executed successfully. Auditor notified.");
            setConfirmingAction(null);
            setTypedConfirm("");
            setReason("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center">
                <ShieldExclamationIcon className="w-16 h-16 text-slate-200 mb-6" />
                <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Access Restricted</h2>
                <p className="text-slate-300 text-xs mt-4 max-w-sm leading-relaxed">
                    The Emergency Control Surface is reserved for **Super-Admin** identities only. 
                    Your current role is **{operator?.role}**.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 bg-red-50 p-6 rounded-3xl border border-red-100">
                <div className="p-3 bg-red-600 rounded-2xl shadow-lg ring-4 ring-red-100 italic">
                    <FireIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-red-700 tracking-tighter uppercase">High-Blast-Radius Cockpit</h2>
                    <p className="text-red-500/70 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Governance Destructive Actions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Queue Flush Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm group hover:border-red-200 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-red-50 transition-colors">
                            <ArrowPathIcon className="w-6 h-6 text-slate-400 group-hover:text-red-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Irreversible</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Flush Execution Queue</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-8">
                        Deletes every **Pending** and **In-flight** job in the Preflight Primary stream. Use only during major ingestion incidents or corrupted backlog events.
                    </p>
                    <button 
                        onClick={() => setConfirmingAction('FLUSH_PREFLIGHT')}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                    >
                        Initialize Flush
                    </button>
                </div>

                {/* Data Purge Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm group hover:border-red-200 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-red-50 transition-colors">
                            <TrashIcon className="w-6 h-6 text-slate-400 group-hover:text-red-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">History Management</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Purge 30D+ History</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-8">
                        Permanently removes all **Finalized** job records older than 30 days. This action reduces database pressure but destroys the audit trail for that period.
                    </p>
                    <button 
                        onClick={() => setConfirmingAction('PURGE_30D')}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                    >
                        Initialize Purge
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmingAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 ring-1 ring-white/10">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="p-4 bg-red-100 rounded-full mb-6">
                                <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Extreme Hazard Warning</h2>
                            <p className="text-slate-500 text-sm mt-3 font-medium">
                                You are about to execute a **Destructive Action** across the platform. This operation cannot be reversed.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operator Justification (Mandatory)</label>
                                <textarea 
                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none transition-all h-24 italic"
                                    placeholder="Enter reason for this emergency action..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Type <span className="text-red-600 font-black">"{confirmingAction === 'FLUSH_PREFLIGHT' ? 'FLUSH PREFLIGHT PRIMARY' : 'PURGE GLOBAL HISTORY'}"</span> to enable
                                </label>
                                <input 
                                    type="text"
                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-bold font-mono tracking-tight focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="Confirm action phrase..."
                                    value={typedConfirm}
                                    onChange={(e) => setTypedConfirm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button 
                                    disabled={
                                        actionLoading !== null || 
                                        !reason.trim() || 
                                        typedConfirm !== (confirmingAction === 'FLUSH_PREFLIGHT' ? 'FLUSH PREFLIGHT PRIMARY' : 'PURGE GLOBAL HISTORY')
                                    }
                                    onClick={() => handleAction(confirmingAction)}
                                    className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    {actionLoading ? 'Executing Hazard Operation...' : 'Authorize Destruction'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setConfirmingAction(null);
                                        setTypedConfirm("");
                                        setReason("");
                                    }}
                                    className="w-full py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all"
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
