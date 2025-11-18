"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN_TransferRepository = void 0;
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class CDN_TransferRepository extends repository_1.default {
    constructor(options) {
        super(model_1.CDN_Transfer_Model, options);
    }
}
exports.CDN_TransferRepository = CDN_TransferRepository;
