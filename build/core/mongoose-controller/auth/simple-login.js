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
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const logInController_1 = __importDefault(require("../../logInController"));
class SimpleLogIn extends logInController_1.default {
    constructor(baseRoute, repository) {
        super(baseRoute);
        this.repository = repository;
        this.initApis();
    }
    ;
    async logIn(user, password, session) {
        session['logIn'] = true;
        return {
            status: 200,
            session
        };
    }
    initApis() {
        this.addRoute("/", "post", this.logIn.bind(this));
    }
}
exports.default = SimpleLogIn;
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "user",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(2, (0, parameters_1.Session)())
], SimpleLogIn.prototype, "logIn", null);
