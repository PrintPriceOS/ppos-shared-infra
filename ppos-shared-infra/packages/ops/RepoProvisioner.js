const fs = require('fs');
const path = require('path');

class RepoProvisioner {
    constructor() {
        this.outputDir = path.join(process.cwd(), 'output_workspace');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async provision(repoConfig, waveId) {
        const repoPath = path.join(this.outputDir, repoConfig.repoId);
        if (!fs.existsSync(repoPath)) {
            fs.mkdirSync(repoPath, { recursive: true });
        }
        this.applyManifest(repoPath, repoConfig);
        this.createBaseStructure(repoPath);
        return {
            repoId: repoConfig.repoId,
            path: repoPath,
            status: 'PROVISIONED'
        };
    }

    applyManifest(repoPath, repoConfig) {
        const manifest = {
            id: repoConfig.repoId,
            title: repoConfig.repoTitle,
            provisionedAt: new Date().toISOString(),
            blueprint: 'V32',
            labels: repoConfig.labels || []
        };
        fs.writeFileSync(path.join(repoPath, 'repo.manifest.json'), JSON.stringify(manifest, null, 2));
    }

    createBaseStructure(repoPath) {
        const dirs = ['src', 'tests', 'docs', 'packages', 'protocol', '.github/workflows'];
        dirs.forEach(dir => {
            const fullDir = path.join(repoPath, dir);
            if (!fs.existsSync(fullDir)) {
                fs.mkdirSync(fullDir, { recursive: true });
            }
        });
        const readme = `# ${path.basename(repoPath)}\n\nINDUSTRIAL REPOSITORY - DO NOT MANUALLY SHIP\n\nPart of PrintPrice OS Build Program.`;
        fs.writeFileSync(path.join(repoPath, 'README.md'), readme);
    }
}

module.exports = new RepoProvisioner();
