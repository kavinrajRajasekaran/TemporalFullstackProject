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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@temporalio/testing");
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const common_1 = require("@temporalio/common");
const proxyquire_1 = __importDefault(require("proxyquire"));
describe('deleteInAuth0Activity', () => {
    let deleteStub;
    const setupActivityWithStub = (stubbedDelete) => {
        const fakeClient = {
            organizations: {
                delete: stubbedDelete,
            },
        };
        // Replace the auth0.ManagementClient constructor
        const { deleteInAuth0Activity } = (0, proxyquire_1.default)('../../../temporal/activities/OrganizationActivities', {
            auth0: {
                ManagementClient: function () {
                    return fakeClient;
                },
            },
        });
        return deleteInAuth0Activity;
    };
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        deleteStub = sinon_1.default.stub().rejects({
            response: { status: 404, data: { message: 'Not Found' } },
            message: 'Delete failed',
        });
        const deleteInAuth0Activity = setupActivityWithStub(deleteStub);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(deleteInAuth0Activity, 'org-id-123'), (err) => {
            var _a;
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.type, 'HttpErorr');
            const detail = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
            (0, assert_1.default)(detail, 'Expected error details[0] to be present');
            assert_1.default.strictEqual(detail.statusCode, 404);
            assert_1.default.strictEqual(detail.responseData.message, 'Not Found');
            assert_1.default.strictEqual(detail.originalMessage, 'Delete failed');
            return true;
        });
    }));
    it('throws retryable ApplicationFailure for 5xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        deleteStub = sinon_1.default.stub().rejects({
            response: { status: 500, data: { message: 'Server Error' } },
            message: 'Delete failed',
        });
        const deleteInAuth0Activity = setupActivityWithStub(deleteStub);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(deleteInAuth0Activity, 'org-id-123'), (err) => {
            var _a;
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, false);
            assert_1.default.strictEqual(err.type, 'HttpErorr');
            const detail = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
            (0, assert_1.default)(detail, 'Expected error details[0] to be present');
            assert_1.default.strictEqual(detail.statusCode, 500);
            assert_1.default.strictEqual(detail.responseData.message, 'Server Error');
            assert_1.default.strictEqual(detail.originalMessage, 'Delete failed');
            return true;
        });
    }));
});
