import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { sendEmailToUserActivity } from '../temporal/activities';
import * as emailModule from '../utils/mailsender'; 

describe('sendEmailToUserActivity', () => {
  afterEach(() => {
    sinon.restore();
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
      env.run(sendEmailToUserActivity, { to: 'user@example.com' ,subject:"hello testing"}),
      (err:any) => {
        assert(err instanceof ApplicationFailure);
        assert.strictEqual(err.nonRetryable, true);
        assert.strictEqual(err.message, 'Sending email to User Activity failed');
       
        return true;
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
      env.run(sendEmailToUserActivity, { to: 'user@example.com',subject:"hello testing" }),
      (err) => {
       
        assert.strictEqual(err, error);
        return true;
      }
    );
  });

  it('completes successfully when sendEmail does not throw', async () => {
    sinon.stub(emailModule, 'sendEmail').resolves();

    const env = new MockActivityEnvironment();
    await env.run(sendEmailToUserActivity, { to: 'user@example.com',subject:"hello testing" });
    
  });
});