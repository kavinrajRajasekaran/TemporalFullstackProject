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
const express_1 = __importDefault(require("express"));
const UserRoutes_1 = __importDefault(require("./Routes/UserRoutes"));
const Organizationroutes_1 = __importDefault(require("./Routes/Organizationroutes"));
const app = (0, express_1.default)();
const db_1 = require("./config/db");
app.use(express_1.default.json());
(0, db_1.connectToMongo)();
app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(200).json({ "status": "ok" });
}));
app.use('/api/organizations', Organizationroutes_1.default);
app.use('/api/users', UserRoutes_1.default);
app.listen(3000, () => {
    console.log('app listening on the port 3000');
});
