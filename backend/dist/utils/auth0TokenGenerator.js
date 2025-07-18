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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth0Token = getAuth0Token;
let cachedToken = null;
let tokenExpiry = 0; // Unix timestamp in ms
function getAuth0Token() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        // If token exists and not expired, reuse it
        if (cachedToken && now < tokenExpiry - 60 * 1000) {
            return cachedToken;
        }
        try {
            const response = yield fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    "client_id": process.env.AUTH0_CLIENT_ID,
                    "client_secret": process.env.AUTH0_CLIENT_SECRET,
                    "audience": `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
                    "grant_type": "client_credentials"
                }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = yield response.json();
            return data.access_token;
        }
        catch (error) {
            console.error('Error fetching token:', error);
        }
    });
}
