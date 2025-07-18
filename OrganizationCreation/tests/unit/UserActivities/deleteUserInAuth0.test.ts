import assert from 'assert';
import sinon from 'sinon';
import axios from 'axios';
import { ApplicationFailure } from '@temporalio/common';
import { deleteUserInAuth0 } from '../../../temporal/activities/Useractivities';

describe('deleteUserInAuth0', () => {
  const authId = 'auth0|user123';
  const fakeToken = 'fake-token';
  let deleteStub: sinon.SinonStub;
  let getAuth0TokenStub: sinon.SinonStub;

  beforeEach(() => {
    
    deleteStub = sinon.stub(axios, 'delete');

    
    const modulePath = '../../../utils/auth0TokenGenerator';
    const mod = require(modulePath);
    getAuth0TokenStub = sinon.stub().resolves(fakeToken);
    mod.getAuth0Token = getAuth0TokenStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('completes successfully when delete does not throw', async () => {
    deleteStub.resolves({ status: 204 });

    await deleteUserInAuth0(authId);

    assert(deleteStub.calledOnce);
    const calledUrl = deleteStub.firstCall.args[0];
    assert.strictEqual(calledUrl, `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`);
  });

  it('throws non-retryable ApplicationFailure for 4xx error', async () => {
    deleteStub.rejects({
      response: {
        status: 404,
        data: { message: 'User not found' }
      },
      message: 'User not found'
    });

    try {
      await deleteUserInAuth0(authId);
      assert.fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      assert(err instanceof ApplicationFailure);
      assert.strictEqual(err.nonRetryable, true);
      assert.strictEqual(err.message, 'error while deletion of the user in auth0');
    
    }
  });

  it('rethrows error for 5xx (retryable)', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Server Error' }
      },
      message: 'Server Error'
    };
    deleteStub.rejects(error);

    try {
      await deleteUserInAuth0(authId);
      assert.fail('Expected error to be thrown');
    } catch (err: any) {
      assert(!(err instanceof ApplicationFailure));
      assert.strictEqual(err.response.status, 500);
      assert.strictEqual(err.message, 'Server Error');
    }
  });
});
