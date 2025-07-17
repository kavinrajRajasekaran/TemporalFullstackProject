import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { deleteInAuth0Activity } from '../temporal/activities';
import * as auth0 from 'auth0';

describe('deleteInAuth0Activity', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('completes successfully when delete does not throw', async () => {
    const deleteStub = sinon.stub().resolves();

    const fakeClient = {
      organizations: {
        delete: deleteStub,
      },
    };

    sinon.stub(auth0, 'ManagementClient').returns(fakeClient as any);

    const env = new MockActivityEnvironment();
    await env.run(deleteInAuth0Activity, 'org-id-123');

    assert(deleteStub.calledOnceWith({ id: 'org-id-123' }));
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    const error = {
      response: { status: 404, data: { message: 'Not Found' } },
      message: 'Delete failed',
    };

    const mockOrgDelete = sinon.stub().rejects(error);
    const fakeClient = {
      organizations: {
        delete: mockOrgDelete,
      },
    };

    sinon.stub(auth0, 'ManagementClient').returns(fakeClient as any);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(deleteInAuth0Activity, 'org-id-123'),
      (err: any) => {
        assert(err instanceof ApplicationFailure);
        assert.strictEqual(err.nonRetryable, true);
        assert.strictEqual(err.type, 'HttpErorr');

        const detail = err.details?.[0] as {
          statusCode: number;
          responseData: { message: string };
          originalMessage: string;
        };

        assert(detail !== undefined, 'Expected error details[0] to be present');
        assert.strictEqual(detail.statusCode, 404);
        assert.strictEqual(detail.responseData.message, 'Not Found');
        assert.strictEqual(detail.originalMessage, 'Delete failed');

        return true;
      }
    );
  });

  it('throws retryable ApplicationFailure for 5xx errors', async () => {
    const error = {
      response: { status: 500, data: { message: 'Server Error' } },
      message: 'Delete failed',
    };

    const mockOrgDelete = sinon.stub().rejects(error);
    const fakeClient = {
      organizations: {
        delete: mockOrgDelete,
      },
    };

    sinon.stub(auth0, 'ManagementClient').returns(fakeClient as any);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(deleteInAuth0Activity, 'org-id-123'),
      (err: any) => {
        assert(err instanceof ApplicationFailure);
        assert.strictEqual(err.nonRetryable, false); 
        assert.strictEqual(err.type, 'HttpErorr');

        const detail = err.details?.[0] as {
          statusCode: number;
          responseData: { message: string };
          originalMessage: string;
        };

        assert(detail !== undefined, 'Expected error details[0] to be present');
        assert.strictEqual(detail.statusCode, 500);
        assert.strictEqual(detail.responseData.message, 'Server Error');
        assert.strictEqual(detail.originalMessage, 'Delete failed');

        return true;
      }
    );
  });
});


















// import { MockActivityEnvironment } from '@temporalio/testing';
// import assert from 'assert';
// import sinon from 'sinon';
// import { ApplicationFailure } from '@temporalio/common';
// import { deleteInAuth0Activity } from '../temporal//activities';
// import { ManagementClient } from 'auth0';

// describe('deleteInAuth0Activity', () => {
//   afterEach(() => {
//     sinon.restore();
//   });
// it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
//   const error = {
//     response: { status: 404, data: { message: 'Not Found' } },
//     message: 'Delete failed'
//   };
//   sinon.stub(ManagementClient.prototype, 'organizations').value({
//     delete: sinon.stub().rejects(error)
//   });

//   const env = new MockActivityEnvironment();
//   await assert.rejects(
//     env.run(deleteInAuth0Activity, 'org-id-123'),
//     (err: any) => {
//       assert(err instanceof ApplicationFailure);
//       assert.strictEqual(err.nonRetryable, true);
//       assert.strictEqual(err.type, 'HttpErorr');

//       const detail = err.details?.[0] as {
//         statusCode: number;
//         responseData: { message: string };
//         originalMessage: string;
//       };

//       assert(detail !== undefined, 'Expected error details[0] to be present');
//       assert.strictEqual(detail.statusCode, 404);
//       assert.strictEqual(detail.responseData.message, 'Not Found');
//       assert.strictEqual(detail.originalMessage, 'Delete failed');

//       return true;
//     }
//   );
// });

// it('throws retryable ApplicationFailure for 5xx errors', async () => {
//   const error = {
//     response: { status: 500, data: { message: 'Server Error' } },
//     message: 'Delete failed'
//   };
//   sinon.stub(ManagementClient.prototype, 'organizations').value({
//     delete: sinon.stub().rejects(error)
//   });

//   const env = new MockActivityEnvironment();
//   await assert.rejects(
//     env.run(deleteInAuth0Activity, 'org-id-123'),
//     (err: any) => {
//       assert(err instanceof ApplicationFailure);
//       assert.strictEqual(err.nonRetryable, false); 
//       assert.strictEqual(err.type, 'HttpErorr');

//       const detail = err.details?.[0] as {
//         statusCode: number;
//         responseData: { message: string };
//         originalMessage: string;
//       };

//       assert(detail !== undefined, 'Expected error details[0] to be present');
//       assert.strictEqual(detail.statusCode, 500); 
//       assert.strictEqual(detail.responseData.message, 'Server Error');
//       assert.strictEqual(detail.originalMessage, 'Delete failed');

//       return true;
//     }
//   );
// });

// })