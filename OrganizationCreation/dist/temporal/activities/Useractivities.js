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
                throw common_1.ApplicationFailure.create({
                    nonRetryable: false,
                    message: "error while creation of the user in auth0",
                    details: [((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
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
                throw common_1.ApplicationFailure.create({
                    nonRetryable: false,
                    message: "error while updation status of the user in auth0",
                    details: [((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
        }
    });
}
function updateUserInAuth0(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
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
            console.log(`Auth0 user ${input.authId} updated`);
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while updation status of the user in auth0",
                    details: [((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: false,
                    message: "error while updation status of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
        }
    });
}
function deleteUserInAuth0(authId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
            yield axios_1.default.delete(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "error while deletion of the user in auth0",
                    details: [((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: false,
                    message: "error while deletion of the user in auth0",
                    details: [((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
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
                throw common_1.ApplicationFailure.create({
                    nonRetryable: false,
                    message: "error while deletion of the user in auth0",
                    details: [((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
        }
    });
}
