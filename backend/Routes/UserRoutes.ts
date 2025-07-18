import { Router } from "express";

const router = Router()

import { createUserController, UpdateUserController, getAllUserController, deleteUserController } from "../controllers/UserController";



//Route for deleting the user
router.delete('/:id', deleteUserController);

//Route for creating the user
router.post('/', createUserController)
//Route for updating the user

router.patch("/:id", UpdateUserController);


//route for get all the users
router.get('/', getAllUserController);


export default router

