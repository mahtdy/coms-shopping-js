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
exports.RedirectController = void 0;
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/redirect/repository"));
const node_1 = __importDefault(require("read-excel-file/node"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const method_1 = require("../../decorators/method");
const style_1 = require("../style");
const zod_1 = require("zod");
const repository_2 = __importDefault(require("../repositories/content/repository"));
var excelConfig = {
    type: {
        displayName: "Type",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
    from: {
        displayName: "From",
        headerStyle: style_1.styles.headerEven,
        cellFormat: function (value, row) {
            return decodeURI(value);
        },
        cellStyle: style_1.styles.cellEven,
        width: 400,
    },
    to: {
        displayName: "To",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        cellFormat: function (value, row) {
            return decodeURI(value);
        },
        width: 120,
    },
    code: {
        displayName: "Code",
        headerStyle: style_1.styles.headerEven,
        cellStyle: style_1.styles.cellEven,
        width: 120,
    },
    isAutomatic: {
        displayName: "Is Automatic",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
    external: {
        displayName: "Is External",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    }
};
var csvConfig = {
    fields: ["type", "from", "to", "code", "isAutomatic", "external"],
    fieldNames: ["Type", "From", "To", "Code", "Is Automatic", "Is External"]
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
                OPENSSL_CONF: "/dev/null",
            },
        }
    },
    titles: ["Type", "From", "To", "Code", "Is Automatic", "Is External"],
    dataMap: ["type", "from", "to", "code", "isAutomatic", "external"]
};
class RedirectController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.contentRepo = new repository_2.default();
    }
    async importExcel(files, file) {
        try {
            var rows = await (0, node_1.default)(file);
            var redirects = [];
            for (let i = 1; i < rows.length; i++) {
                redirects.push({
                    from: rows[i][1],
                    to: rows[i][2],
                    code: rows[i][3],
                    external: rows[i][4],
                });
            }
        }
        catch (error) {
            throw error;
        }
        return this.doImport(redirects);
    }
    async importCSV(files, file) {
        try {
            var redirects = await new Promise((resolve, reject) => {
                let results = [];
                fs_1.default.createReadStream(file, {
                    encoding: "utf8"
                })
                    .pipe((0, csv_parser_1.default)())
                    .on("data", (data) => {
                    results.push(data);
                })
                    .on("end", () => {
                    return resolve(results);
                });
            });
        }
        catch (error) {
            throw error;
        }
        return await this.doImport(redirects);
    }
    exportCSV(query, admin) {
        return super.exportCSV(query, admin);
    }
    exportExcel(query, admin) {
        return super.exportExcel(query, admin);
    }
    exportPDF(query, admin) {
        return super.exportPDF(query, admin);
    }
    // @Log
    async doImport(redirects) {
        try {
            var inserted = await this.repository.insertMany(redirects);
        }
        catch (error) {
            throw error;
        }
        var repetitive = {};
        for (let i = 0; i < inserted.length; i++) {
            repetitive[inserted[i].from + "*" + inserted[i].to] = true;
        }
        var notInserted = redirects.filter((elem, i) => {
            return repetitive[elem.from + "*" + elem.to] != true;
        });
        return {
            status: 200,
            data: {
                inserted,
                notInserted
            }
        };
    }
    async insertManyFromUrl(urls, redirect) {
        var redirects = [];
        for (let i = 0; i < urls.length; i++) {
            redirects.push(Object.assign(redirect, {
                from: urls[i]
            }));
        }
        return await this.doImport(redirects);
    }
    async checkRedirectExists(url) {
        try {
            let c = await this.contentRepo.findOne({
                url
            });
            var r = await this.repository.findOne({
                $or: [
                    {
                        from: c === null || c === void 0 ? void 0 : c._id
                    },
                    {
                        from: url
                    }
                ],
                status: true
            });
            console.log("r", r);
            return {
                data: r
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.RedirectController = RedirectController;
__decorate([
    (0, method_1.Post)("s/import/exel"),
    __param(0, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 1,
            size: parseInt((1 * 1048576).toString(), 10),
            types: ["xlsx", "xls"]
        },
        mapToBody: true,
        destination: "file"
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "file"
    }))
], RedirectController.prototype, "importExcel", null);
__decorate([
    (0, method_1.Post)("s/import/csv"),
    __param(0, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 1,
            size: parseInt((1 * 1048576).toString(), 10),
            types: ["csv"]
        },
        destination: "file",
        mapToBody: true
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "file"
    }))
], RedirectController.prototype, "importCSV", null);
__decorate([
    (0, method_1.Get)("s/export/csv"),
    __param(0, (0, parameters_1.Query)({})),
    __param(1, (0, parameters_1.Admin)())
], RedirectController.prototype, "exportCSV", null);
__decorate([
    (0, method_1.Get)("s/export/exel"),
    __param(0, (0, parameters_1.Query)({})),
    __param(1, (0, parameters_1.Admin)())
], RedirectController.prototype, "exportExcel", null);
__decorate([
    (0, method_1.Get)("s/export/pdf"),
    __param(0, (0, parameters_1.Query)({})),
    __param(1, (0, parameters_1.Admin)())
], RedirectController.prototype, "exportPDF", null);
__decorate([
    (0, method_1.Get)("/exists"),
    __param(0, (0, parameters_1.Query)({
        destination: "url",
        schema: zod_1.z.string()
    }))
], RedirectController.prototype, "checkRedirectExists", null);
var redirect = new RedirectController("/redirect", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        type: zod_1.z.enum(["regex", "1To1", "auto", "oldToNew"]).default("1To1"),
        from: zod_1.z.string(),
        to: zod_1.z.string(),
        regexConfig: zod_1.z.any().optional(),
        external: zod_1.z.boolean().default(false),
        code: zod_1.z.enum(["301", "302", "303", "304", "307", "308"]),
        fromStatic: zod_1.z.boolean().optional().default(false),
        toStatic: zod_1.z.boolean().optional().default(false),
        domain: controller_1.default.id.optional()
    }),
    csvConfig,
    excelConfig,
    pdfConfig
});
exports.default = redirect;
