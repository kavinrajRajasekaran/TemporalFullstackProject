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
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@temporalio/common");
const Useractivities_1 = require("../../../temporal/activities/Useractivities");
describe('userCreationInAuth0', () => {
    const input = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'securePassword123'
    };
    let postStub;
    let tokenStub;
    beforeEach(() => {
        postStub = sinon_1.default.stub(axios_1.default, 'post');
        tokenStub = sinon_1.default.stub().resolves('fake-token');
        const mod = require('../../../temporal/activities/OrganizationActivities');
        mod.getAuth0Token = tokenStub;
    });
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('returns user_id on successful creation', () => __awaiter(void 0, void 0, void 0, function* () {
        postStub.resolves({ data: { user_id: 'auth0|123456' } });
        const result = yield (0, Useractivities_1.userCreationInAuth0)(input);
        assert_1.default.strictEqual(result, 'auth0|123456');
        (0, assert_1.default)(postStub.calledOnce);
        assert_1.default.strictEqual(postStub.firstCall.args[0], `https://${process.env.AUTH0_DOMAIN}/api/v2/users`);
    }));
    it('throws non-retryable ApplicationFailure for 4xx errors', () => __awaiter(void 0, void 0, void 0, function* () {
        postStub.rejects({
            response: {
                status: 400,
                data: { message: 'Bad Request' }
            },
            message: 'Request failed'
        });
        try {
            yield (0, Useractivities_1.userCreationInAuth0)(input);
            assert_1.default.fail('Expected ApplicationFailure to be thrown');
        }
        catch (err) {
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.message, 'error while creation of the user in auth0');
        }
    }));
    it('rethrows error for 5xx errors (retryable)', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: {
                status: 500,
                data: { message: 'Internal Server Error' }
            },
            message: 'Server Error'
        };
        postStub.rejects(error);
        try {
            yield (0, Useractivities_1.userCreationInAuth0)(input);
            assert_1.default.fail('Expected error to be thrown');
        }
        catch (err) {
            (0, assert_1.default)(!(err instanceof common_1.ApplicationFailure));
            assert_1.default.strictEqual(err.response.status, 500);
            assert_1.default.strictEqual(err.message, 'Server Error');
        }
    }));
});
