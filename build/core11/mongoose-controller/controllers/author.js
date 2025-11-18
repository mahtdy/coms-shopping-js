"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorController = exports.csvConfig = exports.excelConfig = void 0;
const controller_1 = require("../basePage/controller");
const controller_2 = __importDefault(require("../controller"));
const model_1 = require("../repositories/author/model");
const repository_1 = __importDefault(require("../repositories/author/repository"));
const zod_1 = require("zod");
const style_1 = require("../style");
exports.excelConfig = {
    name: {
        displayName: 'Name',
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
    family: {
        displayName: 'Family',
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
};
exports.csvConfig = {
    fields: ['name', 'family'],
    fieldNames: ['Name', 'Family']
};
var pdfConfig = {
    path: "src/core/mongoose-controller/pdf.ejs",
    options: {
        "height": "90.25in",
        "width": "45.5in",
        "header": {
            "height": "20mm"
        },
        "footer": {
            "height": "20mm",
        },
        "childProcessOptions": {
            env: {
                OPENSSL_CONF: '/dev/null',
            },
        }
    },
    titles: ['Name', 'Family'],
    dataMap: ['name', 'family']
};
class AuthorController extends controller_1.BasePageController {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/authores/search", "get", this.search.bind(this), controller_2.default.searcheMeta);
    }
    async searchHelper(queryParam) {
        let query = {};
        if (queryParam["info$reg"]) {
            let qs = queryParam["info$reg"].split(" ");
            if (qs.length > 1) {
                query['$or'] = [
                    {
                        name: {
                            $regex: qs[0]
                        }
                    },
                    {
                        familyName: {
                            $regex: qs[1]
                        }
                    }
                ];
            }
            else {
                query['name'] = {
                    $regex: queryParam["info$reg"]
                };
            }
            delete queryParam["info$reg"];
        }
        let q = await super.searchHelper(queryParam);
        query = Object.assign(q, query);
        return query;
    }
}
exports.AuthorController = AuthorController;
var author = new AuthorController("/author", new repository_1.default({
    model: model_1.AuthorModel,
    typeName: "author",
    contentFunc: async function (url, category, language) {
        return "/author/" + url;
    },
    selectData: {
        type: 1,
        title: 1,
        mainImage: 1,
        author: 1,
        category: 1,
        publishDate: 1,
        insertDate: 1
    },
    sort: {
        "publishDate": {
            show: "زمان انتشار"
        },
        "insertDate": {
            show: "زمان انتشار"
        },
        "view": {
            show: "بازدید"
        }
    }
}), {
    insertSchema: zod_1.z.object({
        name: zod_1.z.string(),
        family: zod_1.z.string(),
        biography: zod_1.z.string(),
        image: zod_1.z.string()
    }).merge(controller_1.basePageZod),
    searchFilters: {
        name: ["reg"],
        family: ["reg"],
        id: ["eq"],
        info: ["reg"]
    },
    pdfConfig,
    excelConfig: exports.excelConfig,
    csvConfig: exports.csvConfig
});
exports.default = author;
