"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = init;
const sms_1 = __importDefault(require("./init/sms"));
async function init() {
    (0, sms_1.default)();
}
