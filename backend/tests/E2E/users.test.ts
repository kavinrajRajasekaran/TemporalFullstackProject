import request from 'supertest';
import app from '../../server';
import { UserModel } from '../../models/userModel';
import mongoose from 'mongoose';
import axios from 'axios';
jest.mock('axios');

describe('User API E2E', () => {
  beforeAll(async () => {
    // Optionally connect to a test DB
    // await mongoose.connect(process.env.TEST_DB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  const userPayload = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'StrongP@ssw0rd!',
  };

  describe('POST /api/users', () => {
    it('should create a user with valid data', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'testuser1@example.com',
          password: 'StrongP@ssw0rd!',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe('testuser1@example.com');
      expect(res.body.password).toBeUndefined();
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'missing@fields.com' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should fail if user already exists', async () => {
      await UserModel.create({
        name: 'Test User',
        email: 'testuser2@example.com',
        password: 'StrongP@ssw0rd!',
      });
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'testuser2@example.com',
          password: 'StrongP@ssw0rd!',
        });
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user name if authId is present', async () => {
      // Create user
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'testuser3@example.com',
          password: 'StrongP@ssw0rd!',
        });
      const userId = createRes.body._id;

      // Wait for authId
      let user = null;
      for (let i = 0; i < 10; i++) {
        user = await UserModel.findById(userId);
        if (user && user.authId) break;
        await new Promise(res => setTimeout(res, 1000));
      }
      if (!user) throw new Error('User not found after creation');
      expect(user.authId).toBeDefined();

      // Update user
      const updateRes = await request(app)
        .patch(`/api/users/${userId}`)
        .send({ name: 'Updated Name' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user.name).toBe('Updated Name');
    });

    it('should fail if no fields are provided', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'testuser4@example.com',
          password: 'StrongP@ssw0rd!',
        });
      const userId = createRes.body._id;

      const res = await request(app)
        .patch(`/api/users/${userId}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'There is no field given to update');
    });

    it('should fail if user does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/users/${fakeId}`)
        .send({ name: 'Does Not Exist' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users', () => {
    it('should return a list of users from Auth0', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: [{ email: 'user@example.com' }] });
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('email', 'user@example.com');
    });

    it('should handle Auth0 error gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Auth0 error'));
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Failed to fetch users from Auth0');
    });

    it('should handle token retrieval failure gracefully', async () => {
      // Mock getAuth0Token to throw
      jest.spyOn(require('../../utils/auth0TokenGenerator'), 'getAuth0Token').mockImplementationOnce(() => {
        throw new Error('Token error');
      });
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Failed to fetch users from Auth0');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should initiate user deletion if user and authId exist', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'testuser5@example.com',
          password: 'StrongP@ssw0rd!',
        });
      const userId = createRes.body._id;

      // Wait for authId
      let user = null;
      for (let i = 0; i < 10; i++) {
        user = await UserModel.findById(userId);
        if (user && user.authId) break;
        await new Promise(res => setTimeout(res, 1000));
      }
      if (!user) throw new Error('User not found after creation');
      expect(user.authId).toBeDefined();

      const deleteRes = await request(app)
        .delete(`/api/users/${userId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty('message', 'User deletion  initiated');
    });

    it('should fail if user does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/users/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it('should fail if user has no authId', async () => {
      // Create user but do not wait for authId
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'testuser6@example.com',
          password: 'StrongP@ssw0rd!',
        });
      const userId = createRes.body._id;

      const res = await request(app)
        .delete(`/api/users/${userId}`);
      expect(res.status).toBe(400);
      expect(res.text).toBe('authId is missing for this user.');
    });
  });
});
