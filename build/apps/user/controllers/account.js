"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userAccount_1 = __importDefault(require("../../../core/mongoose-controller/controllers/userAccount"));
const model_1 = require("../../../repositories/user/model");
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/user/repository"));
var account = new userAccount_1.default("/account", new repository_1.default({
    model: model_1.UserModel,
    salt: "111244"
}));
exports.default = account;
