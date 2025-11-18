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
exports.NotificationConfigController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/notificationConfig/repository"));
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
class NotificationConfigController extends controller_1.default {
    async create(data) {
        var _a;
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
            var resp = await super.editById(id, {
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
}
exports.NotificationConfigController = NotificationConfigController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            isDefault: zod_1.z.boolean().optional(),
            config: controller_1.default.search.optional(),
            title: zod_1.z.string().optional(),
        })
    }))
], NotificationConfigController.prototype, "editById", null);
var notificationConfig = new NotificationConfigController("/notification/config", new repository_1.default({}), {
    insertSchema: zod_1.z.object({
        config: controller_1.default.search,
        title: zod_1.z.string(),
        isDefault: zod_1.z.boolean().default(false)
    })
});
exports.default = notificationConfig;
