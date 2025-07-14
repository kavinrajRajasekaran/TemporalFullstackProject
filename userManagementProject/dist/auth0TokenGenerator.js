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
        //   TEST=kavinraj
        // JWT_SECRET='kavinraj'
        // DB_URI=mongodb+srv://kavin25042003:Kavin%402003@cluster0.7b5gb.mongodb.net/usermanagement
        // AUTH0_TOKEN_URL=https://kavinraj.us.auth0.com/oauth/token
        // AUTH0_CLIENT_SECRET=d2Jd1fYLb3pixxUiSbKuxBDPzY12z5v6
        // AUTH0_CLIENT_ID=VPhc7gTj4UqQ9m0iS8P1sEpqHyyKIrQA3C5ubfxRrF8K-CDqK-1rNgK97VBAROE-
        // GRANT_TYPE=client_credentials
        // AUTH0_AUDIENCE=https://kavinraj.us.auth0.com/api/v2/
        try {
            const response = yield fetch(process.env.AUTH0_TOKEN_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    "client_id": process.env.AUTH0_CLIENT_ID,
                    "client_secret": process.env.AUTH0_CLIENT_SECRET,
                    "audience": process.env.AUTH0_AUDIENCE,
                    "grant_type": process.env.GRANT_TYPE
                }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = yield response.json();
            cachedToken = data.access_token;
            tokenExpiry = now + data.expires_in * 1000;
            return cachedToken;
        }
        catch (error) {
            console.error('Error fetching token:', error);
        }
    });
}
