"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/user/repository"));
const user_1 = require("../../../core/mongoose-controller/controllers/user");
const model_1 = require("../../../repositories/user/model");
const zod_1 = __importDefault(require("zod"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const random_1 = __importDefault(require("../../../core/random"));
const smsMessager_1 = __importDefault(require("../../../core/messaging/smsMessager"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const admin_1 = require("./admin");
class UserControllerAdmin extends user_1.UserController {
    async create(data, ...params) {
        var password = random_1.default.generateHashStr(10);
        data.password = password;
        var resp = await super.create(data);
        if (resp.status == 200) {
            resp.data = {
                nama: resp.data.name,
                family: resp.data.family,
                _id: resp.data._id,
                phoneNumber: resp.data.phoneNumber,
                email: resp.data.email,
            };
            smsMessager_1.default.send({
                parameters: {
                    name: data.name,
                    family: data.family,
                    password
                },
                receptor: data.phoneNumber,
                template: "sendUserPassword"
            });
        }
        return resp;
    }
    async isPhoneExists(phone) {
        return this.checkExists({
            phoneNumber: phone
        });
    }
    async isEmailExists(email) {
        return this.checkExists({
            email
        });
    }
    initApis() {
        super.initApis();
        this.addExportRoutes();
    }
}
__decorate([
    (0, method_1.Get)("s/phone/exists"),
    __param(0, (0, parameters_1.Query)({
        destination: "phone",
        schema: controller_1.default.phone
    }))
], UserControllerAdmin.prototype, "isPhoneExists", null);
__decorate([
    (0, method_1.Get)("s/email/exists"),
    __param(0, (0, parameters_1.Query)({
        destination: "email",
        schema: controller_1.default.email
    }))
], UserControllerAdmin.prototype, "isEmailExists", null);
const user = new UserControllerAdmin("/user", new repository_1.default({
    model: model_1.UserModel,
    // salt: "111244"
}), {
    insertSchema: zod_1.default.object({
        name: zod_1.default.string(),
        family: zod_1.default.string(),
        email: controller_1.default.email,
        phoneNumber: controller_1.default.phone,
        userCategory: controller_1.default.ip.optional()
    }),
    paginationConfig: {
        fields: {
            towFactorLogIn: {
                en_title: "towFactorLogIn",
                fa_title: "ورود دومرحله‌ای",
                isOptional: false,
                sortOrderKey: false,
                type: "boolean"
            },
            isEmailRegistered: {
                en_title: "isEmailRegistered",
                fa_title: "وضعیت تایید ایمیل",
                isOptional: false,
                sortOrderKey: false,
                type: "boolean"
            },
            email: {
                en_title: "email",
                fa_title: "ایمیل",
                isOptional: false,
                sortOrderKey: false,
                type: "string"
            },
            phoneNumber: {
                en_title: "phoneNumber",
                fa_title: "شماره تلفن",
                isOptional: false,
                sortOrderKey: false,
                type: "string"
            },
            family: {
                en_title: "family",
                fa_title: "نام‌ خانوادگی",
                isOptional: false,
                sortOrderKey: false,
                type: "string"
            },
            name: {
                en_title: "name",
                fa_title: "نام",
                isOptional: false,
                sortOrderKey: false,
                type: "string"
            },
        },
        paginationUrl: "/users",
        searchUrl: "/users",
        serverType: "",
        exportcsvUrl: "/users/csv",
        exportexelUrl: "/users/exel",
        exportpdfUrl: "/users/pdf",
        tableLabel: "users"
    },
    collectionName: "user",
    adminRepo: admin_1.adminRepo
});
exports.default = user;
