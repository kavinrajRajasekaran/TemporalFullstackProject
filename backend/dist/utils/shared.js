"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStrongPassword = isStrongPassword;
function isStrongPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
}
