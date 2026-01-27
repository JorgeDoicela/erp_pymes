import 'dotenv/config';
import prisma from '../src/database/db.js';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:4000';
// Fix: Use correct path relative to script execution (backend root)
const UPLOADS_DIR = path.resolve('uploads');

async function verifyRNF() {
    console.log('--- Verifying RNF-12 & RNF-14 ---');
    let hasError = false;

    // --- SETUP: Create Dummy File ---
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, 'test_secure.txt'), 'This is a secret document.');

    // --- LOGIN ---
    let token;
    let userId;
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@emplifi.com', password: 'password123' }) // Seeded credentials
        });
        const loginData = await loginRes.json();
        token = loginData.token;
        userId = loginData.data?.id;
        console.log('✅ Login Successful');
    } catch (e) {
        console.error('❌ Login Failed:', e.message);
        process.exit(1);
    }

    // --- TEST RNF-12: Security (Static Files) ---
    console.log('\n[RNF-12] Verifying Static File Security...');

    // 1. Unauthorized Access
    const unauthRes = await fetch(`${API_URL}/uploads/test_secure.txt`);
    if (unauthRes.status === 401) {
        console.log('✅ PASS: Unauthorized access blocked (401).');
    } else {
        console.error(`❌ FAIL: Unauthorized access allowed! Status: ${unauthRes.status}`);
        hasError = true;
    }

    // 2. Authorized Access
    const authRes = await fetch(`${API_URL}/uploads/test_secure.txt`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (authRes.status === 200) {
        console.log('✅ PASS: Authorized access allowed (200).');
    } else {
        console.error(`❌ FAIL: Authorized access blocked! Status: ${authRes.status}`);
        // Log body if possible
        try { console.log(await authRes.text()); } catch { }
        hasError = true;
    }

    // --- TEST RNF-14: Audit (Payroll) ---
    console.log('\n[RNF-14] Verifying Payroll Audit...');

    // 1. Generate Payroll (Trigger Action)
    // Use a future date to avoid conflicts with existing seeded data
    const testMonth = 12;
    const testYear = 2030;

    // Clean up previous runs
    const existing = await prisma.payroll.findFirst({
        where: {
            period: new Date(testYear, testMonth - 1, 1)
        }
    });
    if (existing) {
        await prisma.payrollDetail.deleteMany({ where: { payrollId: existing.id } });
        await prisma.payroll.delete({ where: { id: existing.id } });
    }

    try {
        const payRes = await fetch(`${API_URL}/payrolls/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ month: testMonth, year: testYear })
        });

        if (payRes.status === 201) {
            console.log('✅ Payroll Generated via API.');
        } else {
            console.error(`❌ FAIL: API Error generating payroll. Status: ${payRes.status}`);
            const t = await payRes.text();
            console.error(t);
            hasError = true;
        }

    } catch (e) {
        console.error('❌ FAIL: Network/Logic error:', e);
        hasError = true;
    }

    // 2. Check Audit Log
    // Wait for async db write if any (should be awaited in controller but safe side)
    await new Promise(r => setTimeout(r, 1000));

    const log = await prisma.auditLog.findFirst({
        where: {
            entity: 'Payroll',
            action: 'CREATE',
            performedBy: userId,
            details: { contains: `${testYear}-${testMonth}` }
        },
        orderBy: { timestamp: 'desc' }
    });

    if (log) {
        console.log('✅ PASS: Audit Log found for Payroll Generation.');
        console.log('   Details:', log.details);
    } else {
        console.error('❌ FAIL: No Audit Log found for Payroll Generation.');
        hasError = true;
    }

    // Cleanup Test File
    try { fs.unlinkSync(path.join(UPLOADS_DIR, 'test_secure.txt')); } catch { }

    if (!hasError) console.log('\n✅ ALL RNF TESTS PASSED');
    else console.error('\n❌ SOME RNF TESTS FAILED');
}

verifyRNF()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
