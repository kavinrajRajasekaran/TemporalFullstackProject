import mongoose from 'mongoose';
import request from 'supertest';
// import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../server';



describe('POST /api/users', () => {
  it('creates a user successfully', async () => {
    const res = await request(app)
      .get('/api/users')
      .send();

    expect(res.status).toBe(200);
    expect(typeof res.body.users).toBe(Array);

    const userInDb = await mongoose.connection
      .collection('users')
      .findOne({ email: 'alice@example.com' });

    expect(userInDb).not.toBeNull();
  });
});
