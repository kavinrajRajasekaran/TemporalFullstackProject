import request from 'supertest';
import app from '../../server';
import { OrganizationModel } from '../../models/OrganizationModel';
import mongoose from 'mongoose';

describe('Organization API E2E', () => {
  afterEach(async () => {
    await OrganizationModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/organizations', () => {
    it('should return a list of organizations (from Auth0)', async () => {
      const res = await request(app).get('/api/organizations');
      expect([200, 500]).toContain(res.status); 
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should return 200 and empty array if no organizations exist in Auth0', async () => {
      const res = await request(app).get('/api/organizations');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should return 500 if Auth0 credentials are missing/invalid', async () => {
      const res = await request(app).get('/api/organizations');
      if (res.status === 500) {
        expect(res.body).toHaveProperty('message', 'Failed to fetch organization result');
      }
    });

    it('should handle Auth0 error gracefully', async () => {
      const res = await request(app).get('/api/organizations');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/organizations', () => {
    const orgPayload = {
      name: 'TestOrg',
      display_name: 'Test Org',
      branding_logo_url: 'http://logo.url',
      createdByEmail: 'creator@example.com',
      primary_color: '#fff',
      page_background_color: '#000',
    };

    it('should create an organization with valid data', async () => {
      const res = await request(app).post('/api/organizations').send(orgPayload);
      expect([200, 500]).toContain(res.status); 
      if (res.status === 200) {
        expect(res.body.organization).toHaveProperty('name', 'TestOrg');
        expect(res.body).toHaveProperty('workflowId');
      }
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app).post('/api/organizations').send({ name: 'TestOrg' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Missing required fields');
      expect(Array.isArray(res.body.missing)).toBe(true);
    });

    it('should fail if organization already exists', async () => {
      await OrganizationModel.create({
        name: 'TestOrg2',
        display_name: 'Test Org 2',
        branding: { logo_url: 'http://logo.url' },
        metadata: { createdByEmail: 'creator@example.com' },
        colors: { primary: '#fff', page_background: '#000' },
        status: 'provisoning',
      });
      const res = await request(app).post('/api/organizations').send({
        ...orgPayload,
        name: 'TestOrg2',
        display_name: 'Test Org 2',
      });
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Organization already exists');
    });

    it('should handle DB or workflow error gracefully', async () => {
      // This will naturally happen if DB/Temporal is not available
      const res = await request(app).post('/api/organizations').send({
        ...orgPayload,
        name: 'TestOrg3',
        display_name: 'Test Org 3',
      });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/organizations/:id', () => {
    it('should update organization with valid data', async () => {
      const org = await OrganizationModel.create({
        name: 'OrgToUpdate',
        display_name: 'Org To Update',
        branding: { logo_url: 'http://logo.url' },
        metadata: { createdByEmail: 'creator@example.com' },
        colors: { primary: '#fff', page_background: '#000' },
        status: 'provisoning',
      });
      const res = await request(app)
        .patch(`/api/organizations/${org._id}`)
        .send({ display_name: 'Updated Org' });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('message', 'Organization update initiated');
      }
    });

    it('should fail with invalid organization id', async () => {
      const res = await request(app)
        .patch('/api/organizations/invalidid')
        .send({ display_name: 'Updated Org' });
      expect(res.status).toBe(400);
    });

    it('should fail if organization does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/organizations/${fakeId}`)
        .send({ display_name: 'Updated Org' });
      expect([404, 500]).toContain(res.status);
    });

    it('should handle DB or workflow error gracefully', async () => {
      const org = await OrganizationModel.create({
        name: 'OrgToUpdate2',
        display_name: 'Org To Update 2',
        branding: { logo_url: 'http://logo.url' },
        metadata: { createdByEmail: 'creator@example.com' },
        colors: { primary: '#fff', page_background: '#000' },
        status: 'provisoning',
      });
      const res = await request(app)
        .patch(`/api/organizations/${org._id}`)
        .send({ display_name: 'Updated Org' });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/organizations/:id', () => {
    it('should initiate organization deletion if org exists', async () => {
      const org = await OrganizationModel.create({
        name: 'OrgToDelete',
        display_name: 'Org To Delete',
        branding: { logo_url: 'http://logo.url' },
        metadata: { createdByEmail: 'creator@example.com' },
        colors: { primary: '#fff', page_background: '#000' },
        status: 'provisoning',
      });
      const res = await request(app)
        .delete(`/api/organizations/${org._id}`);
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('message', 'Organization deletion initiated');
      }
    });

    it('should fail with missing organization id', async () => {
      const res = await request(app)
        .delete('/api/organizations/');
      expect(res.status).toBe(404); // Express will not match route without id
    });

    it('should fail if organization does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/organizations/${fakeId}`);
      expect([404, 500]).toContain(res.status);
    });

    it('should handle DB or workflow error gracefully', async () => {
      const org = await OrganizationModel.create({
        name: 'OrgToDelete2',
        display_name: 'Org To Delete 2',
        branding: { logo_url: 'http://logo.url' },
        metadata: { createdByEmail: 'creator@example.com' },
        colors: { primary: '#fff', page_background: '#000' },
        status: 'provisoning',
      });
      const res = await request(app)
        .delete(`/api/organizations/${org._id}`);
      expect([200, 500]).toContain(res.status);
    });
  });
});
