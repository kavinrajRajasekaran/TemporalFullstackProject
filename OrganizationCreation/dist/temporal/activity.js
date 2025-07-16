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
exports.sendEmailToUserActivity = sendEmailToUserActivity;
exports.OrganizationCreationInAuthActivity = OrganizationCreationInAuthActivity;
exports.OrganizationStatusUpdateInDBActivity = OrganizationStatusUpdateInDBActivity;
exports.UpdateOrganizationAuthActivity = UpdateOrganizationAuthActivity;
exports.deleteInAuth0Activity = deleteInAuth0Activity;
exports.deleteInDBActivity = deleteInDBActivity;
exports.updateOrganizationInDBActivity = updateOrganizationInDBActivity;
const mailsender_1 = require("../utils/mailsender");
const OrganizationModel_1 = require("../models/OrganizationModel");
const mongoose_1 = __importDefault(require("mongoose"));
const auth0TokenGenerator_1 = require("../utils/auth0TokenGenerator");
const axios_1 = __importDefault(require("axios"));
const auth0_1 = require("auth0");
const common_1 = require("@temporalio/common");
function sendEmailToUserActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            yield (0, mailsender_1.sendEmail)(options);
        }
        catch (error) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const isNonRetryable = status >= 400 && status < 500;
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "Sending email to User Activity failed",
                    details: [((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
function OrganizationCreationInAuthActivity(Org) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const token = yield (0, auth0TokenGenerator_1.getToken)();
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: JSON.stringify({
                "name": Org.name,
                "display_name": Org.display_name,
                "branding": {
                    "logo_url": (_a = Org.branding) === null || _a === void 0 ? void 0 : _a.logo_url,
                    "colors": {
                        "primary": (_b = Org.colors) === null || _b === void 0 ? void 0 : _b.primary,
                        "page_background": (_c = Org.colors) === null || _c === void 0 ? void 0 : _c.page_background
                    }
                }
            })
        };
        try {
            const response = yield axios_1.default.request(config);
            return response.data.id;
        }
        catch (error) {
            const status = (_d = error.response) === null || _d === void 0 ? void 0 : _d.status;
            const isNonRetryable = status >= 400 && status < 500;
            if (isNonRetryable) {
                throw common_1.ApplicationFailure.create({
                    nonRetryable: true,
                    message: "organization creation in the db auth0 activity failed",
                    details: [((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) ? JSON.stringify(error.response.data) : undefined]
                });
            }
            else {
                throw error;
            }
        }
    });
}
function OrganizationStatusUpdateInDBActivity(id, status, failureReason, authid) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const orgDoc = yield OrganizationModel_1.OrganizationModel.findById(id);
            if (!orgDoc) {
                throw new Error('Organization not found');
            }
            if (status) {
                orgDoc.status = status;
            }
            if (failureReason) {
                orgDoc.metadata.failureReason = failureReason;
            }
            if (authid) {
                orgDoc.authid = authid;
            }
            yield orgDoc.save();
            const org = orgDoc.toObject();
            return org;
        }
        catch (error) {
            const statusCode = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `status updation in the DB activity failed ${statusCode}`,
                type: 'DBError',
                nonRetryable: statusCode >= 400 && statusCode < 500,
                details: [{
                        statusCode,
                        responseData: (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null,
                        originalMessage: error.message,
                    }],
            });
        }
    });
}
function UpdateOrganizationAuthActivity(id, update) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield (0, auth0TokenGenerator_1.getToken)();
        let config = {
            method: 'patch',
            maxBodyLength: Infinity,
            url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations/${id}`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: JSON.stringify(update)
        };
        yield axios_1.default.request(config)
            .then((response) => {
            return response.data;
        })
            .catch((error) => {
            var _a, _b, _c;
            const statusCode = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `Error while updating the organization in auth0 ${statusCode}`,
                type: 'HttpError',
                nonRetryable: statusCode >= 400 && statusCode < 500,
                details: [{
                        statusCode,
                        responseData: (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null,
                        originalMessage: error.message,
                    }],
            });
        });
    });
}
function deleteInAuth0Activity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const management = new auth0_1.ManagementClient({
                clientId: process.env.AUTH0_CLIENT_ID,
                clientSecret: process.env.AUTH0_CLIENT_SECRET,
                domain: process.env.AUTH0_DOMAIN,
            });
            yield management.organizations.delete({
                id: id
            });
        }
        catch (error) {
            const statusCode = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `Error while deleting oganization in the auth0 ${statusCode}`,
                type: 'HttpError',
                nonRetryable: statusCode >= 400 && statusCode < 500,
                details: [{
                        statusCode,
                        responseData: (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null,
                        originalMessage: error.message,
                    }],
            });
        }
    });
}
function deleteInDBActivity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            yield OrganizationModel_1.OrganizationModel.findByIdAndDelete(new mongoose_1.default.Types.ObjectId(id));
        }
        catch (error) {
            const statusCode = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500;
            throw common_1.ApplicationFailure.create({
                message: `Error while deleting organization in database activity ${statusCode}`,
                type: 'DBErorr',
                nonRetryable: statusCode >= 400 && statusCode < 500,
                details: [{
                        statusCode,
                        responseData: (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null,
                        originalMessage: error.message,
                    }],
            });
        }
    });
}
function updateOrganizationInDBActivity(organization, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            let newOrganization = yield OrganizationModel_1.OrganizationModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), organization);
            return newOrganization || undefined;
        }
        catch (error) {
            const statusCode = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500;
            throw common_1.ApplicationFailure.create({
                message: `Error while creating user organization in database activity ${statusCode}`,
                type: 'DBErorr',
                nonRetryable: statusCode >= 400 && statusCode < 500,
                details: [{
                        statusCode,
                        responseData: (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null,
                        originalMessage: error.message,
                    }],
            });
        }
    });
}
