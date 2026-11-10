import { describe, it, expect, vi } from 'vitest';
import { errorHandler, validateBodyNotEmpty } from '../src/middleware/errorHandler.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';
import { NotFoundError, ConflictError, ValidationError } from '../src/core/errors/appError.js';

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

        it('should handle AppError domain exceptions (NotFoundError with 404)', () => {
            const err = new NotFoundError('Empleado con ID no encontrado');

            const req = { originalUrl: '/api/employees/123', method: 'GET' };
            const jsonMock = vi.fn();
            const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
            const res = { status: statusMock };
            const next = vi.fn();

            errorHandler(err, req, res, next);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Empleado con ID no encontrado',
                type: 'NotFoundError'
            }));
        });

        it('should handle Prisma P2002 unique constraint error with HTTP 409 Conflict', () => {
            const err = new Error('Unique constraint failed');
            err.code = 'P2002';
            err.meta = { target: ['email'] };

            const req = { originalUrl: '/api/employees', method: 'POST' };
            const jsonMock = vi.fn();
            const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
            const res = { status: statusMock };
            const next = vi.fn();

            errorHandler(err, req, res, next);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                type: 'ConflictError'
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

    describe('2. Async Handler Utility', () => {
        it('should execute asynchronous controller and resolve without error', async () => {
            const controller = vi.fn().mockResolvedValue('ok');
            const wrapped = asyncHandler(controller);

            const req = {};
            const res = {};
            const next = vi.fn();

            wrapped(req, res, next);
            await new Promise(process.nextTick);

            expect(controller).toHaveBeenCalledWith(req, res, next);
            expect(next).not.toHaveBeenCalled();
        });

        it('should automatically catch rejected promise and forward error to next()', async () => {
            const thrownError = new Error('Async failure');
            const controller = vi.fn().mockRejectedValue(thrownError);
            const wrapped = asyncHandler(controller);

            const req = {};
            const res = {};
            const next = vi.fn();

            wrapped(req, res, next);
            await new Promise(process.nextTick);

            expect(next).toHaveBeenCalledWith(thrownError);
        });
    });

    describe('3. Validate Body Not Empty Middleware', () => {
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
