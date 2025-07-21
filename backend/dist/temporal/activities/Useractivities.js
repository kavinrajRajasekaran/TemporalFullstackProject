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
const userModel_1 = require("../../models/userModel");
const axios_1 = __importDefault(require("axios"));
const auth0TokenGenerator_1 = require("../../utils/auth0TokenGenerator");
const common_1 = require("@temporalio/common");
const AppError_1 = require("../../Errors/AppError");
function userCreationInAuth0(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
            const res = yield axios_1.default.post(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
                name: input.name,
                email: input.email,
                password: input.password,
                connection: 'Username-Password-Authentication'
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data.user_id;
        }
        catch (error) {
            let status;
            let errorData = null;
            if (error instanceof AppError_1.AppError) {
                status = error.status;
                errorData = { message: error.message };
            }
            else {
                status = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 500;
                errorData = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : null;
            }
            const details = {
                statusCode: status,
                errorData,
            };
            throw common_1.ApplicationFailure.create({
                nonRetryable: status >= 400 && status < 500,
                message: "Error while creating user status in Auth0",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function updateUserStatusInDB(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const update = {
                status: input.statusValue,
            };
            if (input.failureReason)
                update.failureReason = input.failureReason;
            if (input.authId)
                update.authId = input.authId;
            const user = yield userModel_1.UserModel.findByIdAndUpdate(input.userId, update, {
                new: true,
            });
            if (!user) {
                throw new AppError_1.AppError("user not found in database", 404);
            }
            return user;
        }
        catch (error) {
            let status;
            let errorData = null;
            if (error instanceof AppError_1.AppError) {
                status = error.status;
                errorData = { message: error.message };
            }
            else {
                status = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 500;
                errorData = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : null;
            }
            const details = {
                statusCode: status,
                errorData,
            };
            throw common_1.ApplicationFailure.create({
                nonRetryable: status >= 400 && status < 500,
                message: "Error while updating user status in database",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function updateUserInAuth0(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
            const updateFields = {};
            if (input.name)
                updateFields.name = input.name;
            if (input.password)
                updateFields.password = input.password;
            if (Object.keys(updateFields).length === 0) {
                throw new AppError_1.AppError('No fields provided to update.', 400);
            }
            yield axios_1.default.patch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${input.authId}`, updateFields, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        }
        catch (error) {
            let status;
            let errorData = null;
            if (error instanceof AppError_1.AppError) {
                status = error.status;
                errorData = { message: error.message };
            }
            else {
                status = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 500;
                errorData = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : null;
            }
            const details = {
                statusCode: status,
                errorData,
            };
            throw common_1.ApplicationFailure.create({
                nonRetryable: status >= 400 && status < 500,
                message: "Error while updating user status in auth0",
                details: [JSON.stringify(details)]
            });
        }
    });
}
function deleteUserInAuth0(authId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
            yield axios_1.default.delete(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
        }
        catch (error) {
            let status;
            let errorData = null;
            if (error instanceof AppError_1.AppError) {
                status = error.status;
                errorData = { message: error.message }; // or leave as null
            }
            else {
                status = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 500;
                errorData = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : null;
            }
            const details = {
                statusCode: status,
                errorData,
            };
            throw common_1.ApplicationFailure.create({
                nonRetryable: status >= 400 && status < 500,
                message: "Error while deleting user status in auth0",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function deleteUserInDb(authId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            let deletedUser = yield userModel_1.UserModel.findOneAndDelete({ authId: authId });
            if (!deletedUser) {
                throw new AppError_1.AppError("user not found in the database ", 404);
            }
        }
        catch (error) {
            let status;
            let errorData = null;
            if (error instanceof AppError_1.AppError) {
                status = error.status;
                errorData = { message: error.message };
            }
            else {
                status = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 500;
                errorData = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : null;
            }
            const details = {
                statusCode: status,
                errorData,
            };
            throw common_1.ApplicationFailure.create({
                nonRetryable: status >= 400 && status < 500,
                message: "Error while deleting user in database",
                details: [JSON.stringify(details)],
            });
        }
    });
}
