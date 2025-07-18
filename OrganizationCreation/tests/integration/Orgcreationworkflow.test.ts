import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { WorkflowClient } from '@temporalio/client';
import * as sinon from 'sinon';
import assert from 'assert';


import * as activities from '../../temporal/activities/OrganizationActivities'; 
import { createOrganizationWorkflow } from '../../temporal/workflows/OrganizationWorkflow';
import { IOrganization } from '../../models/OrganizationModel'; 
import mongoose from 'mongoose';

describe('Integration: createOrganizationWorkflow', function () {
  this.timeout(10000); 

  let env: TestWorkflowEnvironment;
  let client: WorkflowClient;
  let worker: Worker;

  const dummyOrg: IOrganization = {
    _id:new mongoose.Types.ObjectId('org123'),
    name: 'TestOrg',
    display_name:'hello_display',
    metadata: {
      createdByEmail: 'test@org.com',
    },
    branding:{
        logo_url:"http://test.com"
    },
    colors:{
primary:"#ffffff",
page_background:"#ffffff"
    },
    status:"provisoning"
  };

  const testAuthId = 'auth0|abc123';

  before(async () => {
    env = await TestWorkflowEnvironment.createTimeSkipping(); 
    client = env.workflowClient

    
    sinon.stub(activities, 'updateOrganizationInDBActivity').callsFake(async ({ organization }) => organization);
    sinon.stub(activities, 'OrganizationCreationInAuthActivity').resolves(testAuthId);
    sinon.stub(activities, 'OrganizationStatusUpdateInDBActivity').resolves();
    sinon.stub(activities, 'sendEmailToUserActivity').resolves();

    worker = await Worker.create({
      workflowsPath: require.resolve('../../temporal/workflows/createOrganizationWorkflow'),
      activities,
      taskQueue: 'test',
    });

    worker.run();
  });

  after(async () => {
    sinon.restore();
    await worker.shutdown();
    await env.teardown();
  });

  it('should execute createOrganizationWorkflow and call all activities', async () => {
    const handle = await client.start(createOrganizationWorkflow, {
      args: [dummyOrg],
      taskQueue: 'test',
      workflowId: 'org-workflow-' + Date.now(),
    });

    await handle.result(); 

    
    assert((activities.OrganizationCreationInAuthActivity as sinon.SinonStub).calledOnce);
    assert((activities.sendEmailToUserActivity as sinon.SinonStub).calledOnce);
    assert((activities.OrganizationStatusUpdateInDBActivity as sinon.SinonStub).calledWithMatch({ status: 'succeed', authid: testAuthId }));
  });
});
