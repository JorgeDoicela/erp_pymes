import * as jspdf from 'jspdf';

console.log('--- Comprehensive jsPDF Test ---');
console.log('All exports:', Object.keys(jspdf));

for (const key of Object.keys(jspdf)) {
    console.log(`Checking export [${key}]: type=${typeof jspdf[key]}`);
    try {
        const Ctor = jspdf[key];
        const doc = new Ctor();
        console.log(`  - Instance created with new [${key}]()`);
        console.log(`  - Instance has output: ${typeof doc.output === 'function'}`);
        if (typeof doc.output === 'function') {
            console.log('  ✅ FOUND CORRECT CONSTRUCTOR: ' + key);
        }
    } catch (e) {
        // console.log(`  - [${key}] is not a constructor`);
    }
}

import jspdfDefault from 'jspdf';
console.log('\nDefault import type:', typeof jspdfDefault);
console.log('Default import keys:', Object.keys(jspdfDefault || {}));

if (typeof jspdfDefault === 'function') {
    try {
        const doc = new jspdfDefault();
        console.log('  - Instance created with new default()');
        console.log(`  - Instance has output: ${typeof doc.output === 'function'}`);
    } catch (e) { }
}
