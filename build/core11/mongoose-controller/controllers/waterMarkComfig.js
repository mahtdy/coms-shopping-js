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
exports.WaterMarkController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/waterMarkConfig/repository"));
const zod_1 = require("zod");
const imageProccessing_1 = __importDefault(require("../../services/imageProccessing"));
const config_1 = __importDefault(require("../../services/config"));
const fileManager_1 = require("../../services/fileManager");
const fs_1 = __importDefault(require("fs"));
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
    resultAngle: zod_1.z.coerce.number().int().optional(),
    resultQuality: zod_1.z.coerce.number().int().positive().max(100).min(0).optional(),
    resultSize: zod_1.z.coerce.number().int().positive().optional(),
    resultTypes: zod_1.z.enum([
        "png",
        "jpg",
        "webp"
    ]).optional(),
    flipVertical: zod_1.z.boolean(),
    flipHorizontal: zod_1.z.boolean(),
    borderLeft: zod_1.z.coerce.number().int().min(0).optional(),
    borderRight: zod_1.z.coerce.number().int().min(0).optional(),
    borderTop: zod_1.z.coerce.number().int().min(0).optional(),
    borderBotton: zod_1.z.coerce.number().int().min(0).optional(),
    borderColor: zod_1.z.string().optional(),
    contrast: zod_1.z.coerce.number().int().max(100).min(-100).optional(),
    brightness: zod_1.z.coerce.number().int().max(100).min(-100).optional(),
    grayscale: zod_1.z.boolean().optional(),
    sepia: zod_1.z.boolean().optional(),
    filter: zod_1.z.enum([
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
    ]).optional()
});
class WaterMarkController extends controller_1.default {
    // @Post("")
    async create(data, session) {
        var _a, _b;
        if (data.configs == undefined) {
            data.configs = [];
        }
        if ((_a = session.config) === null || _a === void 0 ? void 0 : _a.configs) {
            let configs = (_b = session.config) === null || _b === void 0 ? void 0 : _b.configs;
            configs.push(...data.configs);
            data.configs = configs;
        }
        delete session['img'];
        session['config'] = {};
        try {
            let res = await super.create(data);
            res['session'] = session;
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async submit(image, files, session) {
        try {
            console.log("i", image);
            if (image) {
                session['img'] = image;
                session['config'] = {};
                image = config_1.default.getConfig("serverurl") + "/" + image.substring(4);
                // return new ApiResponse.SuccessResponse("succsess", {
                //     image
                // }).send(res)
                return {
                    status: 200,
                    data: {
                        image
                    },
                    session
                };
            }
            else {
                var name = Date.now() + ".jpg";
                fileManager_1.DiskFileManager.wirteStream("src/uploads/tmp/" + name, fs_1.default.createReadStream("src/uploads/filters/sample.jpg"));
                // var image: string = req.body.image
                image = config_1.default.getConfig("serverurl") + "/" + "uploads/tmp/" + name;
                session['img'] = "src/uploads/tmp/" + name;
                session['config'] = {};
                return {
                    status: 200,
                    data: {
                        image
                    },
                    session
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async refresh(session, body) {
        try {
            var img = session['img'];
            var config = this.cleanConfig(body);
            if (config.configs) {
                for (let i = 0; i < config.configs.length; i++) {
                    config.configs[i] = this.cleanConfig(config.configs[i]);
                }
            }
            img = await imageProccessing_1.default.refresh("src/uploads/tmp/", img, config);
            var ex = session['refreshd_image'];
            if (ex != undefined) {
                try {
                    await fileManager_1.DiskFileManager.removeFile(ex);
                }
                catch (error) {
                }
            }
            session['refreshd_image'] = img;
            var image = config_1.default.getConfig("serverurl") + "/" + img.substring(4);
            // return new ApiResponse.SuccessResponse("succsess", {
            //     image
            // }).send(res)
            // console.log(session)
            return {
                status: 200,
                data: {
                    image
                },
                session
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async edit(id, watermark) {
        return this.replaceOne({
            _id: id
        }, watermark);
    }
    async reset(session) {
        try {
            var name = Date.now() + ".jpg";
            fileManager_1.DiskFileManager.wirteStream("src/uploads/tmp/" + name, fs_1.default.createReadStream("src/uploads/filters/sample.jpg"));
            let image = config_1.default.getConfig("serverurl") + "/" + "uploads/tmp/" + name;
            let ex_img = session['img'];
            session['img'] = "src/uploads/tmp/" + name;
            session['config'] = {};
            if (ex_img != undefined) {
                try {
                    fileManager_1.DiskFileManager.removeFile(ex_img);
                }
                catch (error) {
                }
            }
            return {
                status: 200,
                data: {
                    image
                },
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async apply(session, body) {
        try {
            var img = session['img'];
            var config = this.cleanConfig(body);
            if (config.configs) {
                for (let i = 0; i < config.configs.length; i++) {
                    config.configs[i] = this.cleanConfig(config.configs[i]);
                }
            }
            let ex_img = session['img'];
            img = await imageProccessing_1.default.refresh("src/uploads/tmp/", img, config);
            session['img'] = img;
            if (session['config'] == undefined) {
                session['config'] = {};
            }
            if (session['config']['configs'] == undefined) {
                session['config']['configs'] = [];
            }
            session['config']['configs'].push(config.configs);
            var image = config_1.default.getConfig("serverurl") + "/" + img.substring(4);
            // return new ApiResponse.SuccessResponse("succsess", {
            //     image
            // }).send(res)
            // console.log(session)
            if (ex_img != undefined)
                fileManager_1.DiskFileManager.removeFile(ex_img);
            return {
                status: 200,
                data: {
                    image
                },
                session
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    cleanConfig(config) {
        var conf = {};
        for (const key in config) {
            if (config[key] != '') {
                conf[key] = config[key];
            }
        }
        return conf;
    }
    async getCurrent(session) {
        var image = session['img'];
        if (image == undefined) {
            var name = Date.now() + ".jpg";
            fileManager_1.DiskFileManager.wirteStream("src/uploads/tmp/" + name, fs_1.default.createReadStream("src/uploads/filters/sample.jpg"));
            // var image: string = req.body.image
            image = config_1.default.getConfig("serverurl") + "/" + "uploads/tmp/" + name;
            session['img'] = "src/uploads/tmp/" + name;
            session['config'] = {};
            return {
                status: 200,
                data: {
                    image
                },
                session
            };
        }
        return {
            data: {
                image: config_1.default.getConfig("serverurl") + "/" + image.substring(4)
            },
            status: 200
        };
    }
    findById(id, queryInfo) {
        return super.findById(id);
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/waterMarkes/search", "get", this.search.bind(this), controller_1.default.searcheMeta),
            this.addRoute("/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.WaterMarkController = WaterMarkController;
__decorate([
    __param(1, (0, parameters_1.Session)())
], WaterMarkController.prototype, "create", null);
__decorate([
    (0, method_1.Post)("/test/submit"),
    __param(0, (0, parameters_1.Body)({
        destination: "image"
    })),
    __param(1, (0, parameters_1.Files)({
        config: {
            name: "image",
            maxCount: 1,
            types: [
                "jpeg",
                "jpg",
                "png",
                "webp"
            ],
            dest: "src/uploads/tmp",
            // rename: true
        },
        destination: "image",
        mapToBody: true,
        isOptional: true,
        // skip :true
    })),
    __param(2, (0, parameters_1.Session)())
], WaterMarkController.prototype, "submit", null);
__decorate([
    (0, method_1.Post)("/refresh"),
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.any()
    }))
], WaterMarkController.prototype, "refresh", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: insertSchema
    }))
], WaterMarkController.prototype, "edit", null);
__decorate([
    (0, method_1.Post)("/reset"),
    __param(0, (0, parameters_1.Session)())
], WaterMarkController.prototype, "reset", null);
__decorate([
    (0, method_1.Post)("/apply"),
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.any()
    }))
], WaterMarkController.prototype, "apply", null);
__decorate([
    (0, method_1.Get)("/current"),
    __param(0, (0, parameters_1.Session)())
], WaterMarkController.prototype, "getCurrent", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id }))
], WaterMarkController.prototype, "findById", null);
const watermark = new WaterMarkController("/waterMark", new repository_1.default(), {
    insertSchema,
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
        paginationUrl: "/waterMarkes/search",
        searchUrl: "/waterMarkes/search",
        serverType: "",
        tableLabel: "waterMark",
        actions: [
            {
                route: "panel/watermark/edit/$_id",
                type: "edit",
                api: "",
                queryName: "",
                fromData: ["_id"]
            },
            {
                route: "panel/watermark",
                type: "insert",
                api: "",
                queryName: "",
                text: "اضافه کردن مورد جدید"
            },
            {
                route: "panel/watermark/delete",
                type: "delete",
                api: "/watermark",
                queryName: ""
            }
        ]
    },
    searchFilters: {
        lable: ["reg"]
    },
});
exports.default = watermark;
