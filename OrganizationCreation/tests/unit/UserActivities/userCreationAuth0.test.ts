import assert from 'assert';
import sinon from 'sinon';
import axios from 'axios';
import { ApplicationFailure } from '@temporalio/common';
import { userCreationInAuth0Input } from '../../../utils/shared';
import { userCreationInAuth0 } from '../../../temporal/activities/Useractivities';

describe('userCreationInAuth0', () => {
  const input: userCreationInAuth0Input = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'securePassword123'
  };

  let postStub: sinon.SinonStub;
  let tokenStub: sinon.SinonStub;

  beforeEach(() => {
    postStub = sinon.stub(axios, 'post');
    tokenStub = sinon.stub().resolves('fake-token');

   
    const mod = require('../../../temporal/activities/OrganizationActivities');
    mod.getAuth0Token = tokenStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns user_id on successful creation', async () => {
    postStub.resolves({ data: { user_id: 'auth0|123456' } });

    const result = await userCreationInAuth0(input);

    assert.strictEqual(result, 'auth0|123456');
    assert(postStub.calledOnce);
    assert.strictEqual(postStub.firstCall.args[0], `https://${process.env.AUTH0_DOMAIN}/api/v2/users`);
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    postStub.rejects({
      response: {
        status: 400,
        data: { message: 'Bad Request' }
      },
      message: 'Request failed'
    });

    try {
      await userCreationInAuth0(input);
      assert.fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      assert(err instanceof ApplicationFailure);
     
      assert.strictEqual(err.nonRetryable, true);
      assert.strictEqual(err.message, 'error while creation of the user in auth0');
    
    }
  });

  it('rethrows error for 5xx errors (retryable)', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' }
      },
      message: 'Server Error'
    };
    postStub.rejects(error);

    try {
      await userCreationInAuth0(input);
      assert.fail('Expected error to be thrown');
    } catch (err: any) {
      
      assert(!(err instanceof ApplicationFailure));
      assert.strictEqual(err.response.status, 500);
      assert.strictEqual(err.message, 'Server Error');
    }
  });
});
