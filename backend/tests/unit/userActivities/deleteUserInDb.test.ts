import { deleteUserInDb } from '../../../temporal/activities/Useractivities';
import { ApplicationFailure } from '@temporalio/activity';
import { UserModel } from '../../../models/userModel';
import { AppError } from '../../../Errors/AppError';

jest.mock('../../../models/userModel');
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('deleteUserInDb', () => {
  const authId = 'auth0|12345';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete user if exists', async () => {
    mockedUserModel.findOneAndDelete.mockResolvedValue({
      authId: authId,
      name: 'Test User',
    });

    await expect(deleteUserInDb(authId)).resolves.toBeUndefined();

    expect(mockedUserModel.findOneAndDelete).toHaveBeenCalledWith({ authId });
  });

  it('should throw non-retryable ApplicationFailure if user not found', async () => {
    mockedUserModel.findOneAndDelete.mockResolvedValue(null); 

    await expect(deleteUserInDb(authId)).rejects.toThrow(ApplicationFailure);

    try {
      await deleteUserInDb(authId);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(true);
      expect(err.message).toBe('Error while deleting user in database');

      const details = JSON.parse(err.details?.[0] ?? '{}');
      expect(details.statusCode).toBe(404);
    }
  });

  it('should throw retryable ApplicationFailure on DB error', async () => {
    mockedUserModel.findOneAndDelete.mockRejectedValue({
      response: {
        status: 503,
        data: { message: 'DB temporarily unavailable' },
      },
    });

    await expect(deleteUserInDb(authId)).rejects.toThrow(ApplicationFailure);

    try {
      await deleteUserInDb(authId);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(false);
      const details = JSON.parse(err.details?.[0] ?? '{}');
      expect(details.statusCode).toBe(503);
      expect(details.errorData.message).toBe('DB temporarily unavailable');
    }
  });

  it('should default to status 500 if error has no response', async () => {
    mockedUserModel.findOneAndDelete.mockRejectedValue(new Error('Some DB crash'));

    await expect(deleteUserInDb(authId)).rejects.toThrow(ApplicationFailure);

    try {
      await deleteUserInDb(authId);
    } catch (err: any) {
      const details = JSON.parse(err.details?.[0] ?? '{}');
      expect(details.statusCode).toBe(500);
    }
  });
});
