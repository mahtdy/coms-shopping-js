"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const axios_1 = __importDefault(require("axios"));
// import crypto from "crypto";
const date_fns_1 = require("date-fns");
const { MCrypt } = require("mcrypt");
class MeliPayPort extends base_1.default {
    constructor(config) {
        super(config);
        this.blockSize = 8;
    }
    pkcs7Padding(data, blockSize) {
        const padding = blockSize - (data.length % blockSize);
        const pad = Buffer.alloc(padding, padding);
        return Buffer.concat([data, pad]);
    }
    generateSign(text) {
        const tripleDESEcb = new MCrypt("tripledes", "ecb");
        const Key = Buffer.from(this.config.key, "base64");
        const blockSize = tripleDESEcb.getBlockSize();
        const extraPad = blockSize - (text.length % blockSize);
        const targetStr = text + Array(extraPad)
            .fill(String.fromCharCode(extraPad)).join("");
        tripleDESEcb.open(Key);
        return tripleDESEcb.encrypt(targetStr).toString("base64");
    }
    async getLink(amount, callBackUrl, info) {
        try {
            const url = "https://sadad.shaparak.ir/api/v0/Request/PaymentRequest";
            const text = `${this.config.terminalId};${info.orderId};${amount}`;
            const SignData = this.generateSign(text);
            const localDateTime = (0, date_fns_1.format)(new Date(), "MM/dd/yyyy hh:mm:ss a");
            let data = {
                "TerminalId": this.config.terminalId,
                "MerchantId": this.config.merchantId,
                "Amount": amount,
                "SignData": SignData,
                "ReturnUrl": callBackUrl,
                "LocalDateTime": localDateTime,
                "OrderId": info.orderId
            };
            let res = await axios_1.default.post(url, data);
            if (res.status == 200) {
                if (res.data["Token"] == undefined || res.data["Token"] == null || res.data["Token"] == "") {
                    throw new Error("Pay port Error");
                }
                return `https://sadad.shaparak.ir/Purchase?token=${res.data["Token"]}`;
            }
        }
        catch (error) {
            console.log(error.response.data);
            throw error;
        }
        return "";
    }
    async validatePayment(callBackData) {
        const url = 'https://sadad.shaparak.ir/api/v0/Advice/Verify';
        try {
            const SignData = this.generateSign(callBackData["token"]);
            const data = {
                "Token": callBackData["token"],
                SignData
            };
            let res = await axios_1.default.post(url, data);
            if (res.data["ResCode"] == 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            throw error;
        }
        return false;
    }
}
exports.default = MeliPayPort;
