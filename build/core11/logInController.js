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
const controller_1 = __importDefault(require("./controller"));
const parameters_1 = require("./decorators/parameters");
class BaseLogIn extends controller_1.default {
    constructor(baseRoute) {
        super(baseRoute);
    }
    async checkLogIn(admin) {
        if ((admin === null || admin === void 0 ? void 0 : admin._id) != undefined)
            return {
                next: true
            };
        return {
            status: 403,
            data: {
                logIn: true
            }
        };
    }
}
exports.default = BaseLogIn;
__decorate([
    __param(0, (0, parameters_1.Admin)())
], BaseLogIn.prototype, "checkLogIn", null);
