"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class POS_DeviceRepository extends repository_1.default {
    constructor(options) {
        super(model_1.POS_DeviceModel, options);
    }
}
exports.default = POS_DeviceRepository;
