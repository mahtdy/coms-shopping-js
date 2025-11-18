"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class SystemConfigRepository extends repository_1.default {
    constructor(options) {
        super(model_1.SystemConfigModel, options);
    }
    async getConf(key) {
        return await this.findOne({
            key: key
        });
    }
    async getConfigValue(key) {
        var config = await this.getConf(key);
        return (config === null || config === void 0 ? void 0 : config.value) != undefined ? config.value : undefined;
    }
    async getConfigByLable(lable) {
        return this.findAll({
            lable
        });
    }
    async updateOne(query, data) {
        var res = await super.updateOne(query, data);
        return res;
    }
}
exports.default = SystemConfigRepository;
