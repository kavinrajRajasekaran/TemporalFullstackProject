import { deleteUserInAuth0 } from '../../../temporal/activities/Useractivities';
import axios from 'axios';
import { ApplicationFailure } from '@temporalio/activity';
import * as authTokenModule from '../../../utils/auth0TokenGenerator';

jest.mock('axios');
jest.mock('../../../utils/auth0TokenGenerator');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetToken = authTokenModule.getAuth0Token as jest.Mock;

describe('deleteUserInAuth0', () => {
  const authId = 'auth0|12345';
  const deleteUrl = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`;

  beforeEach(() => {
    process.env.AUTH0_DOMAIN = 'example.auth0.com';
    jest.clearAllMocks();
  });

  it('should call axios.delete with correct params when valid', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.delete.mockResolvedValue({ status: 204 });

    await expect(deleteUserInAuth0(authId)).resolves.toBeUndefined();

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `https://example.auth0.com/api/v2/users/${authId}`,
      {
        headers: { Authorization: 'Bearer mocked_token' },
      }
    );
  });

  it('should throw non-retryable ApplicationFailure on 4xx error', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.delete.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'User not found' },
      },
    });

    await expect(deleteUserInAuth0(authId)).rejects.toThrow(ApplicationFailure);
    try {
      await deleteUserInAuth0(authId);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(true);
      const details = JSON.parse(err.details?.[0] ?? '{}');
      expect(details.statusCode).toBe(404);
      expect(details.errorData.message).toBe('User not found');
    }
  });

  it('should throw retryable ApplicationFailure on 5xx error', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.delete.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
    });

    await expect(deleteUserInAuth0(authId)).rejects.toThrow(ApplicationFailure);
    try {
      await deleteUserInAuth0(authId);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(false);
      const details = JSON.parse(err.details?.[0] ?? '{}');
      expect(details.statusCode).toBe(500);
      expect(details.errorData.message).toBe('Internal Server Error');
    }
  });

  it('should throw retryable ApplicationFailure on unknown error', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.delete.mockRejectedValue({}); // no response

    await expect(deleteUserInAuth0(authId)).rejects.toThrow(ApplicationFailure);
    try {
      await deleteUserInAuth0(authId);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(false);
      const details = JSON.parse(err.details?.[0] ?? '{}');
      expect(details.statusCode).toBe(500); // fallback default
    }
  });
});
