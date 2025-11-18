"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("../warehouse/model");
class WarehouseRepository extends repository_1.default {
    constructor(options) {
        super(model_1.WarehouseModel, options);
    }
}
exports.default = WarehouseRepository;
