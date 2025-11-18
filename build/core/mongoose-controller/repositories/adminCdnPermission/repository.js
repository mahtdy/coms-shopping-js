"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../admin/repository"));
const mongoose_1 = __importDefault(require("mongoose"));
class AdminCdnPermissionRepository extends repository_1.default {
    constructor(options) {
        super(model_1.AdminCdnPermissionModel, options);
        this.adminRepo = new repository_2.default({
            model: mongoose_1.default.models['admin']
        });
        // {
        //     FileManagerConfigAdminModel,  new CacheService("fileManagerConfigAdmin")
        // })
    }
    async insert(document) {
        try {
            var isAdminExists = await this.adminRepo.isExists({
                _id: document.admin
            });
            if (!isAdminExists) {
                throw new Error("ادمین نامعتبر");
            }
            var isdublicate = await this.isExists({
                admin: document.admin
            });
            if (!isAdminExists) {
                throw new Error("ادمین تکراری");
            }
        }
        catch (error) {
            throw error;
        }
        return super.insert(document);
    }
}
exports.default = AdminCdnPermissionRepository;
