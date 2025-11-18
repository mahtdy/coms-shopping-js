"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSI_Controller = void 0;
const zod_1 = require("zod");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/psi/repository"));
const method_1 = require("../../decorators/method");
class PSI_Controller extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    create(data, ...params) {
        return super.create(data);
    }
    async getOne() {
        try {
            let data = await this.repository.findOne({});
            if (data == null) {
                return {
                    status: 404
                };
            }
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        // super.initApis()
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
    }
}
exports.PSI_Controller = PSI_Controller;
__decorate([
    (0, method_1.Get)("")
], PSI_Controller.prototype, "getOne", null);
const psi = new PSI_Controller("/psi", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        periodType: zod_1.z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
        periodConfig: zod_1.z.object({
            weekDays: zod_1.z.array(zod_1.z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).optional(),
            monthly: zod_1.z.array(zod_1.z.object({
                month: zod_1.z.coerce.number().int().min(1).max(11),
                day: zod_1.z.coerce.number().int().min(1).max(31)
            })).optional()
        }).optional()
    })
});
exports.default = psi;
