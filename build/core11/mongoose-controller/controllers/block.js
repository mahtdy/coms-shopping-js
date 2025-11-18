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
exports.menu = exports.hamberger = exports.nav = exports.header = exports.BlockController = void 0;
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/block/menu/repository"));
const zod_1 = require("zod");
const server_1 = __importDefault(require("react-dom/server"));
// import SS from "next/"
const repository_2 = __importDefault(require("../repositories/block/navbar/repository"));
const repository_3 = __importDefault(require("../repositories/block/hamberger/repository"));
const repository_4 = __importDefault(require("../repositories/block/header/repository"));
const react_1 = __importDefault(require("react"));
const repository_5 = __importDefault(require("../repositories/block/blockExport/repository"));
// @inheritRoutes
class BlockController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.blockType = options.blockType;
        this.blockExportRepo = new repository_5.default();
    }
    // @Post("/create")
    async createTemplate(name, dataType, dataMap, tsx, files, css, csses) {
        tsx = files[0].path;
        css = csses[0].path;
        return super.create({
            name,
            dataType,
            tsx,
            css,
            dataMap
        });
    }
    // @Post("/export")
    async exportJSX(id, config) {
        try {
            return {
                status: 200,
                data: await this.repository.exportJSX(id, config)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getForm(id) {
        try {
            let block = await this.repository.findById(id);
            if (block == null) {
                return {
                    status: 404
                };
            }
            console.log(block);
            return {
                data: block.dataMap
            };
        }
        catch (error) {
            throw error;
        }
    }
    // html = `<link rel="stylesheet" href="https://files.heyseo.ir/style/globals.css">` + `<link rel="stylesheet" href="https://files.heyseo.ir/style/temp.css">` + `<link rel="stylesheet" href="https://files.heyseo.ir/style/1704027179242.css">` + jsxBuffer
    // res.type('html');
    // jsxBuffer.pipe(res);
    // @Get("/check")
    async checkData(id) {
        try {
            var exported = await this.repository.getExported(id);
            if (exported == null) {
                return {
                    status: 400,
                    data: []
                };
            }
            const Com = require(exported.file.replace("src/", "../../../").replace(".jsx", ""));
            const Component = Com.default;
            // ReactDOMServer.renderToStaticMarkup(<Component data={ exported.json } />)
            var html = server_1.default.renderToString(react_1.default.createElement(Component, { data: exported.json }), {});
            // var html = ReactDOMServer.renderToStaticMarkup(Com.default(exported.json), {
            // })
            return {
                // sent: 
                data: html,
                html: true
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    initApis() {
        // this.addRouteWithMeta("/create", "post", this.createTemplate.bind(this), {
        //     "1": {
        //         index: 0,
        //         source: "body",
        //         schema: this.insertSchema,
        //         parseJson :true
        //     }
        // })
        this.addRouteWithMeta("/create", "post", this.createTemplate.bind(this), {
            "1": {
                destination: "name",
                schema: zod_1.z.string(),
                index: 0,
                source: "body"
            },
            "2": {
                destination: "dataType",
                schema: zod_1.z.enum(["static",
                    "dynamic"]),
                index: 1,
                source: "body"
            },
            "3": {
                destination: "dataMap",
                schema: zod_1.z.array(controller_1.default.search),
                parseJson: true,
                index: 2,
                source: "body"
            },
            "5": {
                destination: "file",
                index: 3,
                source: "body",
            },
            "4": {
                destination: "file",
                schema: zod_1.z.any().optional(),
                config: {
                    maxCount: 1,
                    rename: true,
                    dest: "src/uploads/frontend/",
                    name: "file",
                    types: ["tsx", "jsx"]
                },
                mapToBody: true,
                index: 4,
                source: "files"
            },
            "7": {
                destination: "css",
                index: 5,
                source: "body"
            },
            "6": {
                destination: "css",
                schema: zod_1.z.any().optional(),
                config: {
                    maxCount: 1,
                    rename: true,
                    dest: "src/uploads/frontend/",
                    name: "css",
                    types: ["css"]
                },
                mapToBody: true,
                index: 6,
                source: "files"
            },
        });
        this.addRouteWithMeta("/export", "post", this.exportJSX.bind(this), {
            "1": {
                destination: "id",
                schema: controller_1.default.id,
                index: 0,
                source: "body"
            },
            "2": {
                destination: "config",
                schema: controller_1.default.search,
                index: 1,
                source: "body"
            }
        });
        this.addRouteWithMeta("/check", "get", this.checkData.bind(this), {
            "1": {
                destination: "id",
                schema: controller_1.default.id,
                index: 0,
                source: "query"
            }
        });
        this.addRouteWithMeta("/form", "get", this.getForm.bind(this), {
            "1": {
                destination: "id",
                schema: controller_1.default.id,
                index: 0,
                source: "query"
            }
        });
        this.addRouteWithMeta("es/", "get", this.paginate.bind(this), controller_1.default.paginateMeta);
    }
}
exports.BlockController = BlockController;
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "config",
        schema: controller_1.default.search
    }))
], BlockController.prototype, "exportJSX", null);
const blockSchema = zod_1.z.object({
    name: zod_1.z.string(),
    dataType: zod_1.z.enum(["static",
        "dynamic"]),
    dataMap: zod_1.z.array(zod_1.z.any()),
});
class HeaderController extends BlockController {
}
exports.header = new HeaderController("/block/header", new repository_4.default(), {
    insertSchema: blockSchema.omit({}),
    blockType: "header"
});
class NavbarController extends BlockController {
}
exports.nav = new NavbarController("/block/navbar", new repository_2.default(), {
    insertSchema: blockSchema.omit({}),
    blockType: "navbar"
});
class HambergerController extends BlockController {
}
exports.hamberger = new HambergerController("/block/hamberger", new repository_3.default(), {
    insertSchema: blockSchema.omit({}),
    blockType: "hamberger"
});
// @inheritRoutes
class MenuController extends BlockController {
}
exports.menu = new MenuController("/block/menu", new repository_1.default(), {
    insertSchema: blockSchema.omit({}).merge(zod_1.z.object({
        type: zod_1.z.enum(["mega", "waterfall"])
    })),
    blockType: "menu"
});
let navbarData = {
    "title": "لیست منوها",
    "key": "list",
    "type": "array",
    "arrayType": "object",
    "dataFrom": "static",
    "object": [
        {
            "title": "text",
            "key": "عنوان",
            "type": "text",
            "required": true,
            dataFrom: "static"
        },
        {
            "title": "link",
            "key": "لینک",
            "type": "link",
            "required": false,
            dataFrom: "static"
        },
    ],
    children: [
        {
            "title": "زیرمنو",
            "key": "subMenu",
            "type": "component",
            "componentType": "menu",
            "required": false,
            "dataFrom": "static"
        }
    ],
    required: true
};
let abshariData = {
    "title": "لیست منوها",
    "key": "list",
    "type": "array",
    "arrayType": "object",
    "dataFrom": "static",
    "object": [
        {
            "title": "عنوان",
            "key": "text",
            "type": "text",
            "required": true,
            dataFrom: "static"
        },
        {
            "title": "لینک",
            "key": "link",
            "type": "link",
            "required": false,
            dataFrom: "static"
        },
        {
            "title": "آیکون",
            type: "mixed",
            mixedTypes: ["img", "svg"],
            dataFrom: "static",
            key: "icon",
            required: true,
            imageConfig: {
                width: 20,
                height: 20,
                validTypes: ["jpg", "png", "webp"]
            }
        }
    ],
    children: [{
            "title": "زیرمنو",
            "key": "subMenu",
            "type": "component",
            "componentType": "menu",
            "componentSubType": "abshari",
            "required": false,
            "dataFrom": "static"
        }],
    required: true
};
