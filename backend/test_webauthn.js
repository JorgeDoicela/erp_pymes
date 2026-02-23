import { isoBase64URL } from '@simplewebauthn/server/helpers';

const buf = new Uint8Array([1, 2, 3, 4, 5]);
const str = isoBase64URL.fromBuffer(buf);

console.log('Buffer:', buf);
console.log('Base64URL:', str);

if (str === '') {
    console.log('ERROR: Result is empty string');
} else {
    console.log('SUCCESS: Result is', str);
}
