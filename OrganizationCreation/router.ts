
import { Router } from 'express'

import { createOrganizationController, deleteOrganizationController, getAllOrganizationController, updateOrganizationController } from './controllers/OrganizationControllers'
const router = Router()


import {OrganizationCancelWorkflowController, OrganizationTerminateWorkflowController, OrganizationUpdateWorkflowController } from './controllers/workflowSignallingControllers'


//to get all the organization created 

router.get("/organizations",getAllOrganizationController)

//to create an organization

router.post('/organizations',createOrganizationController)



//to update an organization 

router.patch("/organizations/:id", updateOrganizationController)

//to delete an organization controller
router.delete('/organizations/:id',deleteOrganizationController )


//to cancel an organization

router.post('/workflow/:workflowId/cancel',OrganizationCancelWorkflowController)


//to update an organization 

router.put('/workflow/:workflowId/update',OrganizationUpdateWorkflowController);


//to terminate an organization 


router.post('/workflow/:workflowId/terminate', OrganizationTerminateWorkflowController)




export default router








