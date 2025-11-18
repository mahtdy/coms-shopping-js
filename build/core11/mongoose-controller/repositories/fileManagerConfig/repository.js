"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
var writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
class FileManagerConfigRepository extends repository_1.default {
    constructor() {
        super(model_1.FileManagerConfigModel);
    }
    async getDefault() {
        return this.collection.findOne({
            isDefault: true
        });
    }
    async getInertnal() {
        return this.collection.findOne({
            isInternal: true
        });
    }
    async findById(id, queryInfo, population) {
        try {
            let data = await super.findById(id, queryInfo, population);
            return data;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = FileManagerConfigRepository;
