"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    authId: { type: String },
    status: {
        type: String,
        enum: ['provisioning', 'updating', 'deleting', 'succeed', 'failed'],
        default: 'provisioning',
    },
    failureReason: { type: String },
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
