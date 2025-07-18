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
const testing_1 = require("@temporalio/testing");
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const common_1 = require("@temporalio/common");
const OrganizationActivities_1 = require("../../../temporal/activities/OrganizationActivities");
const axios_1 = __importDefault(require("axios"));
const tokenModule = __importStar(require("../../../utils/auth0TokenGenerator"));
describe('OrganizationCreationInAuthActivity', () => {
    afterEach(() => {
        sinon_1.default.restore();
    });
    const org = {
        name: 'TestOrg',
        status: 'provisoning',
        display_name: 'Test Organization',
        branding: { logo_url: 'logo.png' },
        metadata: {
            "createdByEmail": "test@email"
        },
        colors: { primary: '#000', page_background: '#fff' }
    };
    it('returns organization id on success', () => __awaiter(void 0, void 0, void 0, function* () {
        sinon_1.default.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
        sinon_1.default.stub(axios_1.default, 'request').resolves({ data: { id: 'org-123' } });
        const env = new testing_1.MockActivityEnvironment();
        const result = yield env.run(OrganizationActivities_1.OrganizationCreationInAuthActivity, org);
        assert_1.default.strictEqual(result, 'org-123');
    }));
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        sinon_1.default.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
        const error = {
            response: { status: 400, data: { message: 'Bad Request' } },
            message: 'Creation failed'
        };
        sinon_1.default.stub(axios_1.default, 'request').rejects(error);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.OrganizationCreationInAuthActivity, org), (err) => {
            if (err instanceof common_1.ApplicationFailure) {
                assert_1.default.strictEqual(err.nonRetryable, true);
                assert_1.default.strictEqual(err.message, 'organization creation in the  auth0 activity failed');
                if (err.details && err.details[0]) {
                    (0, assert_1.default)(err.details[0].includes('Bad Request'));
                }
                return true;
            }
            return false;
        });
    }));
    it('rethrows error for 5xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        sinon_1.default.stub(tokenModule, 'getAuth0Token').resolves('mock-token');
        const error = {
            response: { status: 500, data: { message: 'Server Error' } },
            message: 'Creation failed'
        };
        sinon_1.default.stub(axios_1.default, 'request').rejects(error);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.OrganizationCreationInAuthActivity, org), (err) => {
            assert_1.default.strictEqual(err, error);
            return true;
        });
    }));
    it('rethrows error if getAuth0Token fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = new Error('Token fetch failed');
        sinon_1.default.stub(tokenModule, 'getAuth0Token').rejects(error);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.OrganizationCreationInAuthActivity, org), (err) => {
            assert_1.default.strictEqual(err, error);
            return true;
        });
    }));
});
