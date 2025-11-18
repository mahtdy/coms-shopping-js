"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../basePage/repository"));
class AuthorRepository extends repository_1.default {
    constructor(options) {
        // options.model = AuthorModel
        super(options);
    }
}
exports.default = AuthorRepository;
