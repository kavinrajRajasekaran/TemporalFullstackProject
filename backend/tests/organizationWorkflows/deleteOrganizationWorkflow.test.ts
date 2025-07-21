// Mock variables must be declared before jest.mock and imports
const mockDeleteInAuth0Activity = jest.fn();
const mockDeleteInDBActivity = jest.fn();
const mockSendEmailToUserActivity = jest.fn();
const mockOrganizationStatusUpdateInDBActivity = jest.fn();

jest.mock('../../temporal/activities/OrganizationActivities', () => ({
  deleteInAuth0Activity: mockDeleteInAuth0Activity,
  deleteInDBActivity: mockDeleteInDBActivity,
  sendEmailToUserActivity: mockSendEmailToUserActivity,
  OrganizationStatusUpdateInDBActivity: mockOrganizationStatusUpdateInDBActivity,
}));

jest.mock('@temporalio/workflow', () => ({
  ...jest.requireActual('@temporalio/workflow'),
  proxyActivities: jest.fn(() => ({
    deleteInAuth0Activity: mockDeleteInAuth0Activity,
    deleteInDBActivity: mockDeleteInDBActivity,
    sendEmailToUserActivity: mockSendEmailToUserActivity,
    OrganizationStatusUpdateInDBActivity: mockOrganizationStatusUpdateInDBActivity,
  })),
  sleep: jest.fn(() => Promise.resolve()),
}));

import { deleteOrganizationWorkflow } from '../../temporal/workflows/OrganizationWorkflow';
import { ApplicationFailure } from '@temporalio/workflow';
import mongoose from 'mongoose';

describe('deleteOrganizationWorkflow', () => {
  const orgId = new mongoose.Types.ObjectId();
  const input = {
    authId: 'auth0-org-id',
    receiver: 'receiver@example.com',
    id: orgId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
  });

  it('should complete organization deletion workflow successfully', async () => {
    mockDeleteInAuth0Activity.mockResolvedValue(undefined);
    mockDeleteInDBActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockResolvedValue(undefined);

    await expect(deleteOrganizationWorkflow(input)).resolves.toBeUndefined();
    expect(mockDeleteInAuth0Activity).toHaveBeenCalledWith(input.authId);
    expect(mockDeleteInDBActivity).toHaveBeenCalledWith(input.id);
    expect(mockSendEmailToUserActivity).toHaveBeenCalledWith({ to: input.receiver, subject: 'your org is successfully deleted' });
  });

  it('should handle error in deleteInAuth0Activity and update status to failure', async () => {
    mockDeleteInAuth0Activity.mockRejectedValue(new ApplicationFailure('Auth0 error', 'AUTH0_ERROR'));
    mockDeleteInDBActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockResolvedValue(undefined);
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});

    await expect(deleteOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
    expect(mockOrganizationStatusUpdateInDBActivity).toHaveBeenCalledWith({ id: orgId, status: 'failure', failureReason: 'failed while deleting organization' });
  });

  it('should handle error in deleteInDBActivity and update status to failure', async () => {
    mockDeleteInAuth0Activity.mockResolvedValue(undefined);
    mockDeleteInDBActivity.mockRejectedValue(new ApplicationFailure('DB error', 'DB_ERROR'));
    mockSendEmailToUserActivity.mockResolvedValue(undefined);
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});

    await expect(deleteOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
    expect(mockOrganizationStatusUpdateInDBActivity).toHaveBeenCalledWith({ id: orgId, status: 'failure', failureReason: 'failed while deleting organization' });
  });

  it('should handle error in sendEmailToUserActivity and update status to failure', async () => {
    mockDeleteInAuth0Activity.mockResolvedValue(undefined);
    mockDeleteInDBActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockRejectedValue(new ApplicationFailure('Email error', 'EMAIL_ERROR'));
    mockOrganizationStatusUpdateInDBActivity.mockResolvedValue({});

    await expect(deleteOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
    expect(mockOrganizationStatusUpdateInDBActivity).toHaveBeenCalledWith({ id: orgId, status: 'failure', failureReason: 'failed while deleting organization' });
  });

  it('should handle error in OrganizationStatusUpdateInDBActivity when updating status to failure', async () => {
    mockDeleteInAuth0Activity.mockRejectedValue(new ApplicationFailure('Auth0 error', 'AUTH0_ERROR'));
    mockDeleteInDBActivity.mockResolvedValue(undefined);
    mockSendEmailToUserActivity.mockResolvedValue(undefined);
    // Simulate failure when updating status to 'failure'
    mockOrganizationStatusUpdateInDBActivity.mockRejectedValueOnce(new ApplicationFailure('DB error', 'DB_ERROR'));

    await expect(deleteOrganizationWorkflow(input)).rejects.toThrow(ApplicationFailure);
  });
}); 