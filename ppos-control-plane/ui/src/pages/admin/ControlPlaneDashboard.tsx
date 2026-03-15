// ppos-control-plane/ui/src/pages/admin/ControlPlaneDashboard.tsx
import React, { useState } from "react";
import { OverviewTab } from "./OverviewTab";
import { JobsTab } from "./JobsTab";
import { TenantsTab } from "./TenantsTab";
import { AuditTab } from "./AuditTab";
import { EmergencyTab } from "./EmergencyTab";
import { PoliciesTab } from "./PoliciesTab";
import { ResourcesTab } from "./ResourcesTab";
import { FederationTab } from "./FederationTab";
import { 
    ChartBarIcon, 
    QueueListIcon, 
    UsersIcon, 
    ClipboardDocumentListIcon,
    ArrowLeftOnRectangleIcon,
    ShieldCheckIcon,
    FireIcon,
    ScaleIcon,
    GlobeAltIcon
} from "@heroicons/react/24/outline";

import { logout } from "../../lib/adminApi";

export const ControlPlaneDashboard: React.FC<{ operator: any; onLogout: () => void }> = ({ operator, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'tenants' | 'audit' | 'emergency' | 'policies' | 'resources' | 'federation'>('overview');
    const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");

    const handleLogout = async () => {
        await logout();
        onLogout();
    };

    const tabs = [
        { id: 'overview', name: 'Observability', icon: ChartBarIcon },
        { id: 'jobs', name: 'Execution Ledger', icon: QueueListIcon },
        { id: 'tenants', name: 'Tenant Control', icon: UsersIcon },
        { id: 'resources', name: 'Resource Physics', icon: ScaleIcon },
        { id: 'federation', name: 'Federation Cockpit', icon: GlobeAltIcon },
        { id: 'policies', name: 'Active Policies', icon: ShieldCheckIcon },
        { id: 'audit', name: 'Audit Trail', icon: ClipboardDocumentListIcon },
        ...(operator?.role === 'super-admin' ? [{ id: 'emergency', name: 'Emergency', icon: FireIcon }] : []),
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Nav Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-lg">
                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tight leading-none">PPOS Control Plane</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Industrial Governance Surface</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end border-r border-slate-100 pr-6">
                            <span className="text-xs font-black text-slate-900 leading-none">{operator.name}</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 opacity-50">{operator.role}</span>
                        </div>
                        
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {(['24h', '7d', '30d'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors group"
                            title="Sign Out"
                        >
                            <ArrowLeftOnRectangleIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto flex gap-8 p-8">
                {/* Sidebar */}
                <aside className="w-64 shrink-0 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                    active 
                                    ? (tab.id === 'emergency' ? "bg-red-600 text-white shadow-lg translate-x-1" : "bg-slate-900 text-white shadow-lg translate-x-1")
                                    : "text-slate-500 hover:bg-white hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100"
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`} />
                                {tab.name}
                            </button>
                        );
                    })}
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {activeTab === 'overview' && <OverviewTab range={range} operator={operator} />}
                    {activeTab === 'jobs' && <JobsTab />}
                    {activeTab === 'tenants' && <TenantsTab operator={operator} />}
                    {activeTab === 'audit' && <AuditTab />}
                    { activeTab === 'emergency' && <EmergencyTab operator={operator} /> }
                    { activeTab === 'policies' && <PoliciesTab /> }
                    { activeTab === 'resources' && <ResourcesTab /> }
                    { activeTab === 'federation' && <FederationTab /> }
                </main>
            </div>
        </div>
    );
};
