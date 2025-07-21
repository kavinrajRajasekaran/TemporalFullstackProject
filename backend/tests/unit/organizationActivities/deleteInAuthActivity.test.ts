import { deleteInAuth0Activity } from '../../../temporal/activities/OrganizationActivities';
import { ManagementClient } from 'auth0';
import { ApplicationFailure } from '@temporalio/workflow';
import { AppError } from '../../../Errors/AppError';
import { fail } from 'assert';

jest.mock('auth0');
describe('deleteInAuth0Activity', () => {
    const mockDelete = jest.fn();
  
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      (ManagementClient as unknown as jest.Mock).mockImplementation(() => ({
        organizations: {
          delete: mockDelete,
        },
      }));
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should delete organization successfully', async () => {
      mockDelete.mockResolvedValueOnce(undefined);
  
      await expect(deleteInAuth0Activity('org_123')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith({ id: 'org_123' });
    });
  
    it('should throw ApplicationFailure for invalid ID', async () => {
      try {
        await deleteInAuth0Activity('');
        fail('Expected ApplicationFailure to be thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApplicationFailure);
        expect(err.nonRetryable).toBe(true);
        expect(err.message).toMatch(/Error while deleting oganization in the auth0/);
        const details = JSON.parse(err.details[0]);
        expect(details.statusCode).toBe(400);
        expect(details.errorData.message).toBe('Invalid Organization id');
      }
    });
  
    it('should throw non-retryable ApplicationFailure on 4xx error', async () => {
      mockDelete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      });
  
      try {
        await deleteInAuth0Activity('invalid-id');
        fail('Expected ApplicationFailure to be thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApplicationFailure);
        expect(err.nonRetryable).toBe(true);
        const details = JSON.parse(err.details[0]);
        expect(details.statusCode).toBe(404);
        expect(details.errorData.message).toBe('Not found');
      }
    });
  
    it('should throw retryable ApplicationFailure on 5xx error', async () => {
      mockDelete.mockRejectedValueOnce({
        response: {
          status: 503,
          data: { message: 'Service unavailable' },
        },
      });
  
      try {
        await deleteInAuth0Activity('org_123');
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
      mockDelete.mockRejectedValueOnce(new Error('Unknown error'));
  
      try {
        await deleteInAuth0Activity('org_123');
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
  