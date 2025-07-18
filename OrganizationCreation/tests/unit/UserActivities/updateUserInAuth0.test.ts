import assert from 'assert';
import sinon from 'sinon';
import axios from 'axios';
import * as tokenModule from '../../../utils/auth0TokenGenerator';
import { ApplicationFailure } from '@temporalio/common';
import { updateUserInAuth0 } from '../../../temporal/activities/Useractivities';

describe('updateUserInAuth0', () => {
  const authId = 'auth0|user123';

  let tokenStub: sinon.SinonStub;
  let patchStub: sinon.SinonStub;

  beforeEach(() => {
    tokenStub = sinon.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
    patchStub = sinon.stub(axios, 'patch');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('updates user successfully when valid fields are provided', async () => {
    patchStub.resolves({ status: 200 });

    await updateUserInAuth0({ authId, name: 'John Doe', password: 'secret' });

    assert(tokenStub.calledOnce);
    assert(patchStub.calledOnceWith(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`,
      { name: 'John Doe', password: 'secret' },
      sinon.match.hasNested('headers.Authorization', 'Bearer mock-token')
    ));
  });

  it('throws error when no fields are provided to update', async () => {
    try {
      await updateUserInAuth0({ authId });
      assert.fail('Expected error');
    } catch (err: any) {
      assert.strictEqual(err.message, 'No fields provided to update.');
    }
  });

  it('throws non-retryable ApplicationFailure for 4xx error', async () => {
    patchStub.rejects({
      response: {
        status: 400,
        data: { message: 'Bad Request' }
      },
      message: 'Bad Request'
    });

    try {
      await updateUserInAuth0({ authId, name: 'John' });
      assert.fail('Expected ApplicationFailure');
    } catch (err: any) {
      assert(err instanceof ApplicationFailure);
      assert.strictEqual(err.nonRetryable, true);
      assert.strictEqual(err.message, 'error while updation status of the user in auth0');
      
    }
  });

  it('rethrows error for 5xx error (retryable)', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' }
      },
      message: 'Internal Server Error'
    };

    patchStub.rejects(error);

    try {
      await updateUserInAuth0({ authId, name: 'Jane' });
      assert.fail('Expected retryable error');
    } catch (err: any) {
      assert(!(err instanceof ApplicationFailure));
      assert.strictEqual(err.response.status, 500);
    }
  });
});
