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
exports.NotFoundLogController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/notFoundLog/repository"));
const zod_1 = require("zod");
const style_1 = require("../style");
class NotFoundLogController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async addRedirect(from, to) {
        return {};
    }
    initApis() {
        this.addRouteWithMeta("es", "get", this.paginate.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "page",
                schema: controller_1.default.page
            },
            "2": {
                index: 1,
                source: "query",
                destination: "limit",
                schema: controller_1.default.limit
            },
        });
        this.addRoute("s/exel", "get", this.exportExcel.bind(this));
        this.addRoute("s/csv", "get", this.exportCSV.bind(this));
        this.addRoute("s/pdf", "get", this.exportPDF.bind(this));
    }
}
exports.NotFoundLogController = NotFoundLogController;
__decorate([
    (0, method_1.Post)("/redirect"),
    __param(0, (0, parameters_1.Body)({
        destination: "from",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "to",
        schema: zod_1.z.string()
    }))
], NotFoundLogController.prototype, "addRedirect", null);
var excelConfig = {
    url: {
        displayName: 'URL',
        headerStyle: style_1.styles.headerOdd,
        cellFormat: function (value, row) {
            return decodeURI(value);
        },
        width: 120,
    },
    lastDate: {
        displayName: 'Last Date',
        headerStyle: style_1.styles.headerEven,
        cellStyle: style_1.styles.cellOdd,
        width: 60,
    },
    count: {
        displayName: 'Count',
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
};
var csvConfig = {
    fields: ['url', 'lastDate', 'count'],
    fieldNames: ['URL', 'Last Date', 'Count']
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
    titles: ['URL', 'Last Date', 'Count'],
    dataMap: ['url', 'lastDate', 'count']
};
var notFoundLog = new NotFoundLogController("/notFoundLog", new repository_1.default(), {
    excelConfig,
    csvConfig,
    pdfConfig
});
exports.default = notFoundLog;
