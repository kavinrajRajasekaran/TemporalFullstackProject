
jest.mock('../../config/db', () => ({
  connectToMongo: jest.fn().mockResolvedValue(undefined)
}));

// Mock @temporalio/workflow 
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


jest.mock('@temporalio/client', () => ({
  Connection: jest.fn(),
  WorkflowClient: jest.fn(),
}));
jest.mock('@temporalio/worker', () => ({
  Worker: { create: jest.fn() },
}));
jest.mock('@temporalio/common', () => ({}));


jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { organization_id: 'mocked-org-id' } }),
  patch: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue({ data: [{ name: 'mocked-org', metadata: { createdByEmail: 'admin@example.com' } }] }),
}));


(global as any).orgWorkflowStartMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../../temporal/workflows/OrganizationWorkflow', () => ({
  createOrganizationWorkflow: jest.fn(),
  updateOrganizationWorkflow: jest.fn(),
  deleteOrganizationWorkflow: jest.fn(),
}));
jest.mock('../../temporal/activities/OrganizationActivities', () => ({
  OrganizationCreationInAuthActivity: jest.fn(),
  sendEmailToUserActivity: jest.fn(),
  deleteInAuth0Activity: jest.fn(),
  updateOrganizationInDBActivity: jest.fn(),
  OrganizationStatusUpdateInDBActivity: jest.fn(),
  deleteInDBActivity: jest.fn(),
  UpdateOrganizationAuthActivity: jest.fn(),
}));
jest.mock('../../temporal/TemporalClient', () => ({
  TemporalClient: jest.fn().mockResolvedValue({
    workflow: {
      start: (global as any).orgWorkflowStartMock
    }
  })
}));

let orgFindOneMock = jest.fn();
let orgCreateMock = jest.fn();
let orgFindByIdAndUpdateMock = jest.fn();
let orgFindByIdMock = jest.fn();
let orgDeleteManyMock = jest.fn();

jest.mock('../../models/OrganizationModel', () => ({
  OrganizationModel: {
    findOne: orgFindOneMock,
    create: orgCreateMock,
    findByIdAndUpdate: orgFindByIdAndUpdateMock,
    findById: orgFindByIdMock,
    deleteMany: orgDeleteManyMock,
  }
}));


const orgActualMongoose = jest.requireActual('mongoose');
jest.mock('mongoose', () => ({
  ...orgActualMongoose,
  Types: {
    ...orgActualMongoose.Types,
    ObjectId: jest.fn(() => 'mocked-org-object-id')
  }
}));

jest.setTimeout(20000);

describe('OrganizationFlow API Integration (fully mocked)', () => {
  let orgApp: any;
  let orgRequest: any;

  beforeEach(() => {
    jest.resetModules();
    
    const workflowMock = (global as any).orgWorkflowStartMock;
    jest.clearAllMocks();
    // Restore the workflow mock
    (global as any).orgWorkflowStartMock = workflowMock;
    if ((global as any).orgWorkflowStartMock) {
      (global as any).orgWorkflowStartMock.mockClear();
      (global as any).orgWorkflowStartMock.mockResolvedValue({ workflowId: 'mocked-workflow-id' });
    }
    // Re-require all mocks
    jest.doMock('../../config/db', () => ({ connectToMongo: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock('@temporalio/workflow', () => ({
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
    jest.doMock('@temporalio/client', () => ({ Connection: jest.fn(), WorkflowClient: jest.fn() }));
    jest.doMock('@temporalio/worker', () => ({ Worker: { create: jest.fn() } }));
    jest.doMock('@temporalio/common', () => ({}));
    jest.doMock('axios', () => ({
      post: jest.fn().mockResolvedValue({ data: { organization_id: 'mocked-org-id' } }),
      patch: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({ data: [{ name: 'mocked-org', metadata: { createdByEmail: 'admin@example.com' } }] }),
    }));
    jest.doMock('../../temporal/workflows/OrganizationWorkflow', () => ({
      createOrganizationWorkflow: jest.fn(),
      updateOrganizationWorkflow: jest.fn(),
      deleteOrganizationWorkflow: jest.fn(),
    }));
    jest.doMock('../../temporal/activities/OrganizationActivities', () => ({
      OrganizationCreationInAuthActivity: jest.fn(),
      sendEmailToUserActivity: jest.fn(),
      deleteInAuth0Activity: jest.fn(),
      updateOrganizationInDBActivity: jest.fn(),
      OrganizationStatusUpdateInDBActivity: jest.fn(),
      deleteInDBActivity: jest.fn(),
      UpdateOrganizationAuthActivity: jest.fn(),
    }));
   
    let orgFindOneMock = jest.fn();
    let orgCreateMock = jest.fn();
    let orgFindByIdAndUpdateMock = jest.fn();
    let orgFindByIdMock = jest.fn();
    let orgDeleteManyMock = jest.fn();
    jest.doMock('../../models/OrganizationModel', () => ({
      OrganizationModel: {
        findOne: orgFindOneMock,
        create: orgCreateMock,
        findByIdAndUpdate: orgFindByIdAndUpdateMock,
        findById: orgFindByIdMock,
        deleteMany: orgDeleteManyMock,
      }
    }));
    // Mongoose partial mock
    const orgActualMongoose = jest.requireActual('mongoose');
    jest.doMock('mongoose', () => ({
      ...orgActualMongoose,
      Types: {
        ...orgActualMongoose.Types,
        ObjectId: jest.fn(() => 'mocked-org-object-id')
      }
    }));
    // require the app
    orgApp = require('../../server').default || require('../../server');
    orgRequest = require('supertest');
    // Attach mocks to global for use in tests
    (global as any).orgFindOneMock = orgFindOneMock;
    (global as any).orgCreateMock = orgCreateMock;
    (global as any).orgFindByIdAndUpdateMock = orgFindByIdAndUpdateMock;
    (global as any).orgFindByIdMock = orgFindByIdMock;
    (global as any).orgDeleteManyMock = orgDeleteManyMock;
  });

  it('should create an organization and trigger the workflow', async () => {
    (global as any).orgFindOneMock.mockResolvedValue(null);
    (global as any).orgCreateMock.mockResolvedValue({ _id: 'mocked-org-id', name: 'Test Org', display_name: 'Test Org Display', branding: { logo_url: 'http://logo.url/logo.png' }, metadata: { createdByEmail: 'admin@example.com' }, colors: { primary: '#123456', page_background: '#ffffff' }, status: 'provisoning' });
    
    const orgData = {
      name: 'Test Org',
      display_name: 'Test Org Display',
      branding_logo_url: 'http://logo.url/logo.png',
      createdByEmail: 'admin@example.com',
      primary_color: '#123456',
      page_background_color: '#ffffff'
    };
    const res = await orgRequest(orgApp)
      .post('/api/organizations')
      .send(orgData)
      .expect(200);
    if (!res.body.organization || !res.body.organization._id) {
      console.error('Create org response:', res.body);
    }
    expect(res.body.organization).toHaveProperty('_id');
    expect(res.body.organization.name).toBe(orgData.name);
    expect((global as any).orgWorkflowStartMock).toHaveBeenCalled();
  });

  it('should return 409 for duplicate organization', async () => {
    (global as any).orgFindOneMock.mockResolvedValue({ _id: 'existing-org-id', name: 'dup-org' });
    const orgData = {
      name: 'Dup Org',
      display_name: 'Dup Org Display',
      branding_logo_url: 'http://logo.url/logo.png',
      createdByEmail: 'admin@example.com',
      primary_color: '#123456',
      page_background_color: '#ffffff'
    };
    const res = await orgRequest(orgApp)
      .post('/api/organizations')
      .send(orgData)
      .expect(409);
    expect(res.body.error).toBe('Organization already exists');
  });

  it('should return 400 for missing fields', async () => {
    const res = await orgRequest(orgApp)
      .post('/api/organizations')
      .send({})
      .expect(400);
    expect(res.body.error).toBe('Missing required fields');
    expect(res.body.missing).toContain('name');
  });

  it('should update an organization and trigger the workflow', async () => {
    (global as any).orgFindByIdAndUpdateMock.mockResolvedValue({ _id: 'mocked-org-id', name: 'Updated Org', metadata: { createdByEmail: 'admin@example.com' } });
    (global as any).orgFindByIdMock.mockResolvedValue({ _id: 'mocked-org-id', name: 'Updated Org', metadata: { createdByEmail: 'admin@example.com' } });
    const res = await orgRequest(orgApp)
      .patch('/api/organizations/mocked-org-object-id')
      .send({ name: 'Updated Org' })
      .expect(200);
    expect(res.body.message).toBe('Organization update initiated');
    expect((global as any).orgWorkflowStartMock).toHaveBeenCalled();
  });

  it('should return 404 for update of non-existent organization', async () => {
    (global as any).orgFindByIdAndUpdateMock.mockResolvedValue(null);
    (global as any).orgFindByIdMock.mockResolvedValue(null);
    const res = await orgRequest(orgApp)
      .patch('/api/organizations/mocked-org-object-id')
      .send({ name: 'Updated Org' })
      .expect(404);
    expect(res.text).toMatch(/organization not found/i);
  });

  it('should delete an organization and trigger the workflow', async () => {
    (global as any).orgFindByIdAndUpdateMock.mockResolvedValue({ _id: 'mocked-org-id', name: 'ToDelete', metadata: { createdByEmail: 'admin@example.com' } });
    (global as any).orgFindByIdMock.mockResolvedValue({ _id: 'mocked-org-id', name: 'ToDelete', metadata: { createdByEmail: 'admin@example.com' } });
    const res = await orgRequest(orgApp)
      .delete('/api/organizations/mocked-org-object-id')
      .expect(200);
    expect(res.body.message).toBe('Organization deletion initiated');
    expect((global as any).orgWorkflowStartMock).toHaveBeenCalled();
  });

  it('should return 404 for delete of non-existent organization', async () => {
    (global as any).orgFindByIdAndUpdateMock.mockResolvedValue(null);
    (global as any).orgFindByIdMock.mockResolvedValue(null);
    const res = await orgRequest(orgApp)
      .delete('/api/organizations/mocked-org-object-id')
      .expect(404);
    expect(res.text).toMatch(/organization not found/i);
  });

  it('should fetch all organizations', async () => {
    const res = await orgRequest(orgApp)
      .get('/api/organizations')
      .expect(200);
    if (!Array.isArray(res.body) || !res.body[0] || !res.body[0].name) {
      console.error('Fetch all orgs response:', res.body);
    }
    
    expect(Array.isArray(res.body.data)).toBe(true);
    
  });

  it('should handle workflow error on organization creation', async () => {
    (global as any).orgFindOneMock.mockResolvedValue(null);
    (global as any).orgCreateMock.mockResolvedValue({ _id: 'mocked-org-id', name: 'Test Org', display_name: 'Test Org Display', branding: { logo_url: 'http://logo.url/logo.png' }, metadata: { createdByEmail: 'admin@example.com' }, colors: { primary: '#123456', page_background: '#ffffff' }, status: 'provisoning' });
    
    // Ensure the workflow mock exists and set it to reject
    if ((global as any).orgWorkflowStartMock) {
      (global as any).orgWorkflowStartMock.mockRejectedValueOnce(new Error('Workflow failed'));
    }
    
    const orgData = {
      name: 'Test Org',
      display_name: 'Test Org Display',
      branding_logo_url: 'http://logo.url/logo.png',
      createdByEmail: 'admin@example.com',
      primary_color: '#123456',
      page_background_color: '#ffffff'
    };
    const res = await orgRequest(orgApp)
      .post('/api/organizations')
      .send(orgData)
      .expect(500);
    expect(res.body.message).toBe('organization creation failed');
  });
});
  