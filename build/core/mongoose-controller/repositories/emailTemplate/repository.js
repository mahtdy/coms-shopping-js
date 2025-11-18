"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
class EmailTemplateRepository extends repository_1.default {
    constructor(options) {
        super(model_1.EmailTemplateModel, options);
    }
    async disableDefaultConfig(id) {
        try {
            await this.updateMany({
                defaultEmailConfig: id
            }, {
                $unset: {
                    defaultSmsConfig: 1
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = EmailTemplateRepository;
