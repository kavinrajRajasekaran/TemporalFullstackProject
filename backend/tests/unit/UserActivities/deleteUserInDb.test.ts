import assert from 'assert';
import sinon from 'sinon';
import mongoose from 'mongoose';
import { ApplicationFailure } from '@temporalio/common';
import { deleteUserInDb } from '../../../temporal/activities/Useractivities';

import * as UserModelModule from '../../../models/userModel';

describe('deleteUserInDb', () => {
  const authId = 'auth0|user123';
  let deleteStub: sinon.SinonStub;

  beforeEach(() => {
    deleteStub = sinon.stub(UserModelModule.UserModel, 'findOneAndDelete');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('completes successfully when deletion does not throw', async () => {
    deleteStub.resolves({ _id: new mongoose.Types.ObjectId() });

    await deleteUserInDb(authId);

    assert(deleteStub.calledOnceWithExactly({ authId }));
  });

  it('throws non-retryable ApplicationFailure for 4xx error', async () => {
    deleteStub.rejects({
      response: {
        status: 404,
        data: { message: 'User not found in DB' },
      },
      message: 'User not found in DB',
    });

    try {
      await deleteUserInDb(authId);
      assert.fail('Expected ApplicationFailure');
    } catch (err: any) {
      assert(err instanceof ApplicationFailure);
      assert.strictEqual(err.nonRetryable, true);
      assert.strictEqual(err.message, 'error while deletion of the user in auth0');
      
    }
  });

  it('rethrows error for 5xx server error', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
      message: 'Internal Server Error',
    };

    deleteStub.rejects(error);

    try {
      await deleteUserInDb(authId);
      assert.fail('Expected error');
    } catch (err: any) {
      assert(!(err instanceof ApplicationFailure));
      assert.strictEqual(err.response.status, 500);
      assert.strictEqual(err.message, 'Internal Server Error');
    }
  });
});
