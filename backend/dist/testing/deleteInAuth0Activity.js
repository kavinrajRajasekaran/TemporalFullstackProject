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
const OrganizationActivities_1 = require("../temporal/activities/OrganizationActivities");
const auth0 = __importStar(require("auth0"));
describe('deleteInAuth0Activity', () => {
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('completes successfully when delete does not throw', () => __awaiter(void 0, void 0, void 0, function* () {
        const deleteStub = sinon_1.default.stub().resolves();
        const fakeClient = {
            organizations: {
                delete: deleteStub,
            },
        };
        sinon_1.default.stub(auth0, 'ManagementClient').returns(fakeClient);
        const env = new testing_1.MockActivityEnvironment();
        yield env.run(OrganizationActivities_1.deleteInAuth0Activity, 'org-id-123');
        (0, assert_1.default)(deleteStub.calledOnceWith({ id: 'org-id-123' }));
    }));
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: { status: 404, data: { message: 'Not Found' } },
            message: 'Delete failed',
        };
        const mockOrgDelete = sinon_1.default.stub().rejects(error);
        const fakeClient = {
            organizations: {
                delete: mockOrgDelete,
            },
        };
        sinon_1.default.stub(auth0, 'ManagementClient').returns(fakeClient);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.deleteInAuth0Activity, 'org-id-123'), (err) => {
            var _a;
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.type, 'HttpErorr');
            const detail = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
            (0, assert_1.default)(detail !== undefined, 'Expected error details[0] to be present');
            assert_1.default.strictEqual(detail.statusCode, 404);
            assert_1.default.strictEqual(detail.responseData.message, 'Not Found');
            assert_1.default.strictEqual(detail.originalMessage, 'Delete failed');
            return true;
        });
    }));
    it('throws retryable ApplicationFailure for 5xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: { status: 500, data: { message: 'Server Error' } },
            message: 'Delete failed',
        };
        const mockOrgDelete = sinon_1.default.stub().rejects(error);
        const fakeClient = {
            organizations: {
                delete: mockOrgDelete,
            },
        };
        sinon_1.default.stub(auth0, 'ManagementClient').returns(fakeClient);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.deleteInAuth0Activity, 'org-id-123'), (err) => {
            var _a;
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, false);
            assert_1.default.strictEqual(err.type, 'HttpErorr');
            const detail = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
            (0, assert_1.default)(detail !== undefined, 'Expected error details[0] to be present');
            assert_1.default.strictEqual(detail.statusCode, 500);
            assert_1.default.strictEqual(detail.responseData.message, 'Server Error');
            assert_1.default.strictEqual(detail.originalMessage, 'Delete failed');
            return true;
        });
    }));
});
// import { MockActivityEnvironment } from '@temporalio/testing';
// import assert from 'assert';
// import sinon from 'sinon';
// import { ApplicationFailure } from '@temporalio/common';
// import { deleteInAuth0Activity } from '../temporal//activities';
// import { ManagementClient } from 'auth0';
// describe('deleteInAuth0Activity', () => {
//   afterEach(() => {
//     sinon.restore();
//   });
// it('throws non-retryable ApplicationFailure for 4xx errors', async () => {
//   const error = {
//     response: { status: 404, data: { message: 'Not Found' } },
//     message: 'Delete failed'
//   };
//   sinon.stub(ManagementClient.prototype, 'organizations').value({
//     delete: sinon.stub().rejects(error)
//   });
//   const env = new MockActivityEnvironment();
//   await assert.rejects(
//     env.run(deleteInAuth0Activity, 'org-id-123'),
//     (err: any) => {
//       assert(err instanceof ApplicationFailure);
//       assert.strictEqual(err.nonRetryable, true);
//       assert.strictEqual(err.type, 'HttpErorr');
//       const detail = err.details?.[0] as {
//         statusCode: number;
//         responseData: { message: string };
//         originalMessage: string;
//       };
//       assert(detail !== undefined, 'Expected error details[0] to be present');
//       assert.strictEqual(detail.statusCode, 404);
//       assert.strictEqual(detail.responseData.message, 'Not Found');
//       assert.strictEqual(detail.originalMessage, 'Delete failed');
//       return true;
//     }
//   );
// });
// it('throws retryable ApplicationFailure for 5xx errors', async () => {
//   const error = {
//     response: { status: 500, data: { message: 'Server Error' } },
//     message: 'Delete failed'
//   };
//   sinon.stub(ManagementClient.prototype, 'organizations').value({
//     delete: sinon.stub().rejects(error)
//   });
//   const env = new MockActivityEnvironment();
//   await assert.rejects(
//     env.run(deleteInAuth0Activity, 'org-id-123'),
//     (err: any) => {
//       assert(err instanceof ApplicationFailure);
//       assert.strictEqual(err.nonRetryable, false); 
//       assert.strictEqual(err.type, 'HttpErorr');
//       const detail = err.details?.[0] as {
//         statusCode: number;
//         responseData: { message: string };
//         originalMessage: string;
//       };
//       assert(detail !== undefined, 'Expected error details[0] to be present');
//       assert.strictEqual(detail.statusCode, 500); 
//       assert.strictEqual(detail.responseData.message, 'Server Error');
//       assert.strictEqual(detail.originalMessage, 'Delete failed');
//       return true;
//     }
//   );
// });
// })
