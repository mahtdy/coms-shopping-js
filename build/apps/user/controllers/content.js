"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/content/repository"));
const content_1 = __importDefault(require("../../../core/mongoose-controller/controllers/user/content"));
const model_1 = require("../../../repositories/user/model");
// console.log("content-controller")
// console.log("jdddd" , ContentRepository)
// let contentPart = ContentPart.getInstance()
var content = new content_1.default("/content", new repository_1.default(), model_1.UserModel, {});
exports.default = content;
