/**
 * @project PrintPrice Pro - Platform Kernel
 * @author Manuel Enrique Morales (https://manuelenriquemorales.com/)
 * @social https://x.com/manuel_emorales | https://www.linkedin.com/in/manuelenriquemorales/
 */

/**
 * JobSpec Canonical Object (V10)
 * Responsibility: Hardened job specification shape.
 */
class JobSpec {
    constructor(data = {}) {
        this.schemaVersion = "v10.0";
        this.jobId = data.jobId || null;
        this.source = data.source || "api";
        this.productType = data.productType || "book";
        this.bindingType = data.bindingType || "perfect_bound";
        this.trim = {
            widthMm: data.trim?.widthMm || 148,
            heightMm: data.trim?.heightMm || 210
        };
        this.pageCount = data.pageCount || 0;
        this.copyCount = data.copyCount || 1;
        this.paper = {
            interiorCategory: data.paper?.interiorCategory || "uncoated",
            coverCategory: data.paper?.coverCategory || "coated",
            caliperMm: data.paper?.caliperMm || 0.1
        };
        this.cover = {
            bleedMm: data.cover?.bleedMm || 3,
            hingeMm: data.cover?.hingeMm || 0
        };
        this.logistics = {
            destinationRegion: data.logistics?.destinationRegion || "EU"
        };
        this.metadata = {
            createdAt: data.metadata?.createdAt || new Date().toISOString()
        };
    }

    validate() {
        if (!this.jobId) throw new Error("jobId is required");
        if (this.pageCount <= 0) throw new Error("pageCount must be > 0");
        return true;
    }
}

module.exports = JobSpec;
