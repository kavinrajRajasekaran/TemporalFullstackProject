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
exports.userCreationInAuth0 = userCreationInAuth0;
exports.updateUserStatusInDB = updateUserStatusInDB;
exports.updateUserInAuth0 = updateUserInAuth0;
exports.deleteUserInAuth0 = deleteUserInAuth0;
exports.deleteUserInDb = deleteUserInDb;
const userModel_1 = require("../utils/userModel");
const axios_1 = __importDefault(require("axios"));
const auth0TokenGenerator_1 = require("../utils/auth0TokenGenerator");
const db_1 = require("../utils/db");
const common_1 = require("@temporalio/common");
(0, db_1.connectToMongo)();
function userCreationInAuth0(name, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const token = yield (0, auth0TokenGenerator_1.getToken)();
        try {
            const res = yield axios_1.default.post(process.env.AUTH0_URL, {
                name: name,
                email: email,
                password: password,
                connection: 'Username-Password-Authentication'
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data.user_id;
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            console.error(' Auth0 creation failed:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while creation of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
function updateUserStatusInDB(userId, statusValue, failureReason, authId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const update = {
                status: statusValue,
            };
            if (failureReason)
                update.failureReason = failureReason;
            if (authId)
                update.authId = authId;
            const user = yield userModel_1.UserModel.findByIdAndUpdate(userId, update, {
                new: true,
            });
            if (!user) {
                console.warn(`User with ID ${userId} not found`);
            }
            return user;
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            console.error(' Auth0 status update failed:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while updation status of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
function updateUserInAuth0(authId, name, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const token = yield (0, auth0TokenGenerator_1.getToken)();
        const updateFields = {};
        if (name)
            updateFields.name = name;
        if (password)
            updateFields.password = password;
        if (Object.keys(updateFields).length === 0) {
            throw new Error('No fields provided to update.');
        }
        try {
            yield axios_1.default.patch(`${process.env.AUTH0_URL}/${authId}`, updateFields, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log(`Auth0 user ${authId} updated`);
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            console.error(' Auth0 status update failed:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while updation status of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
function deleteUserInAuth0(authId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const token = yield (0, auth0TokenGenerator_1.getToken)();
        try {
            yield axios_1.default.delete(`https://kavinraj.us.auth0.com/api/v2/users/${authId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            console.log(`Auth0 user ${authId} updated`);
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            console.error(' Auth0 deletion failed:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while deletion of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
function deleteUserInDb(authId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            yield userModel_1.UserModel.findOneAndDelete({ authId: authId });
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            console.error(' Auth0 deletion failed:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while deletion of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
