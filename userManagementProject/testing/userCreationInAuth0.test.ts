import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { userCreationInAuth0 } from '../temporal/activities';
import axios from 'axios';
import * as tokenModule from '../utils/auth0TokenGenerator';

describe('userCreationInAuth0', () => {
  afterEach(() => {
    sinon.restore();
  });
it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
  sinon.stub(tokenModule, 'getAUth0Token').resolves('mock-token');
  const error = {
    response: { status: 400, data: { message: 'Bad Request' } },
    message: 'Creation failed'
  };
  sinon.stub(axios, 'post').rejects(error);

  const env = new MockActivityEnvironment();
  await assert.rejects(
    env.run(userCreationInAuth0, 'Test User', 'test@example.com', 'password123'),
    (err: any) => {
      assert(err instanceof ApplicationFailure);
      assert.strictEqual(err.nonRetryable, true);

      const detail = JSON.parse(err.details?.[0]as string) as {
        message: string;
      };

      assert.strictEqual(detail.message, 'Bad Request');
      return true;
    }
  );
});

it('rethrows error for 5xx errors', async () => {
  sinon.stub(tokenModule, 'getAUth0Token').resolves('mock-token');
  const error = {
    response: { status: 500, data: { message: 'Server Error' } },
    message: 'Creation failed'
  };
  sinon.stub(axios, 'post').rejects(error);

  const env = new MockActivityEnvironment();
  await assert.rejects(
    env.run(userCreationInAuth0, 'Test User', 'test@example.com', 'password123'),
    (err: any) => {
      assert.strictEqual(err.response?.status, 500);
      assert.strictEqual(err.response?.data?.message, 'Server Error');
      assert.strictEqual(err.message, 'Creation failed');
      return true;
    }
  );
});

})
