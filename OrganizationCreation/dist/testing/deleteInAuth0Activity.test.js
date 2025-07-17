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
const activities_1 = require("../temporal//activities");
const auth0_1 = require("auth0");
describe('deleteInAuth0Activity', () => {
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: { status: 404, data: { message: 'Not Found' } },
            message: 'Delete failed'
        };
        sinon_1.default.stub(auth0_1.ManagementClient.prototype, 'organizations').value({
            delete: sinon_1.default.stub().rejects(error)
        });
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(activities_1.deleteInAuth0Activity, 'org-id-123'), (err) => {
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
            message: 'Delete failed'
        };
        sinon_1.default.stub(auth0_1.ManagementClient.prototype, 'organizations').value({
            delete: sinon_1.default.stub().rejects(error)
        });
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(activities_1.deleteInAuth0Activity, 'org-id-123'), (err) => {
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
