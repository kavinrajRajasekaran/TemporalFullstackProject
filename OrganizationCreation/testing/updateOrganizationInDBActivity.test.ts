import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { updateOrganizationInDBActivity } from '../temporal/activities'; 
import { OrganizationModel, Tstatus } from '../models/OrganizationModel'; 
import mongoose from 'mongoose';

describe('updateOrganizationInDBActivity', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns updated organization when update succeeds', async () => {
const fakeOrg= {
    _id:new mongoose.Types.ObjectId("6878370b739ab3383263a309"),
  name: "myorganization",
  display_name: "My Organization",
  branding: {
    logo_url: "https://example.com/logo.png",
  },
  colors: {
    page_background: "#ffffff",
    primary: "#ff0000"
  },
  status: "updating" as Tstatus, 
  metadata: {
    createdByEmail: "admin@example.com"
  }
}

    sinon.stub(OrganizationModel, 'findByIdAndUpdate').resolves(fakeOrg as any);

    const env = new MockActivityEnvironment();
    const result = await env.run(
      updateOrganizationInDBActivity,
      fakeOrg,
      fakeOrg._id
    );
    assert.deepStrictEqual(result, fakeOrg);
  });

  it('returns undefined when no organization is found', async () => {
    sinon.stub(OrganizationModel, 'findByIdAndUpdate').resolves(null);

    const env = new MockActivityEnvironment();
    const result = await env.run(
      updateOrganizationInDBActivity,
      { name: 'TestOrg' } as any,
      new mongoose.Types.ObjectId()
    );
    assert.strictEqual(result, undefined);
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    
    const error = {
      response: { status: 400, data: { message: 'Bad Request' } },
      message: 'Update failed'
    };
    sinon.stub(OrganizationModel, 'findByIdAndUpdate').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(
        updateOrganizationInDBActivity,
        { name: 'TestOrg' } as any,
        new mongoose.Types.ObjectId()
      ),
      (err: any) => {
  assert(err instanceof ApplicationFailure);
  assert.strictEqual(err.nonRetryable, true);
  assert.strictEqual(err.type, 'DBErorr');

 
  const detail = err.details?.[0] as {
    statusCode: number;
    responseData: { message: string };
    originalMessage: string;
  };

  assert(detail !== undefined, 'Expected error details[0] to be present');
  assert.strictEqual(detail.statusCode, 400);
  assert.strictEqual(detail.responseData.message, 'Bad Request');
  assert.strictEqual(detail.originalMessage, 'Update failed');

  return true;
}

    );
  });

  it('throws retryable ApplicationFailure for 5xx errors', async () => {
    const error = {
      response: { status: 500, data: { message: 'Server Error' } },
      message: 'Update failed'
    };
    sinon.stub(OrganizationModel, 'findByIdAndUpdate').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(
        updateOrganizationInDBActivity,
        { name: 'TestOrg' } as any,
        new mongoose.Types.ObjectId()
      ),
    (err: any) => {
  assert(err instanceof ApplicationFailure);
  assert.strictEqual(err.nonRetryable, false);
  assert.strictEqual(err.type, 'DBErorr');

  
  const detail = err.details?.[0] as {
    statusCode: number;
    responseData: { message: string };
    originalMessage: string;
  };

  assert(detail !== undefined, 'Expected error details[0] to be present');
  assert.strictEqual(detail.statusCode, 500);
  assert.strictEqual(detail.responseData.message, 'Server Error');
  assert.strictEqual(detail.originalMessage, 'Update failed');

  return true;
}

    );
  });
});