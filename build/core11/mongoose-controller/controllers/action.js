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
exports.ActionController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/action/repository"));
const zod_1 = __importDefault(require("zod"));
const zodAction = zod_1.default.object({
    title: zod_1.default.string(),
    url: zod_1.default.string(),
    method: zod_1.default.enum(["POST", "GET", "DELETE", "PUT"]),
    description: zod_1.default.string().optional(),
    partName: zod_1.default.string(),
    partPersion: zod_1.default.string(),
    subPartName: zod_1.default.string().optional(),
    subPartPersion: zod_1.default.string().optional(),
    isMainGet: zod_1.default.boolean().optional()
});
class ActionController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.additionActions = options.additionActions;
    }
    async insertMany(actions) {
        return super.insertMany(actions);
    }
    async getSorted() {
        try {
            var data = await this.repository.getSorted();
            var responseData = {};
            for (let i = 0; i < data.length; i++) {
                let nestedData = {};
                for (let j = 0; j < data[i].sub.length; j++) {
                    nestedData[data[i].sub[j]['subPartName']] = {
                        "persianName": data[i].sub[j]['subPartPersion']
                    };
                }
                responseData[data[i]['_id']] = {
                    "persianName": data[i]['persianName'],
                    sub: nestedData
                };
            }
            return {
                status: 200,
                data: Object.assign(responseData, this.additionActions)
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.ActionController = ActionController;
__decorate([
    (0, method_1.Post)("es"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.default.array(zodAction)
    }))
], ActionController.prototype, "insertMany", null);
__decorate([
    (0, method_1.Get)("es/sorted")
], ActionController.prototype, "getSorted", null);
const action = new ActionController("/action", new repository_1.default(), {
    insertSchema: zodAction,
    additionActions: {
        systemConfig: {
            "persianName": "تنظیمات",
            "sub": {
                "fileManagerConfig": {
                    "persianName": "مدیریت فایل منیجر"
                },
                "SMSConfig": {
                    "persianName": "مدیریت درگاه‌های پیامکی"
                },
                "emailConfig": {
                    "persianName": "مدیریت درگاه‌های ایمیل"
                },
                "payPortConfig": {
                    "persianName": "‌مدیریت درگاه‌های پرداخت"
                },
                "bankAccount": {
                    "persianName": "مدیریت حساب های بانکی"
                }
            }
        },
        contentModule: {
            "persianName": "بخش محتوا",
            "sub": {
                content: {
                    "persianName": "مدیریت مقالات"
                }
            }
        }
    }
});
exports.default = action;
