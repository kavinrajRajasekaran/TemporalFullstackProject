import axios from 'axios';
import { ApplicationFailure } from '@temporalio/activity';
import { userCreationInAuth0 } from '../../../temporal/activities/Useractivities';
import * as authTokenModule from '../../../utils/auth0TokenGenerator';
import { userCreationInAuth0Input } from '../../../utils/shared';

jest.mock('axios');
jest.mock('../../../utils/auth0TokenGenerator');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetToken = authTokenModule.getAuth0Token as jest.Mock;

describe('userCreationInAuth0 Activity', () => {
  const input: userCreationInAuth0Input = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'strongPassword123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user_id when creation is successful', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.post.mockResolvedValue({
      data: { user_id: 'auth0|abc123' },
    });

    const result = await userCreationInAuth0(input);
    expect(result).toBe('auth0|abc123');
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it('should throw non-retryable ApplicationFailure on 4xx error with status code and errorData', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'User already exists' },
      },
    });

    try {
      await userCreationInAuth0(input);
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(true);
      expect(err.message).toMatch(/creating user status in Auth0/);

      const parsedDetails = JSON.parse(err.details[0]);
      expect(parsedDetails.statusCode).toBe(409);
      expect(parsedDetails.errorData.message).toBe('User already exists');
    }
  });

  it('should throw retryable ApplicationFailure on 5xx error with status code and errorData', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
    });

    try {
      await userCreationInAuth0(input);
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(false);
      expect(err.message).toMatch(/creating user status in Auth0/);

      const parsedDetails = JSON.parse(err.details[0]);
      expect(parsedDetails.statusCode).toBe(500);
      expect(parsedDetails.errorData.message).toBe('Internal server error');
    }
  });

  it('should default to status 500 if no response is present (e.g., network error)', async () => {
    mockedGetToken.mockResolvedValue('mocked_token');
    mockedAxios.post.mockRejectedValue({
      message: 'Error while creating user account in Auth0',
    });

    try {
      await userCreationInAuth0(input);
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(false);

      const parsedDetails = JSON.parse(err.details[0]);
      expect(parsedDetails.statusCode).toBe(500);
      expect(parsedDetails.errorData).toBe(null);
    }
  });
});
