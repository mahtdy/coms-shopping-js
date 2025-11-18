"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
// import { baseLanguage } from "../../core/baseLanguage";
class LanguageRepository extends repository_1.default {
    constructor(options) {
        super(model_1.LanguageModel, options);
    }
    async insert(language) {
        // language.translation = baseLanguage
        return super.insert(language);
    }
}
exports.default = LanguageRepository;
