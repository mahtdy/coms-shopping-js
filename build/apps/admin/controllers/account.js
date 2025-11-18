"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const account_1 = __importDefault(require("../../../core/mongoose-controller/controllers/account"));
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/admin/repository"));
const login_1 = require("../login");
var account = new account_1.default("/account", new repository_1.default({
    model: login_1.AdminModel,
    // salt : "111244"
}));
exports.default = account;
