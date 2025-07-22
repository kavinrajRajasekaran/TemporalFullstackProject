// Mock variables must be declared before jest.mock and imports
const mockDeleteUserInAuth0 = jest.fn();
const mockDeleteUserInDb = jest.fn();
const mockUpdateUserStatusInDB = jest.fn();

jest.mock('../../temporal/activities/Useractivities', () => ({
  deleteUserInAuth0: mockDeleteUserInAuth0,
  deleteUserInDb: mockDeleteUserInDb,
  updateUserStatusInDB: mockUpdateUserStatusInDB,
}));

jest.mock('@temporalio/workflow', () => ({
  ...jest.requireActual('@temporalio/workflow'),
  proxyActivities: jest.fn(() => ({
    deleteUserInAuth0: mockDeleteUserInAuth0,
    deleteUserInDb: mockDeleteUserInDb,
    updateUserStatusInDB: mockUpdateUserStatusInDB,
  })),
  sleep: jest.fn(() => Promise.resolve()),
}));

import { deleteUserInfoWorkflow } from '../../temporal/workflows/UserWorkflows';
import { ApplicationFailure } from '@temporalio/workflow';
import mongoose from 'mongoose';


describe('deleteUserInfoWorkflow', () => {
  const testUserId = new mongoose.Types.ObjectId();
  const testAuthId = 'auth0|123456789';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
  });

  it('should complete user deletion workflow successfully', async () => {
    // Mock successful activity calls
    mockDeleteUserInAuth0.mockResolvedValue(undefined);
    mockDeleteUserInDb.mockResolvedValue(undefined);

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).resolves.toBeUndefined();

    // Verify activities were called with correct parameters
    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);
    expect(mockDeleteUserInDb).toHaveBeenCalledWith(testAuthId);
  });

  it('should handle deleteUserInAuth0 failure and update status to failed', async () => {
    const auth0Error = new ApplicationFailure('Auth0 deletion failed', 'AUTH0_ERROR');
    
    // Mock deleteUserInAuth0 to fail
    mockDeleteUserInAuth0.mockRejectedValue(auth0Error);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    // Verify deleteUserInAuth0 was called
    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);

    // Verify updateUserStatusInDB was called with failure status
    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    // Verify deleteUserInDb was NOT called since auth0 deletion failed
    expect(mockDeleteUserInDb).not.toHaveBeenCalled();
  });

  it('should handle deleteUserInDb failure after successful auth0 deletion', async () => {
    const dbError = new ApplicationFailure('Database deletion failed', 'DB_ERROR');
    
    
    mockDeleteUserInAuth0.mockResolvedValue(undefined);
    
    mockDeleteUserInDb.mockRejectedValue(dbError);

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    // Verify both activities were called
    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);
    expect(mockDeleteUserInDb).toHaveBeenCalledWith(testAuthId);
  });

  it('should handle both auth0 deletion and database deletion failures', async () => {
    const auth0Error = new ApplicationFailure('Auth0 deletion failed', 'AUTH0_ERROR');
    
    // Mock both activities to fail
    mockDeleteUserInAuth0.mockRejectedValue(auth0Error);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    // Verify deleteUserInAuth0 was called
    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);

    // Verify updateUserStatusInDB was called with failure status
    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    // Verify deleteUserInDb was NOT called since auth0 deletion failed
    expect(mockDeleteUserInDb).not.toHaveBeenCalled();
  });

  it('should handle network errors during auth0 deletion', async () => {
    const networkError = new Error('Network timeout');
    
    mockDeleteUserInAuth0.mockRejectedValue(networkError);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(Error);

    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    expect(mockDeleteUserInDb).not.toHaveBeenCalled();
  });

  it('should handle database errors during user deletion', async () => {
    const dbError = new ApplicationFailure('Database connection failed', 'DB_ERROR');
    
    mockDeleteUserInAuth0.mockResolvedValue(undefined);
    mockDeleteUserInDb.mockRejectedValue(dbError);

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);
    expect(mockDeleteUserInDb).toHaveBeenCalledWith(testAuthId);
  });

  it('should handle user not found in auth0', async () => {
    const notFoundError = new ApplicationFailure('User not found in Auth0', 'NOT_FOUND');
    
    mockDeleteUserInAuth0.mockRejectedValue(notFoundError);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    expect(mockDeleteUserInDb).not.toHaveBeenCalled();
  });

  it('should handle user not found in database', async () => {
    const dbNotFoundError = new ApplicationFailure('User not found in database', 'DB_NOT_FOUND');
    
    mockDeleteUserInAuth0.mockResolvedValue(undefined);
    mockDeleteUserInDb.mockRejectedValue(dbNotFoundError);

    await expect(deleteUserInfoWorkflow(testAuthId, testUserId)).rejects.toThrow(ApplicationFailure);

    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith(testAuthId);
    expect(mockDeleteUserInDb).toHaveBeenCalledWith(testAuthId);
  });

  it('should handle invalid auth0 ID format', async () => {
    const invalidIdError = new ApplicationFailure('Invalid Auth0 ID format', 'INVALID_ID');
    
    mockDeleteUserInAuth0.mockRejectedValue(invalidIdError);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    await expect(deleteUserInfoWorkflow('invalid-auth-id', testUserId)).rejects.toThrow(ApplicationFailure);

    expect(mockDeleteUserInAuth0).toHaveBeenCalledWith('invalid-auth-id');

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while deletion to auth0',
    });

    expect(mockDeleteUserInDb).not.toHaveBeenCalled();
  });
}); 