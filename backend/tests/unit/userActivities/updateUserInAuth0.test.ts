import { updateUserInAuth0 } from '../../../temporal/activities/Useractivities';
import axios from 'axios';
import { ApplicationFailure } from '@temporalio/activity';
import * as authTokenModule from '../../../utils/auth0TokenGenerator';
import { updateUserInAuth0Input } from '../../../utils/shared';

jest.mock('axios');
jest.mock('../../../utils/auth0TokenGenerator');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetToken = authTokenModule.getAuth0Token as jest.Mock;

describe('updateUserInAuth0', () => {
  const baseInput: updateUserInAuth0Input = {
    authId: 'auth0|12345',
    name: 'Updated Name',
    password: 'newSecurePassword',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call axios.patch with correct params when update is valid', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.patch.mockResolvedValue({ status: 200 });

    await expect(updateUserInAuth0(baseInput)).resolves.toBeUndefined();

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/users/auth0|12345'),
      expect.objectContaining({
        name: 'Updated Name',
        password: 'newSecurePassword',
      }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer mocked_token' },
      })
    );
  });

  it('should throw if no fields are provided', async () => {
    const input = { authId: 'auth0|12345' }; 
    await expect(updateUserInAuth0(input as any)).rejects.toThrow('Error while updating user status in auth0');
  });

  it('should throw non-retryable ApplicationFailure on 4xx error', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.patch.mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'Bad Request' },
      },
    });

    await expect(updateUserInAuth0(baseInput)).rejects.toThrow(ApplicationFailure);
    try {
      await updateUserInAuth0(baseInput);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(true);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(400);
      expect(details.errorData.message).toBe('Bad Request');
    }
  });

  it('should throw retryable ApplicationFailure on 5xx error', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.patch.mockRejectedValue({
      response: {
        status: 503,
        data: { message: 'Service Unavailable' },
      },
    });

    await expect(updateUserInAuth0(baseInput)).rejects.toThrow(ApplicationFailure);
    try {
      await updateUserInAuth0(baseInput);
    } catch (err: any) {
      expect(err.nonRetryable).toBe(false);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(503);
      expect(details.errorData.message).toBe('Service Unavailable');
    }
  });
});
