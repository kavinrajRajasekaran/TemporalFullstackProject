import { Router } from "express";

const router = Router()

import { createUserController, UpdateUserController, getAllUserController, deleteUserController } from "./controllers/controller";




router.delete('/users/:id', deleteUserController);


router.post('/users', createUserController)

router.patch("/users/:id", UpdateUserController);



router.get('/users', getAllUserController);


export default router

