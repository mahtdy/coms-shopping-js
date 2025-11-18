"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/system/repository"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
class SystemConfigController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async getConfigByLable(lable) {
        try {
            return await this.findMany({
                lable
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getConfigValue(key) {
        try {
            let value = await this.repository.getConfigValue(key);
            if (value == undefined) {
                return {
                    status: 404
                };
            }
            return {
                status: 200,
                data: value
            };
        }
        catch (error) {
            throw error;
        }
    }
    async updateConfig(lable, updateData) {
        var confs = [];
        for (let i = 0; i < updateData.length; i++) {
            var conf = await this.repository.findOne({ key: updateData[i].key, lable }, {
                fromDb: true
            });
            if (conf == null) {
                return {
                    status: 404,
                    message: "یافت نشد"
                };
            }
            conf.value = updateData[i].value;
            try {
                await conf.validate();
            }
            catch (error) {
                throw error;
            }
            confs.push(conf);
        }
        for (let i = 0; i < updateData.length; i++) {
            await this.repository.findByIdAndUpdate(confs[i]._id, {
                $set: {
                    value: updateData[i].value
                }
            });
        }
        return {
            status: 200,
            data: []
        };
    }
    async addSystemConfig(lable, body) {
        body['lable'] = lable;
        return this.create(body);
    }
    initApis() {
        // console.log("init")
        // super.initApis()
        // // this.addRoute("s/:lable","get", this.getConfigByLable.bind(this))
        // // this.addRoute("s/:lable","put", this.updateConfig.bind(this))
        // this.exclude("/systemConfig" , "delete")
    }
}
exports.SystemConfigController = SystemConfigController;
__decorate([
    (0, method_1.Get)("s/:lable"),
    __param(0, (0, parameters_1.Param)({
        destination: "lable",
        schema: zod_1.z.string()
    }))
], SystemConfigController.prototype, "getConfigByLable", null);
__decorate([
    (0, method_1.Get)("/config-value"),
    __param(0, (0, parameters_1.Query)({
        destination: "key",
        schema: zod_1.z.string()
    }))
], SystemConfigController.prototype, "getConfigValue", null);
__decorate([
    (0, method_1.Put)("s/:lable"),
    __param(0, (0, parameters_1.Param)({
        destination: "lable",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.array(zod_1.z.object({
            key: zod_1.z.string(),
            value: zod_1.z.any().default({})
        }))
    }))
], SystemConfigController.prototype, "updateConfig", null);
__decorate([
    (0, method_1.Post)("s/:lable"),
    __param(0, (0, parameters_1.Param)({
        destination: "lable",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            key: zod_1.z.string(),
            value: zod_1.z.any(),
            type: zod_1.z.enum([
                "Number",
                "String",
                "Object",
                "Time",
                "Duretion",
                "Boolean",
                "Array",
                "ObjectId"
            ]),
            enum: zod_1.z.array(zod_1.z.string()).optional()
        })
    }))
], SystemConfigController.prototype, "addSystemConfig", null);
var systemConfig = new SystemConfigController("/systemConfig", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        key: zod_1.z.string(),
        value: zod_1.z.any().default({}),
        lable: zod_1.z.string(),
        type: zod_1.z.enum(["Number", 'String', "Object", "Time", "Duretion", "Boolean", "Array", 'ObjectId']),
        max: zod_1.z.coerce.number().int().optional(),
        min: zod_1.z.coerce.number().int().optional(),
        unit: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        options: zod_1.z.array(zod_1.z.any())
    })
});
exports.default = systemConfig;
