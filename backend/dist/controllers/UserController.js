"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserController = createUserController;
exports.UpdateUserController = UpdateUserController;
exports.getAllUserController = getAllUserController;
exports.deleteUserController = deleteUserController;
const userModel_1 = require("../models/userModel");
const TemporalClient_1 = require("../temporal/TemporalClient");
const UserWorkflows_1 = require("../temporal/workflows/UserWorkflows");
const handleControllerError_1 = require("../Errors/handleControllerError");
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const auth0TokenGenerator_1 = require("../utils/auth0TokenGenerator");
const mailsender_1 = require("../utils/mailsender");
const shared_1 = require("../utils/shared");
function createUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, name, password } = req.body;
            if (!email || !name || !password) {
                let missingFields = [];
                if (!email)
                    missingFields.push("email");
                if (!name || !name.trim())
                    missingFields.push("name");
                if (!password)
                    missingFields.push("password");
                res.status(400).json({
                    message: "Invalid data",
                    misssingFields: missingFields
                });
                return;
            }
            if (!name.trim()) {
                return res.status(400).send("Invalid user name");
            }
            if (!(0, shared_1.isStrongPassword)(password)) {
                return res.status(400).send("Invalid password. It must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.");
            }
            if (!(0, mailsender_1.isValidEmail)(email)) {
                res.status(400).send("Enter a valid email");
            }
            let user = yield userModel_1.UserModel.findOne({ email: email.toLowerCase() });
            if (user) {
                res.status(409).json("User already exists");
                return;
            }
            let Newuser = yield userModel_1.UserModel.create({
                name: name.toLowerCase(),
                email: email.toLowerCase(),
                password: password
            });
            let temporalClient = yield (0, TemporalClient_1.TemporalClient)();
            yield temporalClient.workflow.start(UserWorkflows_1.UserSignupWorkflow, {
                taskQueue: 'user-management',
                workflowId: `signup-${Newuser._id}`,
                args: [Newuser.name, Newuser.email, Newuser.password, Newuser._id],
            });
            Newuser.password = undefined;
            res.status(200).json(Newuser);
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "User creation failed");
        }
    });
}
function UpdateUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, password } = req.body;
            if (!name && !password) {
                res.status(400).json({
                    message: "There is no field given to update"
                });
                return;
            }
            let userId;
            try {
                userId = new mongoose_1.default.Types.ObjectId(req.params.id);
            }
            catch (e) {
                return res.status(400).send('Invalid user id');
            }
            const updateFields = {};
            if (name)
                updateFields.name = name;
            if (password)
                updateFields.password = password;
            const user = yield userModel_1.UserModel.findByIdAndUpdate(userId, updateFields, {
                new: true,
            }).select('-password');
            if (!user) {
                res.status(404).send("User not found");
                return;
            }
            if (!user.authId) {
                res.status(500).send("authId is missing for this user.");
                return;
            }
            const client = yield (0, TemporalClient_1.TemporalClient)();
            yield client.workflow.start(UserWorkflows_1.UserUpdateWorkflow, {
                args: [user.authId, user._id, name, password],
                startDelay: "10 seconds",
                taskQueue: 'user-management',
                workflowId: `update-${Date.now()}`,
            });
            res.status(200).json({ message: "User update initiated", user });
            return;
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "Updating the user failed");
        }
    });
}
function getAllUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
            const response = yield axios_1.default.get(`https:${process.env.AUTH0_DOMAIN}/api/v2/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            res.status(200).json(response.data);
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "Failed to fetch users from Auth0");
        }
    });
}
function deleteUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userId = new mongoose_1.default.Types.ObjectId(req.params.id);
            const user = yield userModel_1.UserModel.findByIdAndUpdate(userId, { status: "deleting" }, {
                new: true,
            }).select("-password");
            if (!user) {
                return res.status(404).send("User not found");
            }
            if (!user.authId) {
                return res.status(400).send("authId is missing for this user.");
            }
            const client = yield (0, TemporalClient_1.TemporalClient)();
            yield client.workflow.start(UserWorkflows_1.deleteUserInfoWorkflow, {
                args: [user.authId, user._id],
                taskQueue: 'user-management',
                workflowId: `delete-${Date.now()}`,
            });
            res.status(200).json({ message: "User deletion  initiated" });
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "Deletion of user failed");
        }
    });
}
