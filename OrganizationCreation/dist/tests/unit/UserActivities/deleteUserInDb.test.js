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
const mongoose_1 = __importDefault(require("mongoose"));
const common_1 = require("@temporalio/common");
const Useractivities_1 = require("../../../temporal/activities/Useractivities");
const UserModelModule = __importStar(require("../../../models/userModel"));
describe('deleteUserInDb', () => {
    const authId = 'auth0|user123';
    let deleteStub;
    beforeEach(() => {
        deleteStub = sinon_1.default.stub(UserModelModule.UserModel, 'findOneAndDelete');
    });
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('completes successfully when deletion does not throw', () => __awaiter(void 0, void 0, void 0, function* () {
        deleteStub.resolves({ _id: new mongoose_1.default.Types.ObjectId() });
        yield (0, Useractivities_1.deleteUserInDb)(authId);
        (0, assert_1.default)(deleteStub.calledOnceWithExactly({ authId }));
    }));
    it('throws non-retryable ApplicationFailure for 4xx error', () => __awaiter(void 0, void 0, void 0, function* () {
        deleteStub.rejects({
            response: {
                status: 404,
                data: { message: 'User not found in DB' },
            },
            message: 'User not found in DB',
        });
        try {
            yield (0, Useractivities_1.deleteUserInDb)(authId);
            assert_1.default.fail('Expected ApplicationFailure');
        }
        catch (err) {
            (0, assert_1.default)(err instanceof common_1.ApplicationFailure);
            assert_1.default.strictEqual(err.nonRetryable, true);
            assert_1.default.strictEqual(err.message, 'error while deletion of the user in auth0');
        }
    }));
    it('rethrows error for 5xx server error', () => __awaiter(void 0, void 0, void 0, function* () {
        const error = {
            response: {
                status: 500,
                data: { message: 'Internal Server Error' },
            },
            message: 'Internal Server Error',
        };
        deleteStub.rejects(error);
        try {
            yield (0, Useractivities_1.deleteUserInDb)(authId);
            assert_1.default.fail('Expected error');
        }
        catch (err) {
            (0, assert_1.default)(!(err instanceof common_1.ApplicationFailure));
            assert_1.default.strictEqual(err.response.status, 500);
            assert_1.default.strictEqual(err.message, 'Internal Server Error');
        }
    }));
});
