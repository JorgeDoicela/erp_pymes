/**
 * @file socket.service.js
 * @description Norma ERP - Servicio WebSocket en Tiempo Real (Socket.IO)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { isSuperAdminRole } from '../../config/roles.js';

export class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('Cliente conectado a WebSocket:', socket.id);

      socket.on('authenticate', (payload) => {
        try {
          const token = typeof payload === 'object' ? payload?.token || payload?.userId : payload;
          let userId = null;
          let tenantId = null;

          if (typeof token === 'string' && token.includes('.')) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
            userId = decoded.id;
            tenantId = decoded.tenantId;
            socket.user = decoded;
          } else if (typeof payload === 'object' && payload?.userId) {
            userId = payload.userId;
            tenantId = payload.tenantId;
          }

          if (userId) {
            this.userSockets.set(userId, socket.id);
            console.log(`Usuario autenticado en socket: ${userId} -> ${socket.id}`);
          }

          if (tenantId) {
            socket.join(`tenant_${tenantId}`);
            console.log(`Socket ${socket.id} unido a sala de empresa: tenant_${tenantId}`);
          }
        } catch (error) {
          console.error('[SOCKET AUTH ERROR]: Token inválido en WebSocket', error.message);
        }
      });

      socket.on('join_tenant', (tenantId) => {
        if (socket.user) {
          if (socket.user.tenantId === tenantId || isSuperAdminRole(socket.user.role)) {
            socket.join(`tenant_${tenantId}`);
            console.log(`Socket ${socket.id} unido explícitamente a tenant_${tenantId}`);
          } else {
            console.warn(
              `[SOCKET WARN] Intento no autorizado de unirse a tenant_${tenantId} por usuario ${socket.user.id}`
            );
          }
        }
      });

      socket.on('disconnect', () => {
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`Usuario desconectado de socket: ${userId}`);
            break;
          }
        }
        console.log('Cliente desconectado de WebSocket:', socket.id);
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

  sendToTenant(tenantId, event, data) {
    if (tenantId && this.io) {
      this.io.to(`tenant_${tenantId}`).emit(event, data);
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

