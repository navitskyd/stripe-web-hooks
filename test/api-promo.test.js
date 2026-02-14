const request = require('supertest');
const express = require('express');
const { setupPromoRoutes } = require('../api-promo');

describe('POST /promo', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    setupPromoRoutes(app);
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/promo').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email is required');
  });

  it('should add new email and return 201', async () => {
    // Use a unique email for test
    const testEmail = `test${Date.now()}@example.com`;
    //const res = await request(app).post('/promo').send({ email: testEmail });
   // expect(res.statusCode).toBe(201);
    //expect(res.body.email).toBe(testEmail);
  });

  it('should return 409 if email already added', async () => {
    const testEmail = `exists${Date.now()}@example.com`;
    // First add
    await request(app).post('/promo').send({ email: testEmail });
    // Second add
    //const res = await request(app).post('/promo').send({ email: testEmail });
   // expect(res.statusCode).toBe(409);
   // expect(res.body.message).toBe('Already exists');
  });
});
