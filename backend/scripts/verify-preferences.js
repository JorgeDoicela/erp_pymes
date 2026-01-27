const API_URL = 'http://localhost:4000/notifications/preferences';
const LOGIN_URL = 'http://localhost:4000/auth/login';

async function verify() {
    try {
        // 1. Login
        const loginRes = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@emplifi.com',
                password: '123456'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful');

        // 2. Get Preferences
        const getRes = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const getData = await getRes.json();
        console.log('Initial Preferences:', getData);

        // 3. Update Preferences
        const newPrefs = {
            CONTRACT_EXPIRATION: { email: false, inApp: true },
            PAYROLL_CLOSING: { email: true, inApp: false }
        };
        const updateRes = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ preferences: newPrefs })
        });
        const updateData = await updateRes.json();
        console.log('Updated Preferences:', updateData);

        // 4. Verify Update
        const getRes2 = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const getData2 = await getRes2.json();
        console.log('Verified Preferences:', getData2.preferences);

        if (getData2.preferences?.CONTRACT_EXPIRATION?.email === false) {
            console.log('SUCCESS: Preferences updated correctly.');
        } else {
            console.error('FAILURE: Preferences did not match.');
        }

    } catch (error) {
        console.error('Verification Failed:', error.message);
    }
}

verify();
