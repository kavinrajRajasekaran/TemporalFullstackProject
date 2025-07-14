"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Make sure this is set in your .env or replace with a constant in dev
const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';
function generateToken(userId) {
    const payload = { userId };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (_a) {
        return false;
    }
}
