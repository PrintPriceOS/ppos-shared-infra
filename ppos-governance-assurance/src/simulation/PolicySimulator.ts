// ppos-governance-assurance/src/simulation/PolicySimulator.ts

export interface HistoricalJob {
    jobId: string;
    value: number;
    destCountry: string;
}

export interface NodeCandidate {
    nodeId: string;
    manufacturingCost: number;
    reputationScore: number;
    tier: string;
    countryCode: string;
}

export interface RoutingDecision {
    nodeId: string;
    totalExpectedCost: number;
    breakdown: { mfg: number; ship: number; risk: number; sla: number };
}

export class PolicySimulator {
    private readonly weights = {
        premier_risk: 0.005,
        certified_risk: 0.02,
        sandbox_risk: 0.08,
        operational_overhead: 250 
    };

    public runBaseline(job: HistoricalJob, candidates: NodeCandidate[]): RoutingDecision {
        const results = candidates.map(node => {
            const priceScore = node.manufacturingCost / 1000;
            const reputationScore = (100 - node.reputationScore) / 100;
            const score = (priceScore * 0.5) + (reputationScore * 0.5);

            return { nodeId: node.nodeId, score, mfg: node.manufacturingCost };
        });

        const best = results.sort((a, b) => a.score - b.score)[0];
        return {
            nodeId: best.nodeId,
            totalExpectedCost: best.mfg,
            breakdown: { mfg: best.mfg, ship: 0, risk: 0, sla: 0 }
        };
    }

    public runEconomicsAudit(job: HistoricalJob, candidates: NodeCandidate[]): RoutingDecision {
        const results = candidates.map(node => {
            const mfg = node.manufacturingCost;
            const ship = this.calculateShippingCost(job, node);
            const riskFactor = node.tier === 'PREMIER' ? this.weights.premier_risk :
                node.tier === 'CERTIFIED' ? this.weights.certified_risk :
                    this.weights.sandbox_risk;
            const risk = job.value * riskFactor;
            const breachProbability = (100 - node.reputationScore) / 100;
            const sla = breachProbability * (job.value + this.weights.operational_overhead);

            const total = mfg + ship + risk + sla;

            return {
                nodeId: node.nodeId,
                totalExpectedCost: total,
                breakdown: { mfg, ship, risk, sla }
            };
        });

        return results.sort((a, b) => a.totalExpectedCost - b.totalExpectedCost)[0];
    }

    private calculateShippingCost(job: HistoricalJob, node: NodeCandidate): number {
        if (job.destCountry !== node.countryCode) return 50.0;
        return 5.0;
    }
}
