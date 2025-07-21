import { deleteInDBActivity } from '../../../temporal/activities/OrganizationActivities';
import { ApplicationFailure } from '@temporalio/activity';
import { OrganizationModel } from '../../../models/OrganizationModel';
import { AppError } from '../../../Errors/AppError';
import mongoose from 'mongoose';
import { fail } from 'assert';

jest.mock('../../../models/OrganizationModel');

const mockedOrgModel = OrganizationModel as jest.Mocked<typeof OrganizationModel>;

describe('deleteInDBActivity', () => {
  const testId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should delete organization successfully', async () => {
    const mockDeletedOrg = {
      _id: testId,
      name: 'Test Organization',
      status: 'active',
    };

    mockedOrgModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockDeletedOrg as any);

    await expect(deleteInDBActivity(testId)).resolves.toBeUndefined();

    expect(mockedOrgModel.findByIdAndDelete).toHaveBeenCalledWith(testId);
  });

  it('should throw ApplicationFailure when organization not found', async () => {
    mockedOrgModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

    try {
      await deleteInDBActivity(testId);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(true);
      expect(err.message).toMatch(/Error while deleting organization in database activity/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(404);
      expect(details.errorData.message).toBe('orgaization not found');
    }
  });

  it('should throw retryable ApplicationFailure on database error', async () => {
    const dbError = new Error('Database connection failed');
    mockedOrgModel.findByIdAndDelete = jest.fn().mockRejectedValue(dbError);

    try {
      await deleteInDBActivity(testId);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(false);
      expect(err.message).toMatch(/Error while deleting organization in database activity/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(500);
      expect(details.errorData).toBe(null);
    }
  });

  it('should throw retryable ApplicationFailure on mongoose error', async () => {
    const mongooseError = new Error('Invalid ObjectId');
    mockedOrgModel.findByIdAndDelete = jest.fn().mockRejectedValue(mongooseError);

    try {
      await deleteInDBActivity(testId);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(false);
      expect(err.message).toMatch(/Error while deleting organization in database activity/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(500);
      expect(details.errorData).toBe(null);
    }
  });

  it('should handle AppError correctly', async () => {
    const appError = new AppError('Custom error', 422);
    mockedOrgModel.findByIdAndDelete = jest.fn().mockRejectedValue(appError);

    try {
      await deleteInDBActivity(testId);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(true);
      expect(err.message).toMatch(/Error while deleting organization in database activity/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(422);
      expect(details.errorData.message).toBe('Custom error');
    }
  });
});
