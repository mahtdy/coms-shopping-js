"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class TaxLogRepository extends repository_1.default {
    constructor(options) {
        super(model_1.TaxLogModel, options);
    }
    async increaseTax(invoice, taxAmount, session) {
        let isExist = await this.isExists({
            invoice,
            type: "increase",
        });
        if (isExist) {
            return;
        }
        let log = await this.insert({
            invoice,
            amount: taxAmount,
            type: "increase",
            date: new Date()
        });
        return;
    }
    async decreaseTax(invoice, taxAmount, ClientSession) {
        let isExist = await this.isExists({
            invoice,
            type: "decrease"
        });
        if (isExist) {
            return;
        }
        let log = await this.insert({
            invoice,
            type: "decrease",
            amount: taxAmount,
            date: new Date()
        });
        return;
    }
}
exports.default = TaxLogRepository;
