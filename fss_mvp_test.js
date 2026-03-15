/**
 * FSS MVP Functional Test Suite
 */
const regionContext = require('./ppos-shared-infra/packages/region/RegionContext');
const regionFilter = require('./ppos-shared-infra/packages/region/RegionFilter');
const fssAdapter = require('./ppos-shared-infra/packages/fss/FSSAdapter');
const { classifyEntity } = require('./ppos-shared-infra/packages/region/stateClassification');

async function runTests() {
    console.log('--- STARTING FSS MVP TESTS ---');

    // 1. RegionContext Test
    console.log('\n[1] Testing RegionContext...');
    const ctx = regionContext.get();
    console.log('Context:', JSON.stringify(ctx, null, 2));
    if (ctx.region_id === 'DEV-LOCAL') console.log('✅ PASS: Default dev context loaded.');

    // 2. Classification Test
    console.log('\n[2] Testing State Classification...');
    const orgClass = classifyEntity('organization');
    const pdfClass = classifyEntity('uploaded_pdf');
    console.log(`organization: ${orgClass}`);
    console.log(`uploaded_pdf: ${pdfClass}`);
    if (orgClass === 'GLOBAL' && pdfClass === 'REGIONAL') {
        console.log('✅ PASS: Classifications are correct.');
    }

    // 3. RegionFilter Test
    console.log('\n[3] Testing RegionFilter...');
    try {
        regionFilter.assertReplicable('uploaded_pdf', { id: 1 });
        console.log('❌ FAIL: Failed to block restricted entity.');
    } catch (e) {
        console.log(`✅ PASS: Blocked restricted entity: ${e.message}`);
    }

    try {
        regionFilter.assertReplicable('printer_node', { name: 'P1', local_path: 'C:\\Users\\...' });
        console.log('❌ FAIL: Failed to block local path leakage.');
    } catch (e) {
        console.log(`✅ PASS: Blocked path leakage: ${e.message}`);
    }

    const sanitized = regionFilter.sanitizeForGlobalSync('printer_node', { name: 'P1', local_path: '/foo', secret_key: '123' });
    if (!sanitized.local_path && !sanitized.secret_key && sanitized.name === 'P1') {
        console.log('✅ PASS: Payload sanitized correctly.');
    }

    // 4. FSSAdapter Test
    console.log('\n[4] Testing FSSAdapter...');
    const result = await fssAdapter.publishPrinterIdentityEvent({ id: 'printer-99', capabilities: ['laser'] });
    if (result.ok) {
        console.log(`✅ PASS: Event published to outbox: ${result.event_id}`);
    }

    console.log('\n--- FSS MVP TESTS COMPLETED ---');
}

runTests().catch(console.error);
