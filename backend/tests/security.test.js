import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Security & Middleware Unit Tests', () => {
  it('Should include security HTTP headers applied by Helmet', async () => {
    const response = await request(app).get('/api');
    expect(response.headers).toHaveProperty('x-dns-prefetch-control');
    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers).toHaveProperty('strict-transport-security');
  });

  it('Should reject empty JSON body requests when required', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({});
    // Should return 400 or 401 due to validation or authentication check
    expect([400, 401, 422]).toContain(response.status);
  });
});
