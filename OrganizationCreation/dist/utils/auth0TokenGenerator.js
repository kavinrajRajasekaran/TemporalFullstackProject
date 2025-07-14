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
exports.getToken = getToken;
let cachedToken = null;
let tokenExpiry = 0; // Unix timestamp in ms
function getToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        // If token exists and not expired, reuse it
        if (cachedToken && now < tokenExpiry - 60 * 1000) {
            return cachedToken;
        }
        try {
            const response = yield fetch('https://dev-z5htpfd1ttgn2n0d.us.auth0.com/oauth/token', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    "client_id": "dpNlNcUhHplzzCdQsMHopXpRj61v8odJ",
                    "client_secret": "ZIVZ8MszY8AyhwQy6XyXusG8H-3cu3t3ZR0QVHYgtOrq8dFpbM5VV6NLEnDf0i9c",
                    "audience": "https://dev-z5htpfd1ttgn2n0d.us.auth0.com/api/v2/",
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
