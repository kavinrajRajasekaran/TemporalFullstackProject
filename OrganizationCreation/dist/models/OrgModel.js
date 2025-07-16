"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const OrgSchema = new mongoose_1.default.Schema({
    authid: {
        type: String,
    },
    name: {
        type: String,
        unique: true,
        required: true,
    },
    display_name: {
        type: String,
        required: true,
    },
    branding: {
        logo_url: {
            type: String,
        },
    },
    metadata: {
        createdByEmail: {
            type: String,
            required: true,
        },
        failureReason: {
            type: String,
        },
    },
    colors: {
        page_background: {
            type: String,
        },
        primary: {
            type: String,
        },
    },
    status: {
        type: String,
        enum: ['provisoning', 'updating', 'deleting', 'succeed', 'failure'],
    }
}, { timestamps: true });
// Export typed model
exports.OrgModel = mongoose_1.default.model('Organization', OrgSchema);
