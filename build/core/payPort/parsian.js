"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const soap = __importStar(require("soap"));
const util_1 = require("util");
const random_1 = __importDefault(require("../random"));
class ParsianPayPort extends base_1.default {
    constructor(config) {
        super(config);
    }
    async getLink(amount, callBackUrl) {
        try {
            const params = {
                LoginAccount: this.config.pin,
                Amount: amount,
                CallBackUrl: callBackUrl,
                OrderId: random_1.default.randomNumber().toString()
            };
            let cli = await soap.createClientAsync("https://pec.shaparak.ir/NewIPGServices/Sale/SaleService.asmx?WSDL");
            const salePaymentRequest = (0, util_1.promisify)(cli.SalePaymentRequest);
            let r = await salePaymentRequest({
                requestData: params
            });
            if (r["SalePaymentRequestResult"]["Token"] <= 0) {
                throw new Error("Pay port Error");
            }
            return `https://pec.shaparak.ir/NewIPG/?Token=${r["SalePaymentRequestResult"]["Token"]}`;
        }
        catch (error) {
            throw error;
        }
    }
    async validatePayment(callBackData) {
        try {
            console.log("validatePayment");
            const params = {
                LoginAccount: this.config.pin,
                "Token": callBackData["Token"],
            };
            let cli = await soap.createClientAsync("https://pec.shaparak.ir/NewIPGServices/Confirm/ConfirmService.asmx?WSDL");
            const confirmPayment = (0, util_1.promisify)(cli.ConfirmPayment);
            let r = await confirmPayment({
                requestData: params
            });
            if (r["ConfirmPaymentResult"]["Status"] == 0 && r["ConfirmPaymentResult"]["RRN"] > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = ParsianPayPort;
