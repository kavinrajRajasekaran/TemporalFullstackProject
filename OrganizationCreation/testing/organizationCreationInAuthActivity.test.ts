import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { OrganizationCreationInAuthActivity } from '../temporal/activities';
import axios from 'axios';
import * as tokenModule from '../utils/auth0TokenGenerator';
import { Tstatus } from '../models/OrganizationModel';

describe('OrganizationCreationInAuthActivity', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns organization id on success', async () => {
    sinon.stub(tokenModule, 'getToken').resolves('mock-token');
    sinon.stub(axios, 'request').resolves({ data: { id: 'org-123' } });

    const env = new MockActivityEnvironment();
    const result = await env.run(OrganizationCreationInAuthActivity, {
      name: 'TestOrg1',
      display_name: 'Test Organization1',
      branding: { logo_url: 'logo.png' },
      colors: { primary: '#000', page_background: '#fff' },
       status: 'provisoning' as Tstatus,
       metadata: { createdByEmail: 'admin@test.com' },
      }
    );
    assert.strictEqual(result, 'org-123');
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    sinon.stub(tokenModule, 'getToken').resolves('mock-token');
    const error = {
      response: {
        status: 400,
        data: { message: 'Bad Request' }
      }
    };
    sinon.stub(axios, 'request').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationCreationInAuthActivity, {
        name: 'testorg1',
        display_name: 'Test rganization1',
        branding: { logo_url: 'logo.png' },
        colors: { primary: '#000', page_background: '#fff' },
         status: 'provisoning' as Tstatus,
  metadata: { createdByEmail: 'admin@test.com' },
      }),
      (err: any) => {
        assert(err instanceof ApplicationFailure);
        assert.strictEqual(err.nonRetryable, true);
        assert.strictEqual(err.message, 'organization creation in the  auth0 activity failed');
       
        return true;
      }
    );
  });

  it('rethrows error for 5xx errors', async () => {
    sinon.stub(tokenModule, 'getToken').resolves('mock-token');
    const error = {
      response: {
        status: 500,
        data: { message: 'Server Error' }
      }
    };
    sinon.stub(axios, 'request').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationCreationInAuthActivity, {name: 'TestOrg',
  display_name: 'Test Organization',
  status: 'provisoning' as Tstatus,
  metadata: { createdByEmail: 'admin@test.com' },
  branding: { logo_url: 'logo.png' },
  colors: { primary: '#000', page_background: '#fff' }
      }
      ),
      (err: any) => {
        assert.strictEqual(err, error);
        return true;
      }
    );
  });
});


