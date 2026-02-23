import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';

console.log('isoBase64URL keys:', Object.keys(isoBase64URL));
console.log('isoUint8Array keys:', Object.keys(isoUint8Array));

try {
    const test = isoBase64URL.toBuffer('SGVsbG8');
    console.log('toBuffer worked');
} catch (e) {
    console.error('toBuffer failed:', e.message);
}

try {
    const test = isoBase64URL.toUint8Array('SGVsbG8');
    console.log('toUint8Array worked');
} catch (e) {
    console.error('toUint8Array failed:', e.message);
}
