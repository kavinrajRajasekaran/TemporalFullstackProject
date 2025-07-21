import { sendEmailToUserActivity } from '../../../temporal/activities/OrganizationActivities'; 
import { sendEmail, SendEmailOptions } from '../../../utils/mailsender';
import { AppError } from '../../../Errors/AppError';
import { ApplicationFailure } from '@temporalio/common';

jest.mock('../../../utils/mailsender', () => ({
  sendEmail: jest.fn(),
}));

const mockedSendEmail = sendEmail as jest.Mock;

describe('sendEmailToUserActivity', () => {
  const mockOptions: SendEmailOptions = {
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test email',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should successfully send email', async () => {
    mockedSendEmail.mockResolvedValueOnce(undefined);

    await expect(sendEmailToUserActivity(mockOptions)).resolves.toBeUndefined();
    expect(mockedSendEmail).toHaveBeenCalledWith(mockOptions);
  });

  it('should throw ApplicationFailure for AppError', async () => {
    const appErr = new AppError('User not found', 404);
    mockedSendEmail.mockRejectedValueOnce(appErr);

    await expect(sendEmailToUserActivity(mockOptions)).rejects.toThrow(ApplicationFailure);
    try {
      await sendEmailToUserActivity(mockOptions);
    } catch (e: any) {
      expect(e.message).toMatch(/Sending email to User Activity failed/);
      const details = JSON.parse(e.details[0]);
      expect(details.statusCode).toBe(404);
      expect(details.errorData.message).toBe('User not found');
    }
  });

  it('should throw ApplicationFailure for Axios error with 500', async () => {
    const axiosError = {
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    };

    mockedSendEmail.mockRejectedValueOnce(axiosError);

    await expect(sendEmailToUserActivity(mockOptions)).rejects.toThrow(ApplicationFailure);
    try {
      await sendEmailToUserActivity(mockOptions);
    } catch (e: any) {
      const details = JSON.parse(e.details[0]);
      expect(details.statusCode).toBe(500);
      expect(details.errorData.error).toBe('Internal Server Error');
      expect(e.nonRetryable).toBe(false);
    }
  });

  it('should throw ApplicationFailure for unknown error (no response)', async () => {
    mockedSendEmail.mockRejectedValueOnce(new Error('Something failed'));

    await expect(sendEmailToUserActivity(mockOptions)).rejects.toThrow(ApplicationFailure);
    try {
      await sendEmailToUserActivity(mockOptions);
    } catch (e: any) {
      const details = JSON.parse(e.details[0]);
      expect(details.statusCode).toBe(500);
      expect(details.errorData).toBeNull();
      expect(e.message).toMatch(/Sending email to User Activity failed/);
    }
  });
});
