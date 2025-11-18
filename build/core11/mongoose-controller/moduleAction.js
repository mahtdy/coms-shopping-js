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
exports.ModuleActionController = void 0;
const controller_1 = __importDefault(require("../controller"));
const method_1 = require("../decorators/method");
const parameters_1 = require("../decorators/parameters");
const zod_1 = require("zod");
const controller_2 = __importDefault(require("./controller"));
class ModuleActionController extends controller_1.default {
    constructor(baseRoute, moduleConfig) {
        super(baseRoute);
        this.actions = moduleConfig;
    }
    getActions(subPart, role) {
        var data = this.actions[subPart];
        console.log(data);
        if (data)
            return {
                status: 200,
                data
            };
        return {
            status: 404
        };
    }
}
exports.ModuleActionController = ModuleActionController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "role",
        schema: controller_2.default.id
    }))
], ModuleActionController.prototype, "getActions", null);
const moduleAction = new ModuleActionController("/mudole/actions", {
    content: [
        {
            name: "insert",
            type: "boolean",
            showTitle: "درج محتوا",
            value: false
        },
        {
            name: "delete",
            type: "boolean",
            showTitle: "حذف محتوا",
            value: false
        },
        {
            name: "update",
            type: "boolean",
            showTitle: "آپدیت محتوا",
            value: false
        },
        {
            name: "manageSeo",
            type: "boolean",
            showTitle: "مدیریت محتوا",
            related: "insert",
            value: false
        },
        {
            name: "questionManage",
            type: "boolean",
            showTitle: "مدیریت پرسش و پاسخ",
            related: "insert",
            value: false
        },
        {
            name: "contentType",
            type: "list",
            options: ["مقاله", "ویدیویی", "گالری", "پادکست", "جامع", "همه"],
            showTitle: "نوع محتوا",
            value: []
        },
        {
            name: "manageSub",
            showTitle: "مدیریت زیر نویس",
            type: "boolean",
            value: false,
            optionRelated: {
                option: "ویدیویی",
                related: "contentType"
            }
        },
        {
            name: "publish",
            type: "boolean",
            showTitle: "انتشار محتوا",
            value: false
        },
        {
            name: "exportPDF",
            type: "boolean",
            showTitle: "خروجی pdf",
            value: false
        },
        {
            name: "exportExcel",
            type: "boolean",
            showTitle: "خروجی excel",
            value: false
        },
        {
            name: "exportCSV",
            type: "boolean",
            showTitle: "خروجی csv",
            value: false
        },
        {
            name: "datatableManage",
            type: "boolean",
            showTitle: "شخصی سازی ستون",
            value: false
        },
        {
            name: "linkManage",
            type: "boolean",
            showTitle: "مدیریت لینک سازی",
            value: false
        },
        {
            name: "analyseContent",
            type: "boolean",
            showTitle: "تحلیل محتوا",
            value: false
        },
        {
            name: "manageTemplate",
            type: "boolean",
            showTitle: "مدیریت قالب",
            value: false
        },
        {
            name: "manageLanguage",
            type: "autoComplate",
            autoComplate: "",
            showTitle: "محدود کردن زبان",
            value: []
        },
        {
            name: "manageCategory",
            type: "autoComplate",
            autoComplate: "",
            showTitle: "محدود کردن دسته‌بندی",
            value: []
        },
    ]
});
exports.default = moduleAction;
