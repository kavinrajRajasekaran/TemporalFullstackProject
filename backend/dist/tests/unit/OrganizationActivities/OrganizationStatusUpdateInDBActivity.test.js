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
const OrganizationActivities_1 = require("../../../temporal/activities/OrganizationActivities");
const OrganizationModel_1 = require("../../../models/OrganizationModel");
const mongoose_1 = __importDefault(require("mongoose"));
describe('OrganizationStatusUpdateInDBActivity', () => {
    afterEach(() => {
        sinon_1.default.restore();
    });
    const input = {
        id: new mongoose_1.default.Types.ObjectId(),
        status: 'updating',
        failureReason: 'testing',
        authid: 'auth123',
    };
    it('updates and returns organization when found', () => __awaiter(void 0, void 0, void 0, function* () {
        const saveStub = sinon_1.default.stub().resolves();
        const fakeOrg = {
            _id: input.id,
            status: '',
            metadata: {},
            authid: '',
            save: saveStub,
        };
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findById').resolves(fakeOrg);
        const env = new testing_1.MockActivityEnvironment();
        const result = yield env.run(OrganizationActivities_1.OrganizationStatusUpdateInDBActivity, input);
        assert_1.default.strictEqual(result, fakeOrg);
        assert_1.default.strictEqual(fakeOrg.status, input.status);
        assert_1.default.strictEqual(fakeOrg.metadata.failureReason, input.failureReason);
        assert_1.default.strictEqual(fakeOrg.authid, input.authid);
        (0, assert_1.default)(saveStub.calledOnce);
    }));
    it('throws error if organization not found', () => __awaiter(void 0, void 0, void 0, function* () {
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findById').resolves(null);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.OrganizationStatusUpdateInDBActivity, input), (err) => {
            if (err instanceof common_1.ApplicationFailure) {
                assert_1.default.strictEqual(err.type, 'DBError');
                (0, assert_1.default)(err.message.includes('status updation in the DB activity failed'));
                return true;
            }
            return false;
        });
    }));
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeOrg = {
            _id: input.id,
            status: 'old',
            metadata: {},
            save: sinon_1.default.stub().rejects({
                response: { status: 400, data: { message: 'Bad Request' } },
                message: 'Save failed',
            }),
        };
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findById').resolves(fakeOrg);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.OrganizationStatusUpdateInDBActivity, input), (err) => {
            var _a;
            if (err instanceof common_1.ApplicationFailure) {
                assert_1.default.strictEqual(err.nonRetryable, true);
                assert_1.default.strictEqual(err.type, 'DBError');
                const details = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
                assert_1.default.strictEqual(details.statusCode, 400);
                assert_1.default.strictEqual(details.responseData.message, 'Bad Request');
                assert_1.default.strictEqual(details.originalMessage, 'Save failed');
                return true;
            }
            return false;
        });
    }));
    it('throws retryable ApplicationFailure for 5xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeOrg = {
            _id: input.id,
            status: 'old',
            metadata: {},
            save: sinon_1.default.stub().rejects({
                response: { status: 500, data: { message: 'Server Error' } },
                message: 'Save failed',
            }),
        };
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findById').resolves(fakeOrg);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(OrganizationActivities_1.OrganizationStatusUpdateInDBActivity, input), (err) => {
            var _a;
            if (err instanceof common_1.ApplicationFailure) {
                assert_1.default.strictEqual(err.nonRetryable, false);
                assert_1.default.strictEqual(err.type, 'DBError');
                const details = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
                assert_1.default.strictEqual(details.statusCode, 500);
                assert_1.default.strictEqual(details.responseData.message, 'Server Error');
                assert_1.default.strictEqual(details.originalMessage, 'Save failed');
                return true;
            }
            return false;
        });
    }));
});
