"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import AdminFileManagerPermission, { AdminFileManagerPermissionModel } from "../../database";
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../admin/repository"));
const repository_3 = __importDefault(require("../fileManagerConfig/repository"));
const mongoose_1 = __importDefault(require("mongoose"));
class FileManagerPermissionRepository extends repository_1.default {
    constructor(options) {
        super(model_1.FileManagerPermissionModel, options);
        this.adminRepo = new repository_2.default({
            model: mongoose_1.default.models['admin']
        });
        this.fileManagerConfRepo = new repository_3.default();
    }
    async insert(document) {
        try {
            var isAdminExists = await this.adminRepo.isExists({
                _id: document.admin
            });
            if (!isAdminExists) {
                throw new Error("ادمین نامعتبر");
            }
            var isCdnExists = await this.fileManagerConfRepo.isExists({
                _id: document.cdn
            });
            if (!isCdnExists) {
                throw new Error("cdn نامعتبر");
            }
        }
        catch (error) {
            throw error;
        }
        return super.insert(document);
    }
}
exports.default = FileManagerPermissionRepository;
