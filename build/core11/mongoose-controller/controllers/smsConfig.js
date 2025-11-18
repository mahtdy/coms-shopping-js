"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsConfigController = void 0;
const repository_1 = __importDefault(require("../repositories/smsConfig/repository"));
const controller_1 = __importDefault(require("../controller"));
const mongoose_1 = require("mongoose");
const repository_2 = __importDefault(require("../repositories/smsLog/repository"));
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const repository_3 = __importDefault(require("../repositories/smsTemplate/repository"));
const zod_1 = require("zod");
class SmsConfigController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        if (!options) {
            options = {};
        }
        if (!options.insertSchema) {
            options.insertSchema = zod_1.z.object({
                status: zod_1.z.boolean(),
                title: zod_1.z.string(),
                lineNumber: zod_1.z.string(),
                config: zod_1.z.any(),
                id: zod_1.z.enum(["kasbarg", "sms", "sabapayamak", "farapayamak", "payam-resan", "mediapayamak", "kavenegar", "parsgreen", "hiro-sms", "niksms", "smspanel", "mellipayamak"]),
                isDefault: zod_1.z.boolean().default(false)
            });
        }
        super(baseRoute, repo, options);
    }
    ;
    async create(data) {
        var _a;
        data["isOTP"] = false;
        try {
            var resp = await super.create(data);
            if (resp.status == 200 && data.isDefault) {
                await this.repository.updateOne({
                    isDefault: true,
                    _id: {
                        $ne: (_a = resp.data) === null || _a === void 0 ? void 0 : _a._id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
            }
        }
        catch (error) {
            throw error;
        }
        return resp;
    }
    async editById(id, data) {
        try {
            var resp = await super.editById(new mongoose_1.Types.ObjectId(id), {
                $set: data
            });
            if ((resp === null || resp === void 0 ? void 0 : resp.status) == 200 && data.isDefault) {
                await this.repository.updateOne({
                    isDefault: true,
                    _id: {
                        $ne: id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
            }
        }
        catch (error) {
            throw error;
        }
        return resp;
    }
    async getLogs(page, limit, id) {
        try {
            var dataList = await new repository_2.default().paginate({
                config: id
            }, limit, page);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: dataList,
            message: " عملیات موفق"
        };
    }
    // @Log
    async test(session, id) {
        var admin = session['admin'];
        try {
            var result = await smsMessager_1.default.sendWithConfig({
                template: "testTemplate",
                receptor: admin === null || admin === void 0 ? void 0 : admin.phoneNumber,
                parameters: {
                    test: ""
                }
            }, await this.repository.findById(new mongoose_1.Types.ObjectId(id), {
                fromDb: true
            }));
            if (result == false) {
                await new repository_2.default().insert({
                    config: id,
                    result: false,
                    importance: 2
                });
                return {
                    status: 200,
                    message: "ارسال ناموفق",
                    data: {
                        ok: false
                    }
                };
            }
            else {
                await new repository_2.default().insert({
                    config: id,
                    result: true,
                    importance: 2
                });
                return {
                    status: 200,
                    message: "ارسال موفق",
                    data: {
                        ok: true
                    }
                };
            }
        }
        catch (error) {
            await new repository_2.default().insert({
                config: id,
                result: false,
                importance: 2
            });
            throw error;
        }
    }
    async deleteById(id) {
        try {
            if (await this.repository.isExists({
                _id: id,
                isOTP: true
            })) {
                return {
                    status: 400,
                    message: "کانفیگ او تی پی قابل حذف نیست"
                };
            }
        }
        catch (error) {
            throw error;
        }
        try {
            if (await this.repository.isExists({
                _id: id,
                isDefault: true
            })) {
                return {
                    status: 400,
                    message: "کانفیگ  پیشفرض قابل حذف نیست"
                };
            }
        }
        catch (error) {
            throw error;
        }
        var resp = await super.delete(new mongoose_1.Types.ObjectId(id));
        if ((resp === null || resp === void 0 ? void 0 : resp.status) == 200) {
            await new repository_3.default().disableDefaultConfig(id);
        }
        return resp;
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("", "put", this.editById.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            },
            "2": {
                index: 1,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addRouteWithMeta("", "get", this.findById.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            }
        });
        this.addRouteWithMeta("/test", "get", this.test.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            }
        });
        this.addRouteWithMeta("/logs", "get", this.getLogs.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "page",
                schema: controller_1.default.page
            },
            "2": {
                index: 1,
                source: "query",
                destination: "limit",
                schema: controller_1.default.limit
            },
            "3": {
                index: 2,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            }
        });
    }
}
exports.SmsConfigController = SmsConfigController;
var smsConfig = new SmsConfigController("/smsConfig", new repository_1.default(), {});
exports.default = smsConfig;
