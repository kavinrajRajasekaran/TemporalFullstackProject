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
const activities_1 = require("../temporal/activities");
const OrganizationModel_1 = require("../models/OrganizationModel");
const mongoose_1 = __importDefault(require("mongoose"));
describe('updateOrganizationInDBActivity', () => {
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('returns updated organization when update succeeds', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeOrg = {
            _id: new mongoose_1.default.Types.ObjectId("6878370b739ab3383263a309"),
            name: "myorganization",
            display_name: "My Organization",
            branding: {
                logo_url: "https://example.com/logo.png",
            },
            colors: {
                page_background: "#ffffff",
                primary: "#ff0000"
            },
            status: "updating",
            metadata: {
                createdByEmail: "admin@example.com"
            }
        };
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findByIdAndUpdate').resolves(fakeOrg);
        const env = new testing_1.MockActivityEnvironment();
        const result = yield env.run(activities_1.updateOrganizationInDBActivity, fakeOrg, fakeOrg._id);
        assert_1.default.deepStrictEqual(result, fakeOrg);
    }));
    it('returns undefined when no organization is found', () => __awaiter(void 0, void 0, void 0, function* () {
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findByIdAndUpdate').resolves(null);
        const env = new testing_1.MockActivityEnvironment();
        const result = yield env.run(activities_1.updateOrganizationInDBActivity, { name: 'TestOrg' }, new mongoose_1.default.Types.ObjectId());
        assert_1.default.strictEqual(result, undefined);
    }));
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: { status: 400, data: { message: 'Bad Request' } },
            message: 'Update failed'
        };
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findByIdAndUpdate').rejects(error);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(activities_1.updateOrganizationInDBActivity, { name: 'TestOrg' }, new mongoose_1.default.Types.ObjectId()), (err) => {
            var _a;
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.type, 'DBErorr');
            const detail = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
            (0, assert_1.default)(detail !== undefined, 'Expected error details[0] to be present');
            assert_1.default.strictEqual(detail.statusCode, 400);
            assert_1.default.strictEqual(detail.responseData.message, 'Bad Request');
            assert_1.default.strictEqual(detail.originalMessage, 'Update failed');
            return true;
        });
    }));
    it('throws retryable ApplicationFailure for 5xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: { status: 500, data: { message: 'Server Error' } },
            message: 'Update failed'
        };
        sinon_1.default.stub(OrganizationModel_1.OrganizationModel, 'findByIdAndUpdate').rejects(error);
        const env = new testing_1.MockActivityEnvironment();
        yield assert_1.default.rejects(env.run(activities_1.updateOrganizationInDBActivity, { name: 'TestOrg' }, new mongoose_1.default.Types.ObjectId()), (err) => {
            var _a;
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, false);
            assert_1.default.strictEqual(err.type, 'DBErorr');
            const detail = (_a = err.details) === null || _a === void 0 ? void 0 : _a[0];
            (0, assert_1.default)(detail !== undefined, 'Expected error details[0] to be present');
            assert_1.default.strictEqual(detail.statusCode, 500);
            assert_1.default.strictEqual(detail.responseData.message, 'Server Error');
            assert_1.default.strictEqual(detail.originalMessage, 'Update failed');
            return true;
        });
    }));
});
