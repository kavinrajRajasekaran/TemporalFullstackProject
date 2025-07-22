// Mock the database connection to prevent actual DB calls during tests
jest.mock('../../config/db', () => ({
  connectToMongo: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@temporalio/workflow', () => ({
  proxyActivities: jest.fn(() => ({
    OrganizationCreationInAuthActivity: jest.fn(),
    sendEmailToUserActivity: jest.fn(),
    deleteInAuth0Activity: jest.fn(),
    updateOrganizationInDBActivity: jest.fn(),
    OrganizationStatusUpdateInDBActivity: jest.fn(),
    deleteInDBActivity: jest.fn(),
    UpdateOrganizationAuthActivity: jest.fn(),
  })),
  sleep: jest.fn(),
  condition: jest.fn(),
  setHandler: jest.fn(),
  defineUpdate: jest.fn(),
}));

// Mock all Temporal SDK modules to prevent real connections
jest.mock('@temporalio/client', () => ({
  Connection: jest.fn(),
  WorkflowClient: jest.fn(),
}));
jest.mock('@temporalio/worker', () => ({
  Worker: { create: jest.fn() },
}));
jest.mock('@temporalio/common', () => ({}));

// Mock all axios HTTP methods
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { user_id: 'mocked-auth0-id' } }),
  patch: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue({ data: [{ email: 'fetchuser@example.com' }] }),
}));

// Mock getAuth0Token if used
jest.mock('../../utils/auth0TokenGenerator', () => ({
  getAuth0Token: jest.fn().mockResolvedValue('fake-token'),
}));

// Attach the workflowStartMock to the global object so it is available before jest.mock hoisting
(global as any).workflowStartMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../../temporal/workflows/UserWorkflows', () => ({
  UserSignupWorkflow: jest.fn(),
  UserUpdateWorkflow: jest.fn(),
  deleteUserInfoWorkflow: jest.fn(),
}));
jest.mock('../../temporal/activities/Useractivities', () => ({
  userCreationInAuth0: jest.fn(),
  updateUserStatusInDB: jest.fn(),
  updateUserInAuth0: jest.fn(),
  deleteUserInAuth0: jest.fn(),
  deleteUserInDb: jest.fn(),
}));
jest.mock('../../temporal/TemporalClient', () => ({
  TemporalClient: jest.fn().mockResolvedValue({
    workflow: {
      start: (global as any).workflowStartMock
    }
  })
}));

// Mock UserModel DB calls
let userFindOneMock = jest.fn();
let userCreateMock = jest.fn();
let userFindByIdAndUpdateMock = jest.fn();
let userFindByIdMock = jest.fn();
let userDeleteManyMock = jest.fn();

jest.mock('../../models/userModel', () => ({
  UserModel: {
    findOne: userFindOneMock,
    create: userCreateMock,
    findByIdAndUpdate: userFindByIdAndUpdateMock,
    findById: userFindByIdMock,
    deleteMany: userDeleteManyMock,
  }
}));

// Only mock Types.ObjectId, preserve all other mongoose exports
const actualMongoose = jest.requireActual('mongoose');
jest.mock('mongoose', () => ({
  ...actualMongoose,
  Types: {
    ...actualMongoose.Types,
    ObjectId: jest.fn(() => 'mocked-object-id')
  }
}));

jest.setTimeout(20000);

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).workflowStartMock.mockResolvedValue(undefined);
  const axios = require('axios');
  axios.post.mockResolvedValue({ data: { user_id: 'mocked-auth0-id' } });
  axios.patch.mockResolvedValue({});
  axios.delete.mockResolvedValue({});
  axios.get.mockResolvedValue({ data: [{ email: 'fetchuser@example.com' }] });
  userFindOneMock.mockReset();
  userCreateMock.mockReset();
  userFindByIdAndUpdateMock.mockReset();
  userFindByIdMock.mockReset();
  userDeleteManyMock.mockReset();
});

// Import the Express app 
const app = require('../../server').default || require('../../server');
const request = require('supertest');

describe('UserFlow API Integration (fully mocked)', () => {
  it('should create a user and trigger the signup workflow', async () => {
    userFindOneMock.mockResolvedValue(null); // No user exists
    userCreateMock.mockResolvedValue({
      _id: 'mockedid',
      name: 'test user',
      email: 'testuser@example.com',
      password: undefined,
    });
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!',
    };
    const res = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe(userData.email.toLowerCase());
    expect((global as any).workflowStartMock).toHaveBeenCalled();
  });

  it('should return 409 for duplicate user', async () => {
    userFindOneMock.mockResolvedValue({ _id: 'existingid', email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Dup', email: 'dup@example.com', password: 'Password123!' })
      .expect(409);
    expect(res.body).toBe('User already exists');
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'missing@example.com' })
      .expect(400);
    expect(res.body.message).toBe('Invalid data');
    expect(res.body.misssingFields).toContain('name');
  });

  it('should update a user and trigger the update workflow', async () => {
    userFindByIdAndUpdateMock.mockReturnValue({
      select: () => ({ _id: 'mockedid', name: 'Updated', email: 'testuser@example.com', authId: 'auth0|testid' })
    });
    userFindByIdMock.mockResolvedValue({ _id: 'mockedid', name: 'Updated', email: 'testuser@example.com', authId: 'auth0|testid' });
    const res = await request(app)
      .patch('/api/users/mocked-object-id')
      .send({ name: 'Updated' })
      .expect(200);
    expect(res.body.message).toBe('User update initiated');
    expect((global as any).workflowStartMock).toHaveBeenCalled();
  });

  it('should return 404 for update of non-existent user', async () => {
    userFindByIdAndUpdateMock.mockReturnValue({ select: () => null });
    userFindByIdMock.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/users/mocked-object-id')
      .send({ name: 'Updated' })
      .expect(404);
    expect(res.text).toMatch(/user not found/i);
  });

  it('should delete a user and trigger the delete workflow', async () => {
    userFindByIdAndUpdateMock.mockReturnValue({ select: () => ({ _id: 'mockedid', name: 'ToDelete', email: 'delete@example.com', authId: 'auth0|deleteid' }) });
    userFindByIdMock.mockResolvedValue({ _id: 'mockedid', name: 'ToDelete', email: 'delete@example.com', authId: 'auth0|deleteid' });
    const res = await request(app)
      .delete('/api/users/mocked-object-id')
      .expect(200);
    expect(res.body.message).toBe('User deletion  initiated');
    expect((global as any).workflowStartMock).toHaveBeenCalled();
  });

  it('should return 404 for delete of non-existent user', async () => {
    userFindByIdAndUpdateMock.mockReturnValue({ select: () => null });
    userFindByIdMock.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/users/mocked-object-id')
      .expect(404);
    expect(res.text).toMatch(/user not found/i);
  });

  it('should fetch all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toBe('fetchuser@example.com');
  });

  it('should handle workflow error on user creation', async () => {
    userFindOneMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({ _id: 'mockedid', name: 'test user', email: 'testuser@example.com', password: undefined });
    (global as any).workflowStartMock.mockImplementationOnce(() => { throw new Error('Workflow failed'); });
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!',
    };
    const res = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(500);
    expect(res.text).toMatch(/user creation failed/i);
  });
});
