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
const userModel_1 = require("./utils/userModel");
const client_1 = require("./temporal/client");
const workflows_1 = require("./temporal/workflows");
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const auth0TokenGenerator_1 = require("./utils/auth0TokenGenerator");
function createUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, name, password } = req.body;
        if (!email || !name || !password) {
            res.status(400).json({
                "error": "invalid fields"
            });
            return;
        }
        try {
            let user = yield userModel_1.UserModel.findOne({ email });
            if (user) {
                res.status(409).json("User already exists");
                return;
            }
        }
        catch (err) {
            res.status(500).send({ "error": err.message });
            return;
        }
        let user = yield userModel_1.UserModel.create({
            name: name,
            email,
            password
        });
        // user.password=undefined
        let temporalClient = yield (0, client_1.getTemporalClient)();
        yield temporalClient.workflow.start(workflows_1.UserSignupWorkflow, {
            taskQueue: 'user-management',
            startDelay: "1 minutes",
            workflowId: `signup-${user._id}`,
            args: [user.name, user.email, user.password, user._id],
        });
        res.status(200).json(user);
    });
}
function UpdateUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, password } = req.body;
        if (!name || !password) {
            res.status(400).json({
                message: "misssing input fields"
            });
            return;
        }
        try {
            const userId = new mongoose_1.default.Types.ObjectId(req.params.id);
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
            const client = yield (0, client_1.getTemporalClient)();
            yield client.workflow.start(workflows_1.UserUpdateWorkflow, {
                args: [user.authId, user._id, name, password],
                startDelay: "10 seconds",
                taskQueue: 'user-management',
                workflowId: `update-${Date.now()}`,
            });
            res.status(200).json({ message: "User update initiated", user });
            return;
        }
        catch (error) {
            console.error('Update error:', error);
            res.status(500).send("Server error");
            return;
        }
    });
}
function getAllUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAUth0Token)();
            const response = yield axios_1.default.get(`https:${process.env.AUTH0_DOMAIN}/api/v2/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            res.status(200).json(response.data);
        }
        catch (error) {
            console.error(' Error fetching users from Auth0:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            res.status(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500).json({
                message: 'Failed to fetch users from Auth0',
                details: ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message,
            });
        }
    });
}
function deleteUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let userId = new mongoose_1.default.Types.ObjectId(req.params.id);
        try {
            const user = yield userModel_1.UserModel.findByIdAndUpdate(userId, { status: "deleting" }, {
                new: true,
            }).select("-password");
            if (!user) {
                return res.status(404).send("User not found");
            }
            if (!user.authId) {
                return res.status(500).send("authId is missing for this user.");
            }
            const client = yield (0, client_1.getTemporalClient)();
            yield client.workflow.start(workflows_1.deleteUserInfoWorkflow, {
                args: [user.authId, user._id],
                startDelay: "1 minutes",
                taskQueue: 'user-management',
                workflowId: `delete-${Date.now()}`,
            });
            return res.status(200).json({ message: "User deletion  initiated" });
        }
        catch (error) {
            return res.status(500).send("Server error");
        }
    });
}
