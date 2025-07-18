import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { OrganizationStatusUpdateInDBActivity } from '../../../temporal/activities/OrganizationActivities';
import { OrganizationModel } from '../../../models/OrganizationModel';
import mongoose from 'mongoose';
import { OrganizationStatusUpdateInDBActivityInput } from '../../../utils/shared';

describe('OrganizationStatusUpdateInDBActivity', () => {
  afterEach(() => {
    sinon.restore();
  });

  const input: OrganizationStatusUpdateInDBActivityInput = {
    id: new mongoose.Types.ObjectId(),
    status: 'updating',
    failureReason: 'testing',
    authid: 'auth123',
  };

  it('updates and returns organization when found', async () => {
    const saveStub = sinon.stub().resolves();
    const fakeOrg = {
      _id: input.id,
      status: '',
      metadata: {}as { failureReason?: string },
      authid: '',
      save: saveStub,
    };

    sinon.stub(OrganizationModel, 'findById').resolves(fakeOrg as any);

    const env = new MockActivityEnvironment();
    const result = await env.run(OrganizationStatusUpdateInDBActivity, input);

    assert.strictEqual(result, fakeOrg);
    assert.strictEqual(fakeOrg.status, input.status);
    assert.strictEqual(fakeOrg.metadata.failureReason, input.failureReason);
    assert.strictEqual(fakeOrg.authid, input.authid);
    assert(saveStub.calledOnce);
  });

  it('throws error if organization not found', async () => {
    sinon.stub(OrganizationModel, 'findById').resolves(null);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationStatusUpdateInDBActivity, input),
      (err: unknown) => {
        if (err instanceof ApplicationFailure) {
          assert.strictEqual(err.type, 'DBError');
          assert(err.message.includes('status updation in the DB activity failed'));
          return true;
        }
        return false;
      }
    );
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    const fakeOrg = {
      _id: input.id,
      status: 'old',
      metadata: {},
      save: sinon.stub().rejects({
        response: { status: 400, data: { message: 'Bad Request' } },
        message: 'Save failed',
      }),
    };

    sinon.stub(OrganizationModel, 'findById').resolves(fakeOrg as any);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationStatusUpdateInDBActivity, input),
      (err: any) => {
        if (err instanceof ApplicationFailure) {
          assert.strictEqual(err.nonRetryable, true);
          assert.strictEqual(err.type, 'DBError');

          const details = err.details?.[0] as {
            statusCode?: number;
            responseData?: any;
            originalMessage?: string;
          };

          assert.strictEqual(details.statusCode, 400);
          assert.strictEqual(details.responseData.message, 'Bad Request');
          assert.strictEqual(details.originalMessage, 'Save failed');
          return true;
        }
        return false;
      }
    );
  });

  it('throws retryable ApplicationFailure for 5xx errors', async () => {
    const fakeOrg = {
      _id: input.id,
      status: 'old',
      metadata: {},
      save: sinon.stub().rejects({
        response: { status: 500, data: { message: 'Server Error' } },
        message: 'Save failed',
      }),
    };

    sinon.stub(OrganizationModel, 'findById').resolves(fakeOrg as any);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationStatusUpdateInDBActivity, input),
      (err: unknown) => {
        if (err instanceof ApplicationFailure) {
          assert.strictEqual(err.nonRetryable, false);
          assert.strictEqual(err.type, 'DBError');

          const details = err.details?.[0] as {
            statusCode?: number;
            responseData?: any;
            originalMessage?: string;
          };

          assert.strictEqual(details.statusCode, 500);
          assert.strictEqual(details.responseData.message, 'Server Error');
          assert.strictEqual(details.originalMessage, 'Save failed');
          return true;
        }
        return false;
      }
    );
  });
});
