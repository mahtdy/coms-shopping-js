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
exports.VideoConfigController = void 0;
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/videoConfig/repository"));
const method_1 = require("../../decorators/method");
const zod_1 = require("zod");
var waterMarkConfig = zod_1.z.object({
    name: zod_1.z.string().optional(),
    type: zod_1.z.enum([
        "text",
        "image"
    ]).optional(),
    gravity: zod_1.z.enum([
        "NorthWest",
        "North",
        "NorthEast",
        "West",
        "Center",
        "East",
        "SouthWest",
        "South",
        "SouthEast"
    ]).optional(),
    imageAddress: zod_1.z.string().optional(),
    text: zod_1.z.string().optional(),
    textAlign: zod_1.z.enum([
        "center",
        "right",
        "left"
    ]).optional(),
    lineSpacing: zod_1.z.number().positive().optional(),
    wordSpacing: zod_1.z.number().positive().optional(),
    position_x: zod_1.z.number().positive(),
    position_y: zod_1.z.number().positive(),
    x: zod_1.z.coerce.number().int().positive().optional(),
    y: zod_1.z.coerce.number().int().positive().optional(),
    transparency: zod_1.z.coerce.number().int().positive().max(100).min(0).optional(),
    fontSize: zod_1.z.coerce.number().int().positive().min(1).optional(),
    fontColor: zod_1.z.string().optional(),
    fontName: zod_1.z.string().optional(),
    waterMarkSizeType: zod_1.z.enum([
        "relative",
        "fixed"
    ]).optional(),
    waterMarkSize: zod_1.z.number().positive().optional(),
    italic: zod_1.z.boolean().optional(),
    bold: zod_1.z.boolean().optional(),
    underline: zod_1.z.boolean().optional(),
    shadowOffsetX: zod_1.z.coerce.number().int().optional(),
    shadowOffsetY: zod_1.z.coerce.number().int().optional(),
    shadowBlur: zod_1.z.coerce.number().int().optional(),
    shadowColor: zod_1.z.string().default("black").optional(),
    strokeWidths: zod_1.z.coerce.number().int().optional(),
    strokeColor: zod_1.z.string().default('black').optional(),
    angle: zod_1.z.coerce.number().int().optional(),
    tile: zod_1.z.coerce.number().optional(),
    diagonalLines: zod_1.z.boolean().optional(),
    diagonalLinesColor: zod_1.z.string().optional(),
    backgroundColor: zod_1.z.string().optional(),
});
var insertSchema = zod_1.z.object({
    lable: zod_1.z.string(),
    configs: zod_1.z.array(waterMarkConfig).optional(),
});
class VideoConfigController extends controller_1.default {
    findById(id, queryInfo) {
        return super.findById(id);
    }
    async edit(id, watermark) {
        return this.replaceOne({
            _id: id
        }, watermark);
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/video-configes/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRouteWithMeta("es/search/list", "get", this.getSearchList.bind(this), {});
    }
}
exports.VideoConfigController = VideoConfigController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id }))
], VideoConfigController.prototype, "findById", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: insertSchema
    }))
], VideoConfigController.prototype, "edit", null);
const videoConfig = new VideoConfigController("/video-config", new repository_1.default(), {
    searchFilters: {
        lable: ["reg", "eq"]
    },
    paginationConfig: {
        fields: {
            lable: {
                en_title: "lable",
                fa_title: "برچسب",
                isOptional: false,
                sortOrderKey: false,
                type: "string"
            },
            filter: {
                en_title: "filter",
                fa_title: "فیلتر",
                isOptional: true,
                sortOrderKey: false,
                type: "string",
                isSelect: true,
                selectList: [
                    "amaro",
                    "clarendon",
                    "gingham",
                    "moon",
                    "lark",
                    "reyes",
                    "juno",
                    "slumber",
                    "crema",
                    "ludwig",
                    "aden",
                    "perpetua",
                    "mayfair",
                    "rise",
                    "hudson",
                    "valencia",
                    "x-pro2",
                    "sierra",
                    "willow",
                    "lo-fi",
                    "inkwell",
                    "hefe",
                    "nashville",
                    "stinson",
                    "vesper",
                    "earlybird",
                    "brannan",
                    "sutro",
                    "toaster",
                    "walden",
                    "1977",
                    "kelvin",
                    "maven",
                    "ginza",
                    "skyline",
                    "dogpatch",
                    "brooklyn",
                    "helena",
                    "ashby",
                    "charmes"
                ]
            }
        },
        paginationUrl: "/video-configes/search",
        searchUrl: "/video-configes/search",
        serverType: "",
        tableLabel: "video-config",
        actions: [
            {
                route: "panel/watermark/video/edit/$_id",
                type: "edit",
                api: "",
                queryName: "",
                fromData: ["_id"]
            },
            {
                route: "panel/watermark/video",
                type: "insert",
                api: "",
                queryName: "",
                text: "اضافه کردن مورد جدید"
            },
            {
                route: "panel/watermark/delete",
                type: "delete",
                api: "/video-config",
                queryName: ""
            }
        ]
    },
});
exports.default = videoConfig;
