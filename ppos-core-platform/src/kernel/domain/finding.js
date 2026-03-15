/**
 * @project PrintPrice Pro - Platform Kernel
 */

/**
 * Finding Canonical Object (V10)
 * Responsibility: Hardened finding/issue shape for all engine outputs.
 */
class Finding {
    constructor(data = {}) {
        this.code = data.code || "UNKNOWN_FINDING";
        this.severity = data.severity || "info";
        this.status = data.status || "ready";
        this.category = data.category || "general";
        this.sourceEngine = data.sourceEngine || "generic";
        this.message = data.message || "";
        this.evidence = data.evidence || {};
        this.suggestedFix = {
            type: data.suggestedFix?.type || "manual_review",
            action: data.suggestedFix?.action || "Please review the finding details."
        };
        this.metadata = {
            schemaVersion: "v10.0",
            timestamp: new Date().toISOString()
        };
    }

    validate() {
        const severities = ["info", "warning", "error", "critical"];
        if (!severities.includes(this.severity)) throw new Error("Invalid severity: " + this.severity);
        if (!this.code) throw new Error("finding code is required");
        return true;
    }
}

module.exports = Finding;
