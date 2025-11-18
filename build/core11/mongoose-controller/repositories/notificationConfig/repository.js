"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class NotificationConfigRepository extends repository_1.default {
    constructor(config) {
        super(model_1.NotificationConfigModel, config);
    }
}
exports.default = NotificationConfigRepository;
