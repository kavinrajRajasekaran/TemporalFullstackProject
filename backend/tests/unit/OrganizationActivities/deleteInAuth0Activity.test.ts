import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import proxyquire from 'proxyquire';

describe('deleteInAuth0Activity', () => {
  let deleteStub: sinon.SinonStub;

  const setupActivityWithStub = (stubbedDelete: sinon.SinonStub) => {
    
    const fakeClient = {
      organizations: {
        delete: stubbedDelete,
      },
    };

    // Replace the auth0.ManagementClient constructor
    const { deleteInAuth0Activity } = proxyquire('../../../temporal/activities/OrganizationActivities', {
      auth0: {
        ManagementClient: function () {
          return fakeClient;
        },
      },
    });

    return deleteInAuth0Activity;
  };

  afterEach(() => {
    sinon.restore();
  });



  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    deleteStub = sinon.stub().rejects({
      response: { status: 404, data: { message: 'Not Found' } },
      message: 'Delete failed',
    });

    const deleteInAuth0Activity = setupActivityWithStub(deleteStub);
    const env = new MockActivityEnvironment();

    await assert.rejects(
      env.run(deleteInAuth0Activity, 'org-id-123'),
      (err: any) => {
        assert(err instanceof ApplicationFailure);
        assert.strictEqual(err.nonRetryable, true);
        assert.strictEqual(err.type, 'HttpErorr');

        const detail =err.details?.[0] as {
            statusCode?: number;
            responseData?: any;
            originalMessage?: string;
          };
        assert(detail, 'Expected error details[0] to be present');
        assert.strictEqual(detail.statusCode, 404);
        assert.strictEqual(detail.responseData.message, 'Not Found');
        assert.strictEqual(detail.originalMessage, 'Delete failed');

        return true;
      }
    );
  });

  it('throws retryable ApplicationFailure for 5xx errors', async () => {
    deleteStub = sinon.stub().rejects({
      response: { status: 500, data: { message: 'Server Error' } },
      message: 'Delete failed',
    });

    const deleteInAuth0Activity = setupActivityWithStub(deleteStub);
    const env = new MockActivityEnvironment();

    await assert.rejects(
      env.run(deleteInAuth0Activity, 'org-id-123'),
      (err: any) => {
        assert(err instanceof ApplicationFailure);
        assert.strictEqual(err.nonRetryable, false);
        assert.strictEqual(err.type, 'HttpErorr');

        const detail = err.details?.[0] as {
            statusCode?: number;
            responseData?: any;
            originalMessage?: string;
          };
        assert(detail, 'Expected error details[0] to be present');
        assert.strictEqual(detail.statusCode, 500);
        assert.strictEqual(detail.responseData.message, 'Server Error');
        assert.strictEqual(detail.originalMessage, 'Delete failed');

        return true;
      }
    );
  });
});


