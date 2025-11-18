"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
class ConfigService {
    static getConfig(name) {
        return config_1.default[name];
    }
}
exports.default = ConfigService;
