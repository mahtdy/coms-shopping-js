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
exports.APIKeyController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/apiKey/repository"));
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
class APIKeyController extends controller_1.default {
    create(data, adminInfo) {
        data.creator = adminInfo._id;
        return super.create(data);
    }
    async update(id, data) {
        return super.editById(id, {
            $set: data
        }, {
            ok: true
        });
    }
    async changeMessagingPermission(id, data) {
        if (await this.repository.isExists({
            _id: id,
            "permission.partition": data.partition
        })) {
            return super.editOne({
                _id: id,
                "permission.partition": data.partition
            }, {
                $set: {
                    "permission.$": data
                }
            });
        }
        return super.editOne({
            _id: id
        }, {
            $push: {
                "permission": data
            }
        });
    }
}
exports.APIKeyController = APIKeyController;
__decorate([
    __param(1, (0, parameters_1.Admin)())
], APIKeyController.prototype, "create", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            expire: zod_1.z.coerce.date().optional(),
            status: zod_1.z.boolean(),
            email: controller_1.default.email.optional(),
            phone: controller_1.default.phone.optional(),
            ips: zod_1.z.array(controller_1.default.ip).default([])
        })
    }))
], APIKeyController.prototype, "update", null);
__decorate([
    (0, method_1.Put)("/permission/messaging"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            partition: zod_1.z.string(),
            type: zod_1.z.enum(["any", "semi"]),
            permissionData: zod_1.z.any().default({})
        })
    }))
], APIKeyController.prototype, "changeMessagingPermission", null);
var apikey = new APIKeyController("/apikey", new repository_1.default({}), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        expire: zod_1.z.coerce.date().optional(),
        status: zod_1.z.boolean(),
        email: controller_1.default.email.optional(),
        phone: controller_1.default.phone.optional(),
        ips: zod_1.z.array(controller_1.default.ip).default([])
    }),
});
exports.default = apikey;
