// Mock variables must be declared before jest.mock and imports
const mockUpdateUserInAuth0 = jest.fn();
const mockUpdateUserStatusInDB = jest.fn();

jest.mock('../../temporal/activities/Useractivities', () => ({
  updateUserInAuth0: mockUpdateUserInAuth0,
  updateUserStatusInDB: mockUpdateUserStatusInDB,
}));

jest.mock('@temporalio/workflow', () => ({
  ...jest.requireActual('@temporalio/workflow'),
  proxyActivities: jest.fn(() => ({
    updateUserInAuth0: mockUpdateUserInAuth0,
    updateUserStatusInDB: mockUpdateUserStatusInDB,
  })),
  sleep: jest.fn(() => Promise.resolve()),
}));

import { UserUpdateWorkflow } from '../../temporal/workflows/UserWorkflows';
import { ApplicationFailure } from '@temporalio/workflow';
import mongoose from 'mongoose';


describe('UserUpdateWorkflow', () => {
  const testUserId = new mongoose.Types.ObjectId();
  const testAuthId = 'auth0|123456789';
  const testName = 'Updated Name';
  const testPassword = 'NewPassword123!';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
  });

  it('should complete user update workflow successfully with name and password', async () => {
    // Mock successful activity calls
    mockUpdateUserInAuth0.mockResolvedValue(undefined);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      name: testName,
      status: 'succeed',
      authId: testAuthId,
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId, testName, testPassword)).resolves.toBeUndefined();

    // Verify activities were called with correct parameters
    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: testName,
      password: testPassword,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'succeed',
    });
  });

  it('should complete user update workflow successfully with name only', async () => {
    // Mock successful activity calls
    mockUpdateUserInAuth0.mockResolvedValue(undefined);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      name: testName,
      status: 'succeed',
      authId: testAuthId,
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId, testName)).resolves.toBeUndefined();

    // Verify activities were called with correct parameters
    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: testName,
      password: undefined,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'succeed',
    });
  });

  it('should complete user update workflow successfully with password only', async () => {
    // Mock successful activity calls
    mockUpdateUserInAuth0.mockResolvedValue(undefined);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'succeed',
      authId: testAuthId,
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId, undefined, testPassword)).resolves.toBeUndefined();

    // Verify activities were called with correct parameters
    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: undefined,
      password: testPassword,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'succeed',
    });
  });

  it('should handle updateUserInAuth0 failure and update status to failed', async () => {
    const auth0Error = new ApplicationFailure('Auth0 update failed', 'AUTH0_ERROR');
    
    // Mock updateUserInAuth0 to fail
    mockUpdateUserInAuth0.mockRejectedValue(auth0Error);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId, testName, testPassword)).rejects.toThrow(ApplicationFailure);

    // Verify updateUserInAuth0 was called
    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: testName,
      password: testPassword,
    });

    // Verify updateUserStatusInDB was called with failure status
    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });

  it('should handle updateUserStatusInDB failure after successful auth0 update', async () => {
    const dbError = new ApplicationFailure('Database update failed', 'DB_ERROR');
    
    // Mock updateUserInAuth0 to succeed
    mockUpdateUserInAuth0.mockResolvedValue(undefined);
    // Mock updateUserStatusInDB to fail
    mockUpdateUserStatusInDB.mockRejectedValue(dbError);

    await expect(UserUpdateWorkflow(testAuthId, testUserId, testName)).rejects.toThrow(ApplicationFailure);

    // Verify both activities were called
    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: testName,
      password: undefined,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'succeed',
    });
  });

  it('should handle both auth0 update and status update failures', async () => {
    const auth0Error = new ApplicationFailure('Auth0 update failed', 'AUTH0_ERROR');
    
    // Mock both activities to fail
    mockUpdateUserInAuth0.mockRejectedValue(auth0Error);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId, testName, testPassword)).rejects.toThrow(ApplicationFailure);

    // Verify updateUserInAuth0 was called
    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: testName,
      password: testPassword,
    });

    // Verify updateUserStatusInDB was called with failure status
    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });

  it('should handle network errors during auth0 update', async () => {
    const networkError = new Error('Network timeout');
    
    mockUpdateUserInAuth0.mockRejectedValue(networkError);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId, testName)).rejects.toThrow(Error);

    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: testName,
      password: undefined,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });

  it('should handle case when no update fields are provided', async () => {
    const validationError = new ApplicationFailure('No fields provided to update', 'VALIDATION_ERROR');
    
    mockUpdateUserInAuth0.mockRejectedValue(validationError);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserUpdateWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    expect(mockUpdateUserInAuth0).toHaveBeenCalledWith({
      authId: testAuthId,
      name: undefined,
      password: undefined,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });
}); 