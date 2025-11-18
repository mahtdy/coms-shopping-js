"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { PackageModel } from "./model";
// import Package from "./model";
const model_1 = require("../../../repositories/admin/package/model");
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
class PackageRepository extends repository_1.default {
    constructor(options) {
        super(model_1.PackageModel, options);
    }
}
exports.default = PackageRepository;
