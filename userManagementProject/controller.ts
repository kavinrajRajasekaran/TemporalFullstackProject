import { Router, Request, Response } from "express";
import { IUser, IUserDocument, UserModel } from "./utils/userModel";
const router = Router()
import { getClient } from "./temporal/client";
import { signupWorkflow, updateWorkflow, deleteUserInfoWorkflow } from "./temporal/workflows";
import { verifyToken, generateToken } from "./temporal/jwtToken";
import mongoose from "mongoose"
import axios from 'axios'
import { getToken } from "./utils/auth0TokenGenerator";




export async function createUserController(req:Request,res:Response){
const { email, name, password } = req.body

    if (!email || !name || !password) {
        res.status(400).json({
            "error": "invalid fields"
        })
        return
    }

    try {
        let user = await UserModel.findOne({ email })
        if (user) {
            res.status(409).json("User already exists")
            return
        }
    }
    catch (err: any) {
        res.status(500).send({ "error": err.message })
        return
    }

    let user: IUserDocument = await UserModel.create({
        name: name,
        email,
        password
    })

    let temporalClient = await getClient()

    await temporalClient.workflow.start(signupWorkflow, {
        taskQueue: 'user-management',
        startDelay: "1 minutes",
        workflowId: `signup-${user._id}`,
        args: [user.name, user.email, user.password, user._id],
    })
    res.status(200).json( user )

}

export async function UpdateUserController(req:Request,res:Response){
    
    
        const { username, password } = req.body;
    
        if (!username || !password) {
            res.status(400).json({
            message:"misssing input fields"
            })
            return 
        }
    
        try {
            const userId = new mongoose.Types.ObjectId(req.params.id)
    
            const updateFields: Record<string, any> = {};
            if (username) updateFields.name = username;
            if (password) updateFields.password = password;
    
            const user = await UserModel.findByIdAndUpdate(userId, updateFields, {
                new: true,
            });
    
            if (!user) {
              res.status(404).send("User not found");
                return 
            }
    
            if (!user.authId) {
                 res.status(500).send("authId is missing for this user.");
                 return
            }
    
            const client = await getClient();
    
            await client.workflow.start(updateWorkflow, {
                args: [user.authId, user._id, username, password],
                startDelay:"10 seconds",
                 
                taskQueue: 'user-management',
                workflowId: `update-${Date.now()}`,
            });
    
             res.status(200).json({ message: "User update initiated", user });
             return
        } catch (error) {
            console.error('Update error:', error);
             res.status(500).send("Server error");
             return
        }
}


export async function getAllUserController(req:Request,res:Response){
      try {
        const token = await getToken();
        const response = await axios.get(`https:${process.env.AUTH0_DOMAIN}/api/v2/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error(' Error fetching users from Auth0:', error.response?.data || error.message);

        res.status(error.response?.status || 500).json({
            message: 'Failed to fetch users from Auth0',
            details: error.response?.data || error.message,
        });
    }
}


export async function deleteUserController(req:Request,res:Response){
let userId=new mongoose.Types.ObjectId(req.params.id)

    try {
        

        const user = await UserModel.findByIdAndUpdate(userId, { status: "deleting" }, {
            new: true,
        });

        if (!user) {
            return res.status(404).send("User not found");
        }
    console.log("user:"+user)
        if (!user.authId) {
            return res.status(500).send("authId is missing for this user.");
        }

        const client = await getClient();

        await client.workflow.start(deleteUserInfoWorkflow, {
            args: [user.authId, user._id],
            startDelay: "1 minutes",
            taskQueue: 'user-management',
            workflowId: `delete-${Date.now()}`,
        });

        return res.status(200).json({ message: "User deletion  initiated"});
    } catch (error:any) {
        console.error('Update error:', error);
        console.log(error.message)
        return res.status(500).send("Server error");
    }

}