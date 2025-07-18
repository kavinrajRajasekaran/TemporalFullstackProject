
import { Router } from 'express'

import { createOrganizationController, deleteOrganizationController, getAllOrganizationController, updateOrganizationController } from '../controllers/OrganizationControllers'
const router = Router()


import { OrganizationCancelWorkflowController, OrganizationTerminateWorkflowController, OrganizationUpdateWorkflowController } from '../controllers/OrganizationWorkflowSignallingControllers'


//to get all the organization created 

router.get("/", getAllOrganizationController)

//to create an organization

router.post('/', createOrganizationController)



//to update an organization 

router.patch("/:id", updateOrganizationController)

//to delete an organization controller
router.delete('/:id', deleteOrganizationController)


//to cancel an organization

router.post('/workflow/:workflowId/cancel', OrganizationCancelWorkflowController)


//to update an organization using workflowId 

router.put('/workflow/:workflowId/update', OrganizationUpdateWorkflowController);


//to terminate an organization using workflowId


router.post('/workflow/:workflowId/terminate', OrganizationTerminateWorkflowController)




export default router








