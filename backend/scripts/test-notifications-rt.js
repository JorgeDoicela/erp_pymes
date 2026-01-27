import { io } from 'socket.io-client';
import axios from 'axios';

// Configuración
const SERVER_URL = 'http://localhost:4000';

async function testSocket() {
    // Primero obtener un usuario real para autenticar el socket
    const usersResponse = await axios.get(`${SERVER_URL}/employees`);
    const testUser = usersResponse.data.data[0];
    const TEST_USER_ID = testUser.id;

    console.log(`Usando usuario real para prueba: ${testUser.firstName} (${TEST_USER_ID})`);

    const socket = io(SERVER_URL);

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor de sockets');
        socket.emit('authenticate', TEST_USER_ID);
    });

    socket.on('new_notification', (data) => {
        console.log('🔔 ¡Notificación recibida en tiempo real!');
        console.log('Contenido:', data);
        console.log('✅ PRUEBA DE TIEMPO REAL: PASS');
        socket.disconnect();
        process.exit(0);
    });

    // Timeout para la prueba
    setTimeout(() => {
        console.log('❌ PRUEBA DE TIEMPO REAL: FAIL (Timeout)');
        socket.disconnect();
        process.exit(1);
    }, 10000);
}

// Para probar esto, necesitaríamos disparar una notificación desde el backend.
// Como este script corre fuera del flujo normal, solo probamos la conexión.
testSocket();
