"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const zarinpal_node_sdk_1 = __importDefault(require("zarinpal-node-sdk"));
class ZarinpalPayPort extends base_1.default {
    constructor(config) {
        super(config);
        this.zarinpal = new zarinpal_node_sdk_1.default({
            merchantId: config.merchantId,
            accessToken: config.accessToken,
        });
    }
    async getLink(amount, callBackUrl, info) {
        try {
            let r = await this.zarinpal.payments.create({
                amount,
                callback_url: callBackUrl,
                description: info["description"],
                email: info["email"],
                mobile: info["phone"]
            });
            if (r["data"]["code"] != 100) {
                throw new Error("Pay port Error");
            }
            return `https://www.zarinpal.com/pg/StartPay/${r["data"]["authority"]}`;
        }
        catch (error) {
            throw error;
        }
    }
    async validatePayment(callBackData) {
        try {
            const response = await this.zarinpal.verifications.verify({
                amount: callBackData["amount"],
                authority: callBackData["authority"],
            });
            if (response.data.code === 100) {
                return true;
            }
            else if (response.data.code === 101) {
                return true;
            }
            return false;
        }
        catch (error) {
            throw new Error(`Payment Verification Failed:, ${error}`);
        }
    }
}
exports.default = ZarinpalPayPort;
