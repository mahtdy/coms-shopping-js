"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../../repository"));
// import CacheService from "../cache"
class ChatCheckListRepository extends repository_1.default {
    constructor() {
        super(model_1.ChatCheckListModel, {
        // cacheService: new CacheService("chatCheckList")
        });
    }
}
exports.default = ChatCheckListRepository;
