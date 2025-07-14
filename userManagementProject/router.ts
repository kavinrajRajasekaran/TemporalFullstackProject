import { Router, Request, Response } from "express";
import { IUser, IUserDocument, UserModel } from "./utils/userModel";
const router = Router()
import { getClient } from "./temporal/client";
import { signupWorkflow, updateWorkflow, deleteUserInfoWorkflow } from "./temporal/workflows";
import { verifyToken, generateToken } from "./temporal/jwtToken";
import mongoose from "mongoose"
import axios from 'axios'
import { getToken } from "./utils/auth0TokenGenerator";
router.post("/signup", async (req: Request, res: Response) => {
    const { email, name, password } = req.body

    if (!email || !name || !password) {
        res.status(400).json({
            "error": "invalid fields"
        })
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
    res.status(200).json({ "token": generateToken(user._id), user })



})


router.post('/login', async (req: Request, res: Response) => {
    const { email, name, password } = req.body

    if (!email || !name || !password) {
        res.status(400).json({
            "error": "invalid fields"
        })
    }

    try {
        let user = await UserModel.findOne({ email })
        if (!user) {
            res.status(404).json("User notexists")
            return
        }
        if (user && user.password !== password) {
            res.status(401).json("Unauthorized access")
            return
        }
        else {
            res.status(200).json({ "token": generateToken(user._id), user })
        }
    }
    catch (err: any) {
        res.status(500).send({ "error": err.message })
        return
    }
})



router.patch("/update", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).send("InvalidToken");
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(400).send("InvalidToken");
    }

    const { username, password } = req.body;

    if (!username && !password) {
        return res.status(400).send("No fields to update");
    }

    try {
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        const updateFields: Record<string, any> = {};
        if (username) updateFields.name = username;
        if (password) updateFields.password = password;

        const user = await UserModel.findByIdAndUpdate(userId, updateFields, {
            new: true,
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (!user.authId) {
            return res.status(500).send("authId is missing for this user.");
        }

        const client = await getClient();

        await client.workflow.start(updateWorkflow, {
            args: [user.authId, user._id, username, password],
            // startDelay: "6 minutes",
            cronSchedule:'42 12 * * *',
            taskQueue: 'user-management',
            workflowId: `update-${Date.now()}`,
        });

        return res.status(200).json({ message: "User update initiated", user });
    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).send("Server error");
    }
});



router.patch("/delete", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).send("InvalidToken");
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(400).send("InvalidToken");
    }

    const { username, password } = req.body;

    if (!username && !password) {
        return res.status(400).send("No fields to update");
    }

    try {
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        const user = await UserModel.findByIdAndUpdate(userId, { status: "deleting" }, {
            new: true,
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (!user.authId) {
            return res.status(500).send("authId is missing for this user.");
        }

        const client = await getClient();

        await client.workflow.start(deleteUserInfoWorkflow, {
            args: [user.authId, user._id],
            startDelay: "1 minutes",
            taskQueue: 'user-management',
            workflowId: `update-${Date.now()}`,
        });

        return res.status(200).json({ message: "User deletion  initiated", user });
    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).send("Server error");
    }
});


router.get('/', async (req: Request, res: Response) => {
    try {
        const token = await getToken();
        const response = await axios.get('https://kavinraj.us.auth0.com/api/v2/users', {
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
});


export default router

