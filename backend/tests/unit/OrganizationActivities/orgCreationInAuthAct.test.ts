import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import sinon from 'sinon';
import { ApplicationFailure } from '@temporalio/common';
import { OrganizationCreationInAuthActivity } from '../../../temporal/activities/OrganizationActivities'; 
import axios from 'axios';
import * as tokenModule from '../../../utils/auth0TokenGenerator'; 
import { IOrganization } from '../../../models/OrganizationModel';

describe('OrganizationCreationInAuthActivity', () => {
  afterEach(() => {
    sinon.restore();
  });

  const org: IOrganization = {
    name: 'TestOrg',
    status: 'provisoning',
    display_name: 'Test Organization',
    branding: { logo_url: 'logo.png' },
    metadata: {
      "createdByEmail":"test@email"
    },
    colors: { primary: '#000', page_background: '#fff' }
  };

  it('returns organization id on success', async () => {
    sinon.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
    sinon.stub(axios, 'request').resolves({ data: { id: 'org-123' } });

    const env = new MockActivityEnvironment();
    const result = await env.run(OrganizationCreationInAuthActivity, org);
    assert.strictEqual(result, 'org-123');
  });

  it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
    sinon.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
    const error = {
      response: { status: 400, data: { message: 'Bad Request' } },
      message: 'Creation failed'
    };
    sinon.stub(axios, 'request').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationCreationInAuthActivity, org),
      (err: unknown) => {
        if (err instanceof ApplicationFailure) {
          assert.strictEqual(err.nonRetryable, true);
          assert.strictEqual(err.message, 'organization creation in the  auth0 activity failed');
          if (err.details && err.details[0]) {
            assert((err.details[0] as string).includes('Bad Request'));
          }
          return true;
        }
        return false;
      }
    );
  });

  it('rethrows error for 5xx errors', async () => {
    sinon.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
    const error = {
      response: { status: 500, data: { message: 'Server Error' } },
      message: 'Creation failed'
    };
    sinon.stub(axios, 'request').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationCreationInAuthActivity, org),
      (err: unknown) => {
        assert.strictEqual(err, error);
        return true;
      }
    );
  });

  it('rethrows error if getAuth0Token fails', async () => {
    const error = new Error('Token fetch failed');
    sinon.stub(tokenModule, 'getAuth0Token').rejects(error);

    const env = new MockActivityEnvironment();
    await assert.rejects(
      env.run(OrganizationCreationInAuthActivity, org),
      (err: unknown) => {
        assert.strictEqual(err, error);
        return true;
      }
    );
  });
});