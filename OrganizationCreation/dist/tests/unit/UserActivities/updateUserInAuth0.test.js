"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const axios_1 = __importDefault(require("axios"));
const tokenModule = __importStar(require("../../../utils/auth0TokenGenerator"));
const common_1 = require("@temporalio/common");
const Useractivities_1 = require("../../../temporal/activities/Useractivities");
describe('updateUserInAuth0', () => {
    const authId = 'auth0|user123';
    let tokenStub;
    let patchStub;
    beforeEach(() => {
        tokenStub = sinon_1.default.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
        patchStub = sinon_1.default.stub(axios_1.default, 'patch');
    });
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('updates user successfully when valid fields are provided', () => __awaiter(void 0, void 0, void 0, function* () {
        patchStub.resolves({ status: 200 });
        yield (0, Useractivities_1.updateUserInAuth0)({ authId, name: 'John Doe', password: 'secret' });
        (0, assert_1.default)(tokenStub.calledOnce);
        (0, assert_1.default)(patchStub.calledOnceWith(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`, { name: 'John Doe', password: 'secret' }, sinon_1.default.match.hasNested('headers.Authorization', 'Bearer mock-token')));
    }));
    it('throws error when no fields are provided to update', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, Useractivities_1.updateUserInAuth0)({ authId });
            assert_1.default.fail('Expected error');
        }
        catch (err) {
            assert_1.default.strictEqual(err.message, 'No fields provided to update.');
        }
    }));
    it('throws non-retryable ApplicationFailure for 4xx error', () => __awaiter(void 0, void 0, void 0, function* () {
        patchStub.rejects({
            response: {
                status: 400,
                data: { message: 'Bad Request' }
            },
            message: 'Bad Request'
        });
        try {
            yield (0, Useractivities_1.updateUserInAuth0)({ authId, name: 'John' });
            assert_1.default.fail('Expected ApplicationFailure');
        }
        catch (err) {
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.message, 'error while updation status of the user in auth0');
        }
    }));
    it('rethrows error for 5xx error (retryable)', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: {
                status: 500,
                data: { message: 'Internal Server Error' }
            },
            message: 'Internal Server Error'
        };
        patchStub.rejects(error);
        try {
            yield (0, Useractivities_1.updateUserInAuth0)({ authId, name: 'Jane' });
            assert_1.default.fail('Expected retryable error');
        }
        catch (err) {
            (0, assert_1.default)(!(err instanceof common_1.ApplicationFailure));
            assert_1.default.strictEqual(err.response.status, 500);
        }
    }));
});
