import { Server } from 'socket.io';

class SocketService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> socketId
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*", // En producción ajustar a la URL del frontend
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log('Cliente conectado:', socket.id);

            socket.on('authenticate', (userId) => {
                if (userId) {
                    this.userSockets.set(userId, socket.id);
                    console.log(`Usuario autenticado en socket: ${userId} -> ${socket.id}`);
                }
            });

            socket.on('disconnect', () => {
                // Limpiar el mapa de sockets
                for (let [userId, socketId] of this.userSockets.entries()) {
                    if (socketId === socket.id) {
                        this.userSockets.delete(userId);
                        console.log(`Usuario desconectado de socket: ${userId}`);
                        break;
                    }
                }
                console.log('Cliente desconectado:', socket.id);
            });
        });
    }

    sendToUser(userId, event, data) {
        const socketId = this.userSockets.get(userId);
        if (socketId && this.io) {
            this.io.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }

    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
            return true;
        }
        return false;
    }
}

export default new SocketService();
