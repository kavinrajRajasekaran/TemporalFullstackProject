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
const mailsender_1 = require("../../utils/mailsender");
const OrganizationModel_1 = require("../../models/OrganizationModel");
const mongoose_1 = __importDefault(require("mongoose"));
const auth0TokenGenerator_1 = require("../../utils/auth0TokenGenerator");
const axios_1 = __importDefault(require("axios"));
const auth0_1 = require("auth0");
const common_1 = require("@temporalio/common");
const AppError_1 = require("../../Errors/AppError");
function sendEmailToUserActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            yield (0, mailsender_1.sendEmail)(options);
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
                message: "Sending email to User Activity failed",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function OrganizationCreationInAuthActivity(Org) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
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
            const response = yield axios_1.default.request(config);
            return response.data.id;
        }
        catch (error) {
            let status;
            let errorData = null;
            if (error instanceof AppError_1.AppError) {
                status = error.status;
                errorData = { message: error.message };
            }
            else {
                status = (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.status) !== null && _e !== void 0 ? _e : 500;
                errorData = (_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) !== null && _g !== void 0 ? _g : null;
            }
            const details = {
                statusCode: status,
                errorData,
            };
            throw common_1.ApplicationFailure.create({
                nonRetryable: status >= 400 && status < 500,
                message: "organization creation in the  auth0 activity failed",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function OrganizationStatusUpdateInDBActivity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const orgDoc = yield OrganizationModel_1.OrganizationModel.findById(input.id);
            if (!orgDoc) {
                throw new AppError_1.AppError("organization not found", 404);
            }
            if (input.status) {
                orgDoc.status = input.status;
            }
            if (input.failureReason) {
                orgDoc.metadata.failureReason = input.failureReason;
            }
            if (input.authid) {
                orgDoc.authid = input.authid;
            }
            yield orgDoc.save();
            const org = orgDoc;
            return org;
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
                message: "status updation in the DB activity failed",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function UpdateOrganizationAuthActivity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const token = yield (0, auth0TokenGenerator_1.getAuth0Token)();
            let config = {
                method: 'patch',
                maxBodyLength: Infinity,
                url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations/${input.authid}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: JSON.stringify(input.update)
            };
            yield axios_1.default.request(config)
                .then((response) => {
                return response.data;
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
                message: "Error while updating the organization in auth0",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function deleteInAuth0Activity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            if (!id) {
                throw new AppError_1.AppError("Invalid Organization id", 400);
            }
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
                message: "Error while deleting oganization in the auth0",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function deleteInDBActivity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            let deletedOrg = yield OrganizationModel_1.OrganizationModel.findByIdAndDelete(new mongoose_1.default.Types.ObjectId(id));
            if (deletedOrg == null) {
                throw new AppError_1.AppError("orgaization not found", 404);
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
                message: "Error while deleting organization in database activity",
                details: [JSON.stringify(details)],
            });
        }
    });
}
function updateOrganizationInDBActivity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            let orgId = new mongoose_1.default.Types.ObjectId(input.id);
            let newOrganization = yield OrganizationModel_1.OrganizationModel.findByIdAndUpdate(orgId, input.organization);
            if (newOrganization == null) {
                throw new AppError_1.AppError("Organization not found", 404);
            }
            return newOrganization;
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
                message: "Error while creating user organization in database activity",
                details: [JSON.stringify(details)],
            });
        }
    });
}
