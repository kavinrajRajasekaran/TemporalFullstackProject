import { Request, Response } from "express";
import { IUser, UserModel } from "../models/userModel";
import { TemporalClient } from "../temporal/TemporalClient";
import { UserSignupWorkflow, UserUpdateWorkflow, deleteUserInfoWorkflow } from "../temporal/workflows/UserWorkflows";

import mongoose from "mongoose"
import axios from 'axios'
import { getAuth0Token } from "../utils/auth0TokenGenerator";


export async function createUserController(req: Request, res: Response) {
try {
    const { email, name, password } = req.body

    if (!email || !name || !password) {
        let missingFields:string[]=[]
        if(!email)missingFields.push("email")
         if(!name)missingFields.push("name")
        if(!password)missingFields.push("password")
        res.status(400).json({
            message:"Invalid data",
            misssingFields:missingFields
        })
        return
    }



    
        let user = await UserModel.findOne({ email })
        if (user) {
            res.status(409).json("User already exists")
            return
        }



        let Newuser: IUser = await UserModel.create({
            name: name,
            email,
            password
        })

       

        let temporalClient = await TemporalClient()

        await temporalClient.workflow.start(UserSignupWorkflow, {
            taskQueue: 'user-management',
           
            workflowId: `signup-${Newuser._id}`,
            args: [Newuser.name, Newuser.email, Newuser.password!, Newuser._id!],
        })
        Newuser.password=undefined
        res.status(200).json(Newuser)

    }
    catch (err: any) {
        res.status(500).send({ 
            message:"User creation failed ",
            
        })
        return
    }

}

export async function UpdateUserController(req: Request, res: Response) {



    try {


        const { name, password } = req.body;

        if (!name && !password) {
            res.status(400).json({
                message: "There is no field given to update"
            })
            return
        }
        const userId = new mongoose.Types.ObjectId(req.params.id)

        const updateFields: Record<string, any> = {};
        if (name) updateFields.name = name;
        if (password) updateFields.password = password;

        const user = await UserModel.findByIdAndUpdate(userId, updateFields, {
            new: true,
        }).select('-password')

        if (!user) {
            res.status(404).send("User not found");
            return
        }

        if (!user.authId) {
            res.status(500).send("authId is missing for this user.");
            return
        }

        const client = await TemporalClient();

        await client.workflow.start(UserUpdateWorkflow, {
            args: [user.authId, user._id, name, password],
            startDelay: "10 seconds",

            taskQueue: 'user-management',
            workflowId: `update-${Date.now()}`,
        });

        res.status(200).json({ message: "User update initiated", user });
        return
    } catch (error) {
        
        res.status(500).json({
       message:" updating the user failed"
        });
        
    }
}


export async function getAllUserController(req: Request, res: Response) {
    try {
        const token = await getAuth0Token();
        const response = await axios.get(`https:${process.env.AUTH0_DOMAIN}/api/v2/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        
        res.status(500).json({
            message: 'Failed to fetch users from Auth0',
            
        });
    }
}


export async function deleteUserController(req: Request, res: Response) {


    try {
        let userId = new mongoose.Types.ObjectId(req.params.id)

        const user = await UserModel.findByIdAndUpdate(userId, { status: "deleting" }, {
            new: true,
        }).select("-password")

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (!user.authId) {
            return res.status(400).send("authId is missing for this user.");
        }

        const client = await TemporalClient();

        await client.workflow.start(deleteUserInfoWorkflow, {
            args: [user.authId, user._id],
           
            taskQueue: 'user-management',
            workflowId: `delete-${Date.now()}`,
        });

        res.status(200).json({ message: "User deletion  initiated" });
    } catch (error: any) {

         res.status(500).json({
            message:"Deletion of user failed "
        });
    }

}