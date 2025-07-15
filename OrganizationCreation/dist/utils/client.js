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
exports.getClient = getClient;
exports.deleter = deleter;
exports.getAll = getAll;
const client_1 = require("@temporalio/client");
const auth0_1 = require("auth0");
let temporalClient = null;
function getClient() {
    return __awaiter(this, void 0, void 0, function* () {
        if (temporalClient)
            return temporalClient;
        // Connects to localhost:7233 by default
        const connection = yield client_1.Connection.connect();
        temporalClient = new client_1.Client({ connection });
        return temporalClient;
    });
}
function deleter(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const management = new auth0_1.ManagementClient({
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            domain: process.env.AUTH0_DOMAIN,
        });
        const result = yield management.organizations.delete({
            id: id
        });
    });
}
function getAll() {
    return __awaiter(this, void 0, void 0, function* () {
        const management = new auth0_1.ManagementClient({
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            domain: process.env.AUTH0_DOMAIN,
        });
        const result = yield management.organizations.getAll();
        return result;
    });
}
