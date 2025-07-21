// Mock variables must be declared before jest.mock and imports
const mockUserCreationInAuth0 = jest.fn();
const mockUpdateUserStatusInDB = jest.fn();

jest.mock('../../temporal/activities/Useractivities', () => ({
  userCreationInAuth0: mockUserCreationInAuth0,
  updateUserStatusInDB: mockUpdateUserStatusInDB,
}));

jest.mock('@temporalio/workflow', () => ({
  ...jest.requireActual('@temporalio/workflow'),
  proxyActivities: jest.fn(() => ({
    userCreationInAuth0: mockUserCreationInAuth0,
    updateUserStatusInDB: mockUpdateUserStatusInDB,
  })),
  sleep: jest.fn(() => Promise.resolve()),
}));

import { UserSignupWorkflow } from '../../temporal/workflows/UserWorkflows';
import { ApplicationFailure } from '@temporalio/workflow';
import mongoose from 'mongoose';


describe('UserSignupWorkflow', () => {
  const testUserId = new mongoose.Types.ObjectId();
  const testName = 'John Doe';
  const testEmail = 'john.doe@example.com';
  const testPassword = 'TestPassword123!';
  const testAuthId = 'auth0|123456789';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
  });

  it('should complete user signup workflow successfully', async () => {
    // Mock successful activity calls
    mockUserCreationInAuth0.mockResolvedValue(testAuthId);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      name: testName,
      email: testEmail,
      status: 'succeed',
      authId: testAuthId,
    });

    await expect(UserSignupWorkflow(testName, testEmail, testPassword, testUserId)).resolves.toBeUndefined();

    // Verify activities were called with correct parameters
    expect(mockUserCreationInAuth0).toHaveBeenCalledWith({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'succeed',
      failureReason: undefined,
      authId: testAuthId,
    });
  });

  it('should handle userCreationInAuth0 failure and update status to failed', async () => {
    const auth0Error = new ApplicationFailure('Auth0 creation failed', 'AUTH0_ERROR');
    
    // Mock userCreationInAuth0 to fail
    mockUserCreationInAuth0.mockRejectedValue(auth0Error);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserSignupWorkflow(testName, testEmail, testPassword, testUserId)).rejects.toThrow(ApplicationFailure);

    // Verify userCreationInAuth0 was called
    expect(mockUserCreationInAuth0).toHaveBeenCalledWith({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    // Verify updateUserStatusInDB was called with failure status
    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });

  it('should handle updateUserStatusInDB failure after successful auth0 creation', async () => {
    const dbError = new ApplicationFailure('Database update failed', 'DB_ERROR');
    
    // Mock userCreationInAuth0 to succeed
    mockUserCreationInAuth0.mockResolvedValue(testAuthId);
    // Mock updateUserStatusInDB to fail
    mockUpdateUserStatusInDB.mockRejectedValue(dbError);

    await expect(UserSignupWorkflow(testName, testEmail, testPassword, testUserId)).rejects.toThrow(ApplicationFailure);

    // Verify both activities were called
    expect(mockUserCreationInAuth0).toHaveBeenCalledWith({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'succeed',
      failureReason: undefined,
      authId: testAuthId,
    });
  });

  it('should handle both auth0 creation and status update failures', async () => {
    const auth0Error = new ApplicationFailure('Auth0 creation failed', 'AUTH0_ERROR');
    
    // Mock both activities to fail
    mockUserCreationInAuth0.mockRejectedValue(auth0Error);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserSignupWorkflow(testName, testEmail, testPassword, testUserId)).rejects.toThrow(ApplicationFailure);

    // Verify userCreationInAuth0 was called
    expect(mockUserCreationInAuth0).toHaveBeenCalledWith({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    // Verify updateUserStatusInDB was called with failure status
    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });

  it('should handle network errors during auth0 creation', async () => {
    const networkError = new Error('Network timeout');
    
    mockUserCreationInAuth0.mockRejectedValue(networkError);
    mockUpdateUserStatusInDB.mockResolvedValue({
      _id: testUserId,
      status: 'failed',
      failureReason: 'failed while updating to auth0',
    });

    await expect(UserSignupWorkflow(testName, testEmail, testPassword, testUserId)).rejects.toThrow(Error);

    expect(mockUserCreationInAuth0).toHaveBeenCalledWith({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    expect(mockUpdateUserStatusInDB).toHaveBeenCalledWith({
      userId: testUserId,
      statusValue: 'failed',
      failureReason: 'failed while updating to auth0',
    });
  });
}); 