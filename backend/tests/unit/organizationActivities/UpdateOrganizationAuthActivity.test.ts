import axios from 'axios';
import { UpdateOrganizationAuthActivity } from '../../../temporal/activities/OrganizationActivities';
import { ApplicationFailure } from '@temporalio/activity';
import * as authTokenModule from '../../../utils/auth0TokenGenerator';
import { AppError } from '../../../Errors/AppError';

jest.mock('axios');
jest.mock('../../../utils/auth0TokenGenerator');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetAuth0Token = authTokenModule.getAuth0Token as jest.Mock;

describe('UpdateOrganizationAuthActivity', () => {
  const input = {
    authid: 'org_12345',
    update: {
      name: 'Updated Org Name',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.AUTH0_DOMAIN = 'example.auth0.com';
  });

  it('should successfully call axios.patch and return data', async () => {
    mockedGetAuth0Token.mockResolvedValue('mocked_token');
    mockedAxios.request.mockResolvedValueOnce({ data: { success: true } });

    await expect(UpdateOrganizationAuthActivity(input)).resolves.toBeUndefined();

    expect(mockedAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'patch',
        url: expect.stringContaining(`/organizations/${input.authid}`),
        headers: expect.objectContaining({
          Authorization: 'Bearer mocked_token',
        }),
        data: JSON.stringify(input.update),
      })
    );
  });

  it('should throw ApplicationFailure for AppError', async () => {
    const appErr = new AppError('Org not found', 404);
    mockedGetAuth0Token.mockResolvedValue('mocked_token');
    mockedAxios.request.mockRejectedValueOnce(appErr);

    try {
      await UpdateOrganizationAuthActivity(input);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(true);
      expect(err.message).toMatch(/Error while updating the organization/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(404);
      expect(details.errorData.message).toBe('Org not found');
    }
  });

  it('should throw ApplicationFailure for 4xx error from axios', async () => {
    mockedGetAuth0Token.mockResolvedValue('mocked_token');
    mockedAxios.request.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Bad Request' },
      },
    });

    try {
      await UpdateOrganizationAuthActivity(input);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(true);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(400);
      expect(details.errorData.message).toBe('Bad Request');
    }
  });

  it('should throw retryable ApplicationFailure for 5xx error from axios', async () => {
    mockedGetAuth0Token.mockResolvedValue('mocked_token');
    mockedAxios.request.mockRejectedValueOnce({
      response: {
        status: 503,
        data: { message: 'Service Unavailable' },
      },
    });

    try {
      await UpdateOrganizationAuthActivity(input);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(false);
      const details = JSON.parse(err.details[0]);
      expect([500, 503]).toContain(details.statusCode);
      expect(details.errorData.message).toBe('Service Unavailable');
    }
  });

  it('should throw default ApplicationFailure for unknown error', async () => {
    mockedGetAuth0Token.mockResolvedValue('mocked_token');
    mockedAxios.request.mockRejectedValueOnce(new Error('Network error'));

    await expect(UpdateOrganizationAuthActivity(input)).rejects.toThrow(ApplicationFailure);

    try {
      await UpdateOrganizationAuthActivity(input);
    } catch (err: any) {
      const details = JSON.parse(err.details[0]);
       expect(details.statusCode).toBe(500);
      expect(details.errorData).toBeNull();
    }
  });
});
