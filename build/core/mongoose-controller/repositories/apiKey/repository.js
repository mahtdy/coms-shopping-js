"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const random_1 = __importDefault(require("../../../random"));
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class APIKeyRepository extends repository_1.default {
    constructor(options) {
        super(model_1.APIKeyModel, options);
    }
    insert(document) {
        document.token = random_1.default.generateHashStr(50);
        return super.insert(document);
    }
}
exports.default = APIKeyRepository;
