import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('API Health & System Integration Tests', () => {
  it('GET /api should return status 200 and greeting text', async () => {
    const response = await request(app).get('/api');
    expect(response.status).toBe(200);
    expect(response.text).toContain('API EMPLIFI funcionando correctamente');
  });

  it('GET /non-existent-route should return 404', async () => {
    const response = await request(app).get('/api/unknown-endpoint-xyz');
    expect(response.status).toBe(404);
  });
});
