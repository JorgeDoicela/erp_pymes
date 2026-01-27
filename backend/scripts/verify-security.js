import 'dotenv/config';
import prisma from '../src/database/db.js';

const API_URL = 'http://localhost:4000';

async function verifySecurity() {
    console.log('--- Verifying Security Requirements (RNF-11) ---');
    let hasError = false;

    // 1. Password Policy (Enforce Min 8 Chars)
    console.log('\n[Test 1] Password Complexity Enforcement');
    try {
        const shortPass = '12345';
        const res = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Security', lastName: 'Test',
                email: `sec_${Date.now()}@test.com`,
                password: shortPass,
                role: 'employee',
                // Required fields
                department: 'IT', position: 'Tester', salary: 1000,
                identityCard: `99${Date.now().toString().slice(-8)}`,
                birthDate: '1990-01-01', hireDate: '2024-01-01',
                address: 'Test', phone: '0999999999', civilStatus: 'Single',
                contractType: 'Indefinido'
            })
        });

        if (res.status === 400) {
            const data = await res.json();
            if (data.message.includes('8 caracteres')) {
                console.log('✅ PASS: API rejected short password.');
            } else {
                console.error('❌ FAIL: API rejected but wrong message:', data.message);
                hasError = true;
            }
        } else {
            console.error(`❌ FAIL: API accepted short password! Status: ${res.status}`);
            hasError = true;
        }

    } catch (error) {
        console.error('❌ FAIL: Validated password but with unexpected error:', error.message);
        hasError = true;
    }

    // 2. Failed Login Logging
    console.log('\n[Test 2] Failed Login Audit Logging');
    const invalidEmail = `fake_${Date.now()}@test.com`;

    // Trigger Failed Login
    try {
        await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: invalidEmail,
                password: 'wrongpassword'
            })
        });
    } catch (e) { /* Expected */ }

    // Wait a bit for DB write
    await new Promise(r => setTimeout(r, 1000));

    // Check DB
    const log = await prisma.auditLog.findFirst({
        where: {
            action: 'FAILED_LOGIN',
            details: { contains: invalidEmail }
        },
        orderBy: { timestamp: 'desc' }
    });

    if (log) {
        console.log('✅ PASS: Audit Log created for failed login.');
        console.log('   Log Details:', log.details);
    } else {
        console.error('❌ FAIL: No Audit Log found for failed login.');
        hasError = true;
    }

    if (!hasError) console.log('\n✅ ALL SECURITY TESTS PASSED');
    else console.error('\n❌ SOME TESTS FAILED');
}

verifySecurity()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
