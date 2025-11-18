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
const controller_1 = __importDefault(require("./controller"));
const plugin_1 = require("../plugin");
const parameters_1 = require("../decorators/parameters");
const zod_1 = require("zod");
const fileManager_1 = require("../services/fileManager");
const fs_1 = __importDefault(require("fs"));
class DataExporter extends plugin_1.Plugin {
    constructor(client) {
        super();
        this.client = client;
    }
    async init() {
        return;
    }
    serve(...args) {
        var routes = [];
        routes.push({
            execs: this.exportPDF.bind(this),
            method: "post",
            route: "/export/pdf",
            meta: Reflect.getMetadata("exportPDF" + this.constructor.name, this)
        });
        routes.push({
            execs: this.exportPDFFromURL.bind(this),
            method: "post",
            route: "/export/pdf/url",
            meta: Reflect.getMetadata("exportPDFFromURL" + this.constructor.name, this)
        });
        routes.push({
            execs: this.exportCSV.bind(this),
            method: "post",
            route: "/export/csv",
            meta: Reflect.getMetadata("exportCSV" + this.constructor.name, this)
        });
        routes.push({
            execs: this.exportExcel.bind(this),
            method: "post",
            route: "/export/excel",
            meta: Reflect.getMetadata("exportExcel" + this.constructor.name, this)
        });
        return routes;
    }
    async exportPDF(dataList, pdfConfig, fields) {
        return controller_1.default.doExportPDF(dataList, pdfConfig, fields);
    }
    async exportExcel(dataList, excelConfig, fields) {
        return controller_1.default.doExportExcel(dataList, excelConfig, fields);
    }
    async exportCSV(dataList, csvConfig, fields) {
        return controller_1.default.doExportCSV(dataList, csvConfig, fields);
    }
    async exportPDFFromURL(url) {
        try {
            var file = await fileManager_1.DiskFileManager.downloadFile(url);
            if (!file.endsWith(".html")) {
                fs_1.default.renameSync(file, file + ".html");
                file = file + ".html";
            }
            return controller_1.default.doExportPDFFromFile(file);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = DataExporter;
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "dataList",
        schema: zod_1.z.array(zod_1.z.any())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "pdfConfig",
        schema: zod_1.z.any()
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "fields",
        schema: zod_1.z.any()
    }))
], DataExporter.prototype, "exportPDF", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "dataList",
        schema: zod_1.z.array(zod_1.z.any())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "excelConfig",
        schema: zod_1.z.any()
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "fields",
        schema: zod_1.z.any()
    }))
], DataExporter.prototype, "exportExcel", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "dataList",
        schema: zod_1.z.array(zod_1.z.any())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "csvConfig",
        schema: zod_1.z.any()
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "fields",
        schema: zod_1.z.any()
    }))
], DataExporter.prototype, "exportCSV", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "url",
        schema: controller_1.default.url
    }))
], DataExporter.prototype, "exportPDFFromURL", null);
