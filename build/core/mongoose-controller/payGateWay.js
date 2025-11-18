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
const parameters_1 = require("../decorators/parameters");
const plugin_1 = require("../plugin");
const controller_1 = __importDefault(require("./controller"));
class PayGateWay extends plugin_1.Plugin {
    constructor(financeService) {
        super();
        this.financeService = financeService;
    }
    async pay(code, paymentId) {
        console.log("code", code);
        try {
            let link = await this.financeService.getPaymentLink(code, paymentId);
            return {
                redirect: link
            };
        }
        catch (error) {
            throw error;
        }
    }
    async verifyPayment() {
        try {
            // let verified
        }
        catch (error) {
            throw error;
        }
    }
    async init() {
        return true;
    }
    serve(...args) {
        return [
            {
                execs: this.pay.bind(this),
                method: "get",
                route: "/pay/:code",
                meta: {
                    params: {
                        "1": {
                            index: "0",
                            source: "param",
                            destination: "code",
                            schema: zod_1.z.string()
                        }
                    }
                }
            }
        ];
    }
}
exports.default = PayGateWay;
__decorate([
    __param(0, (0, parameters_1.Param)({
        destination: "code",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "paymentId",
        schema: controller_1.default.id.optional()
    }))
], PayGateWay.prototype, "pay", null);
