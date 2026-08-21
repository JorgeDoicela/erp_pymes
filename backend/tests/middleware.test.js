import { describe, it, expect, vi } from 'vitest';
import { errorHandler, validateBodyNotEmpty } from '../src/middleware/errorHandler.js';

describe('Global Middleware & Error Handling Unit Tests', () => {

    describe('1. Error Handler Middleware', () => {
        it('should format operational error message into structured JSON with appropriate status code', () => {
            const err = new Error('El empleado no posee un contrato activo vigente');
            err.statusCode = 400;

            const req = { originalUrl: '/api/employees', method: 'POST' };
            const jsonMock = vi.fn();
            const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
            const res = { status: statusMock };
            const next = vi.fn();

            errorHandler(err, req, res, next);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: 'El empleado no posee un contrato activo vigente'
            }));
        });

        it('should handle general unexpected errors returning HTTP 500', () => {
            const err = new Error('Database connection failed');

            const req = { originalUrl: '/api/reports', method: 'GET' };
            const jsonMock = vi.fn();
            const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
            const res = { status: statusMock };
            const next = vi.fn();

            errorHandler(err, req, res, next);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.any(String)
            }));
        });
    });

    describe('2. Validate Body Not Empty Middleware', () => {
        it('should call next() for non-mutating GET requests', () => {
            const req = { method: 'GET', body: {}, headers: {} };
            const res = {};
            const next = vi.fn();

            validateBodyNotEmpty(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if POST body is completely empty', () => {
            const req = { method: 'POST', body: {}, headers: { 'content-type': 'application/json' } };
            const jsonMock = vi.fn();
            const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
            const res = { status: statusMock };
            const next = vi.fn();

            validateBodyNotEmpty(req, res, next);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: 'El body de la solicitud no puede estar vacío'
            }));
        });
    });
});
