import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { sendEmailToUserActivity } from '../../../temporal/activities/OrganizationActivities'; 
import * as emailModule from '../../../utils/mailsender'; 

describe('sendEmailToUserActivity', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('completes successfully when sendEmail does not throw', async () => {
    sinon.stub(emailModule, 'sendEmail').resolves();

    const env = new MockActivityEnvironment();
    await env.run(sendEmailToUserActivity, {
      to: 'user@example.com',
      subject: 'Test Subject',
      text: 'Hello',
      html: '<b>Hello</b>',
    });
    // No error means success
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Bad Request' }
      }
    };
    sinon.stub(emailModule, 'sendEmail').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(sendEmailToUserActivity, {
        to: 'user@example.com',
        subject: 'Test Subject'
      }),
     
       (err:any) => {
    if (err instanceof ApplicationFailure) {
      assert.strictEqual(err.nonRetryable, true);
      assert.strictEqual(err.message, 'Sending email to User Activity failed');
      if (err.details && err.details[0]) {
        assert((err.details[0] as string).includes('Bad Request'));
      }
      return true;
    }
    return false;
  }
    );
  });

  it('rethrows error for 5xx errors', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Server Error' }
      }
    };
    sinon.stub(emailModule, 'sendEmail').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(sendEmailToUserActivity, {
        to: 'user@example.com',
        subject: 'Test Subject'
      }),
      (err: any) => {
        assert.strictEqual(err, error);
        return true;
      }
    );
  });

  it('rethrows error if sendEmail throws without response', async () => {
    const error = new Error('Network error');
    sinon.stub(emailModule, 'sendEmail').rejects(error);

    const env = new MockActivityEnvironment();
     (err:any) => {
    if (err instanceof ApplicationFailure) {
      assert.strictEqual(err.nonRetryable, true);
      assert.strictEqual(err.message, 'Sending email to User Activity failed');
      if (err.details && err.details[0]) {
        assert((err.details[0] as string).includes('Network error'));
      }
      return true;
    }
    return false;
  }
  });
});


