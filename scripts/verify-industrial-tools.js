const { IndustrialToolDiagnostics } = require('../index.js');

try {
    console.log('[SHARED-INFRA] Running container startup tool diagnostics...');
    IndustrialToolDiagnostics.runDiagnostics();
    console.log('[SHARED-INFRA] All required industrial tools are present and operational.');
    process.exit(0);
} catch (err) {
    console.error(`[SHARED-INFRA-ERROR] Diagnostic execution failed: ${err.message}`);
    process.exit(1);
}
