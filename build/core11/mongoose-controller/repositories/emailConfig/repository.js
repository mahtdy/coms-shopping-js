"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
class EmailConfigRepository extends repository_1.default {
    constructor(options) {
        super(model_1.EmailConfigModel, options);
    }
    async getDefault() {
        try {
            return await this.findOne({
                isDefault: true
            }, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = EmailConfigRepository;
