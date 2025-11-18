"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../core/mongoose-controller/repositories/user/repository"));
const user_login_1 = __importDefault(require("../../core/mongoose-controller/auth/user/user-login"));
const model_1 = require("../../repositories/user/model");
// var login = new SimpleLogIn<Admin>("/login",new SimpleLogInRepository(AdminModel))
var login = new user_login_1.default("", new repository_1.default({
    model: model_1.UserModel,
    // salt: "111244"
}));
login.tag = "/user/login";
exports.default = login;
