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
describe('deleteUserInAuth0', () => {
    const authId = 'auth0|user123';
    const fakeToken = 'fake-token';
    let deleteStub;
    let getAuth0TokenStub;
    beforeEach(() => {
        deleteStub = sinon_1.default.stub(axios_1.default, 'delete');
        const modulePath = '../../../utils/auth0TokenGenerator';
        const mod = require(modulePath);
        getAuth0TokenStub = sinon_1.default.stub().resolves(fakeToken);
        mod.getAuth0Token = getAuth0TokenStub;
    });
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('completes successfully when delete does not throw', () => __awaiter(void 0, void 0, void 0, function* () {
        deleteStub.resolves({ status: 204 });
        yield (0, Useractivities_1.deleteUserInAuth0)(authId);
        (0, assert_1.default)(deleteStub.calledOnce);
        const calledUrl = deleteStub.firstCall.args[0];
        assert_1.default.strictEqual(calledUrl, `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`);
    }));
    it('throws non-retryable ApplicationFailure for 4xx error', () => __awaiter(void 0, void 0, void 0, function* () {
        deleteStub.rejects({
            response: {
                status: 404,
                data: { message: 'User not found' }
            },
            message: 'User not found'
        });
        try {
            yield (0, Useractivities_1.deleteUserInAuth0)(authId);
            assert_1.default.fail('Expected ApplicationFailure to be thrown');
        }
        catch (err) {
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.message, 'error while deletion of the user in auth0');
        }
    }));
    it('rethrows error for 5xx (retryable)', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: {
                status: 500,
                data: { message: 'Server Error' }
            },
            message: 'Server Error'
        };
        deleteStub.rejects(error);
        try {
            yield (0, Useractivities_1.deleteUserInAuth0)(authId);
            assert_1.default.fail('Expected error to be thrown');
        }
        catch (err) {
            (0, assert_1.default)(!(err instanceof common_1.ApplicationFailure));
            assert_1.default.strictEqual(err.response.status, 500);
            assert_1.default.strictEqual(err.message, 'Server Error');
        }
    }));
});
