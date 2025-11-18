"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModel = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = __importDefault(require("../../core/mongoose-controller/repositories/admin/repository"));
const model_1 = require("../../core/mongoose-controller/repositories/admin/model");
const admin_logIn_1 = __importDefault(require("../../core/mongoose-controller/auth/admin/admin-logIn"));
exports.AdminModel = (0, mongoose_1.model)('admin', model_1.adminSchema);
// var login = new SimpleLogIn<Admin>("/login",new SimpleLogInRepository(AdminModel))
var login = new admin_logIn_1.default("", new repository_1.default({
    model: exports.AdminModel,
    // salt : "111244"
}));
login.tag = "/admin/login";
exports.default = login;
