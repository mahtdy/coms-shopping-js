"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BasePaymentPort {
    constructor(config) {
        this.config = config;
    }
    async getLink(amount, callBackUrl, info) {
        return "";
    }
    async validatePayment(callBackData, info) {
        return false;
    }
}
exports.default = BasePaymentPort;
