import axios from 'axios';
import { ApplicationFailure } from '@temporalio/workflow';
import { OrganizationCreationInAuthActivity } from '../../../temporal/activities/OrganizationActivities';
import { getAuth0Token } from '../../../utils/auth0TokenGenerator';

jest.mock('axios');
jest.mock('../../../utils/auth0TokenGenerator');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetAuth0Token = getAuth0Token as jest.Mock;

const mockOrg = {
    name: 'test-org',
    display_name: 'Test Organization',
    branding: {
      logo_url: 'https://example.com/logo.png',
    },
    colors: {
      primary: '#000000',
      page_background: '#ffffff',
    },
  };
  describe('OrganizationCreationInAuthActivity', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should create organization and return ID on success', async () => {
      mockedGetAuth0Token.mockResolvedValue('mocked-token');
      mockedAxios.request.mockResolvedValue({
        data: { id: 'auth0-org-id-123' },
      });
  
      const result = await OrganizationCreationInAuthActivity(mockOrg as any);
  
      expect(result).toBe('auth0-org-id-123');
      expect(mockedGetAuth0Token).toHaveBeenCalled();
      expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'post',
        url: expect.stringContaining('/api/v2/organizations'),
        headers: expect.objectContaining({
          Authorization: 'Bearer mocked-token',
        }),
      }));
    });
  
    it('should throw non-retryable ApplicationFailure for 4xx error', async () => {
      mockedGetAuth0Token.mockResolvedValue('mocked-token');
      mockedAxios.request.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      });

      try {
        await OrganizationCreationInAuthActivity(mockOrg as any);
        fail('Expected ApplicationFailure to be thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApplicationFailure);
        expect(err.nonRetryable).toBe(true);
        expect(err.message).toMatch(/organization creation in the  auth0 activity failed/);
        const details = JSON.parse(err.details[0]);
        expect(details.statusCode).toBe(400);
        expect(details.errorData.message).toBe('Bad request');
      }
    });

    it('should throw retryable ApplicationFailure for 5xx error', async () => {
      mockedGetAuth0Token.mockResolvedValue('mocked-token');
      mockedAxios.request.mockRejectedValue({
        response: {
          status: 503,
          data: { message: 'Service unavailable' },
        },
      });

      try {
        await OrganizationCreationInAuthActivity(mockOrg as any);
        fail('Expected ApplicationFailure to be thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApplicationFailure);
        expect(err.nonRetryable).toBe(false);
        const details = JSON.parse(err.details[0]);
        expect(details.statusCode).toBe(503);
        expect(details.errorData.message).toBe('Service unavailable');
      }
    });

    it('should throw retryable ApplicationFailure on unknown error', async () => {
      mockedGetAuth0Token.mockResolvedValue('mocked-token');
      mockedAxios.request.mockRejectedValue(new Error('Something broke'));

      try {
        await OrganizationCreationInAuthActivity(mockOrg as any);
        fail('Expected ApplicationFailure to be thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApplicationFailure);
        expect(err.nonRetryable).toBe(false);
        const details = JSON.parse(err.details[0]);
        expect(details.statusCode).toBe(500);
        expect(details.errorData).toBe(null);
      }
    });
  });
  