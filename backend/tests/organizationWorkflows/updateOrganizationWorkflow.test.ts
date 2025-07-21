
const mockUpdateOrganizationAuthActivity = jest.fn();
const mockSendEmailToUserActivity = jest.fn();
const mockOrganizationStatusUpdateInDBActivity = jest.fn();

jest.mock('../../temporal/activities/OrganizationActivities', () => ({
  UpdateOrganizationAuthActivity: mockUpdateOrganizationAuthActivity,
  sendEmailToUserActivity: mockSendEmailToUserActivity,
  OrganizationStatusUpdateInDBActivity: mockOrganizationStatusUpdateInDBActivity,
}));

jest.mock('@temporalio/workflow', () => ({
  ...jest.requireActual('@temporalio/workflow'),
  proxyActivities: jest.fn(() => ({
    UpdateOrganizationAuthActivity: mockUpdateOrganizationAuthActivity,
    sendEmailToUserActivity: mockSendEmailToUserActivity,
    OrganizationStatusUpdateInDBActivity: mockOrganizationStatusUpdateInDBActivity,
  })),
  sleep: jest.fn(() => Promise.resolve()),
}));

import { updateOrganizationWorkflow } from '../../temporal/workflows/OrganizationWorkflow';
import { ApplicationFailure } from '@temporalio/workflow';
import mongoose from 'mongoose';

describe('updateOrganizationWorkflow', () => {
  const orgId = new mongoose.Types.ObjectId();
  const input = {
    authId: 'auth0-org-id',
    update: { name: 'Updated Org' },
    receiver: 'receiver@example.com',
    id: orgId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
  });

  it('should complete organization update workflow successfully', async () => {
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});
    mockUpdateOrganizationAuthActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockResolvedValue(undefined);

    await expect(updateOrganizationWorkflow(input)).resolves.toBeUndefined();
    expect(mockOrganizationStatusUpdateInDBActivity).toHaveBeenCalledWith({ id: orgId, status: 'updating' });
    expect(mockUpdateOrganizationAuthActivity).toHaveBeenCalledWith({ authid: input.authId, update: input.update });
    expect(mockOrganizationStatusUpdateInDBActivity).toHaveBeenCalledWith({ id: orgId, status: 'succeed' });
    expect(mockSendEmailToUserActivity).toHaveBeenCalledWith({ to: input.receiver, subject: 'updated your organization' });
  });

  it('should handle error in UpdateOrganizationAuthActivity and update status to failure', async () => {
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});
    mockUpdateOrganizationAuthActivity.mockRejectedValue(new ApplicationFailure('Auth0 error', 'AUTH0_ERROR'));
    mockSendEmailToUserActivity.mockResolvedValue(undefined);

    await expect(updateOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
    expect(mockOrganizationStatusUpdateInDBActivity).toHaveBeenCalledWith({ id: orgId, status: 'failure', failureReason: 'failed while updating the organization' });
  });

  it('should handle error in OrganizationStatusUpdateInDBActivity and propagate error', async () => {
    mockOrganizationStatusUpdateInDBActivity.mockRejectedValue(new ApplicationFailure('DB error', 'DB_ERROR'));
    mockUpdateOrganizationAuthActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockResolvedValue(undefined);

    await expect(updateOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
  });

  it('should handle error in sendEmailToUserActivity and propagate error', async () => {
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});
    mockUpdateOrganizationAuthActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockRejectedValue(new ApplicationFailure('Email error', 'EMAIL_ERROR'));

    await expect(updateOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
  });

  it('should handle error in OrganizationStatusUpdateInDBActivity when updating status to failure', async () => {
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});
    mockUpdateOrganizationAuthActivity.mockRejectedValue(new ApplicationFailure('Auth0 error', 'AUTH0_ERROR'));
    mockSendEmailToUserActivity.mockResolvedValue(undefined);
    // Simulate failure when updating status to 'failure'
    mockOrganizationStatusUpdateInDBActivity.mockRejectedValueOnce(new ApplicationFailure('DB error', 'DB_ERROR'));

    await expect(updateOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
  });
}); 