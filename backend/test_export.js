async function testExports() {
    const API_URL = 'http://localhost:4000';
    let token = '';

    try {
        console.log('--- Iniciando Pruebas de Exportación (RNF-19) ---');

        // 1. Login as Admin
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@emplifi.com',
                password: '123456'
            })
        });
        const loginData = await loginRes.json();
        token = loginData.token;
        if (!token) throw new Error('No se pudo obtener el token');
        console.log('✅ Autenticado como Admin');

        // 2. Test Employee Excel Export
        const excelRes = await fetch(`${API_URL}/export/employees/excel`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('📊 Exportación Excel Empleados status:', excelRes.status);
        const excelType = excelRes.headers.get('content-type');
        if (excelType && excelType.includes('spreadsheetml')) {
            console.log('✅ Tipo MIME para Excel es correcto');
        }

        // 3. Test Payroll CSV
        const payrollsRes = await fetch(`${API_URL}/payroll`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const payrollsData = await payrollsRes.json();

        if (payrollsData.data && payrollsData.data.length > 0) {
            const payrollId = payrollsData.data[0].id;
            const csvRes = await fetch(`${API_URL}/export/payroll/${payrollId}/csv`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📝 Exportación CSV Nómina status:', csvRes.status);
            const csvType = csvRes.headers.get('content-type');
            if (csvType && csvType.includes('text/csv')) {
                console.log('✅ Tipo MIME para CSV es correcto');
            }

            // Test PayStub PDF
            const detailResHeader = await fetch(`${API_URL}/payroll/${payrollId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const detailHeaderData = await detailResHeader.json();

            if (detailHeaderData.data.details && detailHeaderData.data.details.length > 0) {
                const detailId = detailHeaderData.data.details[0].id;
                const pdfRes = await fetch(`${API_URL}/export/paystub/${detailId}/pdf`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (pdfRes.status !== 200) {
                    const pdfError = await pdfRes.json();
                    console.error('❌ Error PDF:', pdfError.message);
                } else {
                    console.log('📄 Exportación PDF Rol de Pago status:', pdfRes.status);
                    const pdfType = pdfRes.headers.get('content-type');
                    if (pdfType === 'application/pdf') {
                        console.log('✅ Tipo MIME para PDF es correcto');
                    }
                }
            }
        } else {
            console.log('⚠️ No se encontraron nóminas para probar CSV/PDF');
        }

        console.log('--- Pruebas Finalizadas ---');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
}

testExports();
