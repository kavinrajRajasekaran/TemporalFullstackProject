import { Router, Request, Response } from "express";
import { IUserDocument, UserModel } from "./utils/userModel";
const router = Router()
import { getClient } from "./temporal/client";
import { signupWorkflow, updateWorkflow, deleteUserInfoWorkflow } from "./temporal/workflows";
import { verifyToken, generateToken } from "./temporal/jwtToken";
import mongoose from "mongoose"
import axios from 'axios'
import { getToken } from "./utils/auth0TokenGenerator";
import { createUserController,UpdateUserController,getAllUserController, deleteUserController } from "./controller";




router.delete('/users/:id', deleteUserController);


router.post('/users',createUserController)

router.patch("/users/:id", UpdateUserController);



router.get('/users',getAllUserController);


export default router

