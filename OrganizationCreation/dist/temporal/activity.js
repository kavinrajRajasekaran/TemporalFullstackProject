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
exports.sendEmailActivity = sendEmailActivity;
exports.OrgCreateActivity = OrgCreateActivity;
exports.statusUpdateActivity = statusUpdateActivity;
exports.updateActivity = updateActivity;
exports.deleteActivity = deleteActivity;
exports.deleteInDBActivity = deleteInDBActivity;
const mailsender_1 = require("../utils/mailsender");
const OrgModel_1 = require("../utils/OrgModel");
const mongoose_1 = __importDefault(require("mongoose"));
const auth0TokenGenerator_1 = require("../utils/auth0TokenGenerator");
const axios_1 = __importDefault(require("axios"));
const client_1 = require("../utils/client");
const common_1 = require("@temporalio/common");
function sendEmailActivity(content) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            yield (0, mailsender_1.sendEmail)(content);
        }
        catch (error) {
            const statusCode = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `Failed to send email ${statusCode}`,
                type: "EmailErorr",
                nonRetryable: statusCode >= 400 && statusCode < 500,
            });
        }
    });
}
function OrgCreateActivity(Org) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
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
            const statusCode = (_d = error.response) === null || _d === void 0 ? void 0 : _d.status;
            throw common_1.ApplicationFailure.create({
                message: `Error while creating an organization ${statusCode}`,
                type: "HttpErorr",
                nonRetryable: statusCode >= 400 && statusCode < 500,
            });
        }
    });
}
function statusUpdateActivity(id, status, failureReason, authid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orgDoc = yield OrgModel_1.OrgModel.findById(id);
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
        catch (err) {
            throw new Error(`Error while updating the status: ${err.message}`);
        }
    });
}
function updateActivity(id, update) {
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
            var _a;
            const statusCode = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `Failed to update the org in the Auth0 ${statusCode}`,
                type: "HttpErorr",
                nonRetryable: statusCode >= 400 && statusCode < 500,
            });
        });
    });
}
function deleteActivity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            yield (0, client_1.deleter)(id);
        }
        catch (error) {
            const statusCode = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `Error while deleting the org in the Auth0 ${statusCode}`,
                type: "HttpErorr",
                nonRetryable: statusCode >= 400 && statusCode < 500,
            });
        }
    });
}
function deleteInDBActivity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            yield OrgModel_1.OrgModel.findByIdAndDelete(new mongoose_1.default.Types.ObjectId(id));
        }
        catch (error) {
            const statusCode = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            throw common_1.ApplicationFailure.create({
                message: `error while deleting in DB ${statusCode}`,
                type: "DatabaseError",
                nonRetryable: statusCode >= 400 && statusCode < 500,
            });
        }
    });
}
