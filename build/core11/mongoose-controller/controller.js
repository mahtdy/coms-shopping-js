"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationConfigs = void 0;
exports.CheckLog = CheckLog;
const controller_1 = __importDefault(require("../controller"));
const zod_1 = require("zod");
const parameters_1 = require("../decorators/parameters");
const style_1 = require("./style");
const excel = require('node-excel-export');
const { parse } = require('json2csv');
let ejs = require("ejs");
let pdf = require("html-pdf");
const _ = __importStar(require("lodash"));
const fs_1 = __importDefault(require("fs"));
exports.paginationConfigs = [];
function CheckLog(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        var self = this;
        try {
            var result = await originalMethod.apply(this, args);
            result.log = self.log;
            return result;
        }
        catch (err) {
            throw err;
        }
    };
    Object.defineProperty(descriptor.value, 'name', {
        writable: true,
        value: propertyKey
    });
    return descriptor;
}
;
const PDFBaseConfig = {
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
    titles: [],
    dataMap: []
};
const CSVBaseConfig = {
    fields: [],
    fieldNames: []
};
const ExcelBaseConfig = {};
const myRegex = /^[a-f\d]{24}$/i;
class BaseController extends controller_1.default {
    constructor(baseRoute, repository, options = {
        excelConfig: {},
        csvConfig: {},
        pdfConfig: {},
        population: []
    }) {
        super(baseRoute, options === null || options === void 0 ? void 0 : options.apiDoc);
        this.searchFilters = options.searchFilters || {};
        this.repository = repository;
        this.exelConfig = options.excelConfig;
        this.csvConfig = options.csvConfig;
        this.pdfConfig = options.pdfConfig;
        this.population = options.population;
        this.paginationConfig = options.paginationConfig;
        this.collectionName = options.collectionName;
        this.adminRepo = options.adminRepo;
        this.isAdminPaginate = options.isAdminPaginate;
        this.log = options.log;
        this.insertSchema = options.insertSchema || zod_1.z.any();
        this.initApis();
        // if(options.searchFilters) {
        //     this.add
        // }
        if (options.paginationConfig) {
            let i = exports.paginationConfigs.findIndex((val, i) => {
                var _b;
                return ((_b = options.paginationConfig) === null || _b === void 0 ? void 0 : _b.tableLabel) == val.tableLabel;
            });
            if (i == -1) {
                exports.paginationConfigs.push(options.paginationConfig);
            }
            this.addRouteWithMeta("/pagination/config", "get", this.getPaginationConfig.bind(this), _a.paginationConfMeta);
        }
    }
    ;
    addCustomfunction(func, args) {
        return func(args);
    }
    async create(data, ...params) {
        try {
            var data = await this.repository.insert(data);
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async insertMany(data, ...params) {
        try {
            var data = await this.repository.insertMany(data);
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async editById(id, query, injectResponse) {
        try {
            var document = await this.repository.findByIdAndUpdate(id, query);
        }
        catch (error) {
            throw error;
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد",
                data: {}
            };
        }
        if (injectResponse != undefined) {
            return {
                status: 200,
                data: injectResponse,
                message: " عملیات موفق"
            };
        }
        return {
            status: 200,
            data: document,
            message: "موفق"
        };
    }
    async editOne(filterQuery, query, injectResponse) {
        try {
            var document = await this.repository.findOneAndUpdate(filterQuery, query);
        }
        catch (error) {
            return {
                status: 400,
                message: "دیتای نامعتبر",
                data: {
                    message: error.message
                }
            };
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد",
                data: {}
            };
        }
        if (injectResponse != undefined) {
            return {
                status: 200,
                data: injectResponse,
                message: " عملیات موفق"
            };
        }
        return {
            status: 200,
            data: document,
            message: "موفق"
        };
    }
    async replaceOne(filterQuery, document, injectResponse) {
        try {
            await this.repository.replace(filterQuery, document);
            return {
                status: 200,
                data: injectResponse,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async findById(id, queryInfo) {
        try {
            var document = await this.repository.findById(id, queryInfo || {}, this.population);
        }
        catch (error) {
            console.log("error", error);
            throw error;
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد"
            };
        }
        return {
            status: 200,
            data: document,
            message: " عملیات موفق"
        };
    }
    async findOne(filterQuery, queryInfo) {
        try {
            var document = await this.repository.findOne(filterQuery, queryInfo || {}, this.population);
        }
        catch (error) {
            throw error;
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد"
            };
        }
        return {
            status: 200,
            data: document,
            message: " عملیات موفق"
        };
    }
    async checkExists(filterQuery) {
        try {
            return {
                status: 200,
                data: await this.repository.isExists(filterQuery),
                message: " عملیات موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async adminPaginate(page, limit, adminInfo, query = {}, options, ...params) {
        var _b, _c;
        try {
            if (this.collectionName == undefined)
                return this.paginate(page, limit, query, options);
            let admin = await ((_b = this.adminRepo) === null || _b === void 0 ? void 0 : _b.findById(adminInfo._id));
            if (admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin) {
                return {
                    status: 200,
                    data: await this.repository.paginate(query, limit, page, options)
                };
            }
            var dataMap = await ((_c = this.adminRepo) === null || _c === void 0 ? void 0 : _c.getSchemasByCollection(this.collectionName || "", adminInfo._id, (admin === null || admin === void 0 ? void 0 : admin.role) || "")) || [];
            if (options == undefined) {
                options = {};
            }
            let projection = {};
            for (let i = 0; i < dataMap.length; i++) {
                projection[dataMap[i]] = 1;
            }
            options.projection = projection;
            return this.paginate(page, limit, query, options);
        }
        catch (error) {
            return {
                status: 500,
                data: {}
            };
        }
    }
    async paginate(page, limit, query = {}, options, ...params) {
        try {
            return {
                status: 200,
                data: await this.repository.paginate(query, limit, page, options)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getConfigSchema(config, permission) {
    }
    async getConfigAction(config, permission) {
    }
    async getFieldsConf(admin, role, language) {
        var _b, _c, _d;
        var fields = _.cloneDeep((_b = this.paginationConfig) === null || _b === void 0 ? void 0 : _b.fields);
        let exists = await ((_c = this.adminRepo) === null || _c === void 0 ? void 0 : _c.isSchemaExists(this.collectionName || ""));
        if (!exists) {
            return fields;
        }
        var data = await ((_d = this.adminRepo) === null || _d === void 0 ? void 0 : _d.getSchemasByCollection(this.collectionName || "", admin, role));
        for (const key in fields) {
            if (!(data === null || data === void 0 ? void 0 : data.includes(key))) {
                delete fields[key];
            }
        }
        return fields;
    }
    async getPaginationConfig(adminInfo, session) {
        var _b, _c, _d;
        // console.log(this.paginationConfig?.tableLabel,session)
        if (this.adminRepo != undefined) {
            var conf = _.cloneDeep(this.paginationConfig);
            conf.fields = await this.adminRepo.translateLanguage(conf.fields, (_b = this.paginationConfig) === null || _b === void 0 ? void 0 : _b.tableLabel, session.language);
            return {
                status: 200,
                data: conf
            };
        }
        try {
            let admin = await this.adminRepo.findById(adminInfo._id);
            // console.log(this.paginationConfig?.fields)
            var conf = _.cloneDeep(this.paginationConfig);
            conf.fields = await this.adminRepo.translateLanguage(conf.fields, (_c = this.paginationConfig) === null || _c === void 0 ? void 0 : _c.tableLabel, session.language);
            if (admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin) {
                return {
                    status: 200,
                    data: conf
                };
            }
            var conf = _.cloneDeep(this.paginationConfig);
            conf.fields = await this.getFieldsConf(adminInfo._id, (admin === null || admin === void 0 ? void 0 : admin.role) || "");
            conf.fields = await this.adminRepo.translateLanguage(conf.fields, (_d = this.paginationConfig) === null || _d === void 0 ? void 0 : _d.tableLabel, session.language);
            console.log(conf);
            return {
                status: 200,
                data: conf
            };
        }
        catch (error) {
            console.log(error);
        }
        return {
            status: 200,
            data: this.paginationConfig
        };
    }
    async findMany(query, options) {
        try {
            return {
                data: await this.repository.findMany(query),
                message: "موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async delete(id, ...params) {
        try {
            return {
                status: 200,
                data: await this.repository.deleteById(id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async search(page, limit, reqQuery, admin, ...params) {
        var query = await this.searchHelper(reqQuery);
        // console.log("fuck" , query)
        if (reqQuery["_id$ne"]) {
            query["_id"] = {
                $ne: reqQuery["_id$ne"]
            };
        }
        if (this.collectionName != undefined || this.isAdminPaginate) {
            return this.adminPaginate(page, limit, admin, query, {
                sort: this.getSort(reqQuery)
            });
        }
        return await this.paginate(page, limit, query, {
            sort: this.getSort(reqQuery)
        });
    }
    getSearchList() {
        return {
            status: 200,
            data: this.searchFilters
        };
    }
    async searchHelper(queryParam = {}) {
        var query = {};
        for (const key in this.searchFilters) {
            var ands = [];
            for (let i = 0; i < this.searchFilters[key].length; i++) {
                if (queryParam[key + "$" + this.searchFilters[key][i]]) {
                    if (this.searchFilters[key][i] == "lte") {
                        var condition = {};
                        condition[key] = {
                            "$lte": queryParam[key + "$" + this.searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (this.searchFilters[key][i] == "gte") {
                        var condition = {};
                        condition[key] = {
                            "$gte": queryParam[key + "$" + this.searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (this.searchFilters[key][i] == "eq") {
                        var condition = {};
                        condition[key] = {
                            "$eq": queryParam[key + "$" + this.searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (this.searchFilters[key][i] == "list") {
                        var condition = {};
                        condition[key] = {
                            "$in": queryParam[key + "$" + this.searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (this.searchFilters[key][i] == "reg") {
                        var condition = {};
                        condition[key] = {
                            "$regex": new RegExp(queryParam[key + "$" + this.searchFilters[key][i]])
                        };
                        ands.push(condition);
                    }
                }
            }
            if (ands.length == 1) {
                query[key] = ands[0][key];
            }
            else if (ands.length > 1) {
                if (query["$and"]) {
                    query["$and"].push(ands);
                }
                else {
                    query["$and"] = ands;
                }
            }
        }
        return query;
    }
    static async customSearchHelper(queryParam = {}, searchFilters) {
        var query = {};
        for (const key in searchFilters) {
            var ands = [];
            for (let i = 0; i < searchFilters[key].length; i++) {
                if (queryParam[key + "$" + searchFilters[key][i]]) {
                    if (searchFilters[key][i] == "lte") {
                        var condition = {};
                        condition[key] = {
                            "$lte": queryParam[key + "$" + searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (searchFilters[key][i] == "gte") {
                        var condition = {};
                        condition[key] = {
                            "$gte": queryParam[key + "$" + searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (searchFilters[key][i] == "eq") {
                        var condition = {};
                        condition[key] = {
                            "$eq": queryParam[key + "$" + searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (searchFilters[key][i] == "list") {
                        var condition = {};
                        condition[key] = {
                            "$in": queryParam[key + "$" + searchFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (searchFilters[key][i] == "reg") {
                        var condition = {};
                        condition[key] = {
                            "$regex": new RegExp(queryParam[key + "$" + searchFilters[key][i]])
                        };
                        ands.push(condition);
                    }
                }
            }
            if (ands.length == 1) {
                query[key] = ands[0][key];
            }
            else if (ands.length > 1) {
                if (query["$and"]) {
                    query["$and"].push(ands);
                }
                else {
                    query["$and"] = ands;
                }
            }
        }
        return query;
    }
    static async getSort(queryParam = {}) {
        var sortKey = queryParam.sortKey || "_id";
        var sort = {};
        sort[sortKey] = -1;
        if (queryParam.sortOrderKey == "1") {
            sort[sortKey] = 1;
        }
        return sort;
    }
    getSort(queryParam = {}) {
        var sortKey = queryParam.sortKey || "_id";
        var sort = {};
        sort[sortKey] = -1;
        if (queryParam.sortOrderKey == "1") {
            sort[sortKey] = 1;
        }
        return sort;
    }
    async dataTransform(dataList) {
        return dataList;
    }
    async exportExcel(query, adminInfo, ...params) {
        var _b, _c;
        var fields = query === null || query === void 0 ? void 0 : query.fields;
        var query = await this.searchHelper(query);
        try {
            var dataList = await this.repository.findAll(query, {
                sort: this.getSort(query)
            }, this.population);
        }
        catch (error) {
            throw error;
        }
        if (this.collectionName == undefined) {
            return _a.doExportExcel(await this.dataTransform(dataList), this.exelConfig);
        }
        let admin = await ((_b = this.adminRepo) === null || _b === void 0 ? void 0 : _b.findById(adminInfo._id));
        if (admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin) {
            // return BaseController.doExportCSV(await this.dataTransform(dataList), this.csvConfig, this.pdfConfig.dataMap)
            return _a.doExportExcel(await this.dataTransform(dataList), this.exelConfig);
        }
        var dataMap = await ((_c = this.adminRepo) === null || _c === void 0 ? void 0 : _c.getSchemasByCollection(this.collectionName || "", adminInfo._id, (admin === null || admin === void 0 ? void 0 : admin.role) || ""));
        dataMap = dataMap === null || dataMap === void 0 ? void 0 : dataMap.reverse();
        return _a.doExportExcel(await this.dataTransform(dataList), this.exelConfig, dataMap);
    }
    static async doExportExcel(dataList = [], exelConfig, fields) {
        try {
            if (fields != undefined) {
                if (typeof fields == "string") {
                    fields = [fields];
                }
                let conf = {};
                for (let i = 0; i < fields.length; i++) {
                    if (exelConfig[fields[i]] != undefined) {
                        conf[fields[i]] = exelConfig[fields[i]];
                    }
                }
                exelConfig = conf;
            }
            var report = excel.buildExport([
                {
                    name: 'Report',
                    specification: exelConfig,
                    data: dataList
                }
            ]);
            return {
                responseHeader: {
                    'Content-Type': 'application/vnd.openxmlformats',
                    "Content-Disposition": "attachment; filename=" + "Report.xlsx"
                },
                json: false,
                data: report
            };
        }
        catch (error) {
            // console.log(error)
            throw error;
        }
    }
    async exportCSV(query, adminInfo, ...params) {
        var _b, _c;
        var fields = query === null || query === void 0 ? void 0 : query.fields;
        var query = await this.searchHelper(query);
        try {
            var dataList = await this.repository.findAll(query, {
                sort: this.getSort(query)
            }, this.population);
        }
        catch (error) {
            throw error;
        }
        if (this.collectionName == undefined) {
            return _a.doExportCSV(await this.dataTransform(dataList), this.csvConfig);
        }
        let admin = await ((_b = this.adminRepo) === null || _b === void 0 ? void 0 : _b.findById(adminInfo._id));
        if (admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin) {
            return _a.doExportCSV(await this.dataTransform(dataList), this.csvConfig);
        }
        var dataMap = await ((_c = this.adminRepo) === null || _c === void 0 ? void 0 : _c.getSchemasByCollection(this.collectionName || "", adminInfo._id, (admin === null || admin === void 0 ? void 0 : admin.role) || ""));
        dataMap = dataMap === null || dataMap === void 0 ? void 0 : dataMap.reverse();
        return _a.doExportCSV(await this.dataTransform(dataList), this.csvConfig, dataMap);
    }
    static async doExportCSV(dataList = [], csvConfig, fieldss) {
        try {
            if (fieldss != undefined) {
                if (typeof fieldss == "string") {
                    fieldss = [fieldss];
                }
                // exelConfig = conf
                let fieldNames = [];
                for (let i = 0; i < csvConfig.fields.length; i++) {
                    if (fieldss.includes(csvConfig.fields[i])) {
                        fieldNames.push(csvConfig.fields[i]);
                    }
                }
                csvConfig.fields = fieldNames;
            }
            var data = parse(dataList, { fields: csvConfig.fields, fieldNames: csvConfig.fieldNames });
            return {
                responseHeader: {
                    "Content-Disposition": "attachment; filename=" + "result.csv"
                },
                json: false,
                data: data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async exportPDF(query, adminInfo, ...params) {
        var _b, _c;
        var fields = query === null || query === void 0 ? void 0 : query.fields;
        var query = await this.searchHelper(query);
        try {
            var dataList = await this.repository.findAll(query, {
                sort: this.getSort(query)
            }, this.population);
        }
        catch (error) {
            throw error;
        }
        if (this.collectionName == undefined) {
            return _a.doExportPDF(await this.dataTransform(dataList), this.pdfConfig, this.pdfConfig.dataMap);
        }
        let admin = await ((_b = this.adminRepo) === null || _b === void 0 ? void 0 : _b.findById(adminInfo._id));
        if (admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin) {
            return _a.doExportPDF(await this.dataTransform(dataList), this.pdfConfig, this.pdfConfig.dataMap);
        }
        var dataMap = await ((_c = this.adminRepo) === null || _c === void 0 ? void 0 : _c.getSchemasByCollection(this.collectionName || "", adminInfo._id, (admin === null || admin === void 0 ? void 0 : admin.role) || ""));
        dataMap = dataMap === null || dataMap === void 0 ? void 0 : dataMap.reverse();
        return _a.doExportPDF(await this.dataTransform(dataList), this.pdfConfig, dataMap);
    }
    static async doExportPDF(dataList = [], pdfConfig, fields) {
        try {
            if (fields != undefined) {
                if (typeof fields == "string") {
                    fields = [fields];
                }
                let conf = {};
                var fieldss = [];
                var dataMapss = [];
                for (let i = 0; i < fields.length; i++) {
                    // conf[fields[i]] = exelConfig[fields[i]]
                    let j = pdfConfig.dataMap.findIndex((value) => {
                        return value == fields[i];
                    });
                    if (j != -1) {
                        dataMapss.push(pdfConfig.dataMap[j]);
                        fieldss.push(pdfConfig.titles[j]);
                    }
                }
                pdfConfig.titles = fieldss;
                pdfConfig.dataMap = dataMapss;
                // exelConfig = conf
            }
            return await new Promise((resolve, reject) => {
                ejs.renderFile(pdfConfig.path, { dataList: dataList, titles: pdfConfig.titles, dataMap: pdfConfig.dataMap }, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        pdf.create(data, pdfConfig.options).toBuffer(function (err, data) {
                            if (err) {
                                return reject(err);
                            }
                            else {
                                return resolve({
                                    responseHeader: {
                                        'Content-Type': 'application/pdf',
                                        "Content-Disposition": "attachment; filename=" + "result.pdf"
                                    },
                                    json: false,
                                    data
                                });
                            }
                        });
                    }
                });
            });
        }
        catch (error) {
            throw error;
        }
    }
    static async doExportPDFFromFile(file) {
        console.log(file);
        return new Promise((resolve, reject) => {
            var html = fs_1.default.readFileSync(file, 'utf8');
            var options = {
                "format": "A4",
                "orientation": "portrait",
                "border": "0",
                "dpi": 250,
                "childProcessOptions": {
                    "detached": true,
                    env: {
                        OPENSSL_CONF: '/dev/null',
                    },
                },
                "renderDelay": 1000
            };
            pdf.create(html, options).toBuffer(function (err, data) {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                else {
                    return resolve({
                        responseHeader: {
                            'Content-Type': 'application/pdf',
                            "Content-Disposition": "attachment; filename=" + "result.pdf"
                        },
                        json: false,
                        data
                    });
                }
            });
        });
    }
    async validatePermission(permissionData) {
        let checkList = permissionData.dataCheck;
        for (let i = 0; i < checkList.length; i++) {
            if (checkList[i].compration == "eqaul") {
                if (permissionData.permissionData[checkList[i].key] != checkList[i].values) {
                    return false;
                }
            }
            else {
                if (!permissionData.permissionData[checkList[i].key].includes(checkList[i].values)) {
                    return false;
                }
            }
        }
        return true;
    }
    async transformData(permissionData) {
        let data = permissionData.data;
        let checkList = permissionData.dataCheck;
        for (let i = 0; i < checkList.length; i++) {
            var targetKey = checkList[i].targetKey || checkList[i].key;
            if (checkList[i].compration == "eqaul") {
                if (permissionData.permissionData[checkList[i].key] != checkList[i].values) {
                    // console.log(targetKey)
                    delete data[targetKey];
                }
            }
            else {
                if (!permissionData.permissionData[checkList[i].key].includes(checkList[i].values)) {
                    delete data[targetKey];
                }
            }
        }
        return data;
    }
    async getPDFConfig(fields) {
        let pdf = { ...PDFBaseConfig };
        for (const key in fields) {
            pdf.dataMap.push(fields[key].en_title);
            pdf.titles.push(fields[key].fa_title);
        }
        return pdf;
        this.pdfConfig = pdf;
    }
    async getCSVConfig(fields) {
        let csv = { ...CSVBaseConfig };
        for (const key in fields) {
            csv.fields.push(fields[key].en_title);
            csv.fieldNames.push(fields[key].fa_title);
        }
        return csv;
    }
    async getExcelConfig(fields) {
        let excel = { ...ExcelBaseConfig };
        for (const key in fields) {
            excel[fields[key].en_title] = {
                displayName: fields[key].fa_title,
                headerStyle: style_1.styles.headerOdd,
                cellStyle: style_1.styles.cellOdd,
                width: 120,
            };
        }
        return excel;
    }
    async addExportRoutes() {
        if (this.paginationConfig) {
            this.csvConfig = await this.getCSVConfig(this.paginationConfig.fields);
            this.exelConfig = await this.getExcelConfig(this.paginationConfig.fields);
            this.pdfConfig = await this.getPDFConfig(this.paginationConfig.fields);
        }
        this.addRouteWithMeta("s/exel", "get", this.exportExcel.bind(this), _a.exportMeta);
        this.addRouteWithMeta("s/csv", "get", this.exportCSV.bind(this), _a.exportMeta);
        this.addRouteWithMeta("s/pdf", "get", this.exportPDF.bind(this), _a.exportMeta);
    }
    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        var pg = this.baseRoute.endsWith("e") ? "s" : "es";
        if (this.collectionName == undefined && this.isAdminPaginate != true) {
            this.addRouteWithMeta(pg, "get", this.paginate.bind(this), Object.assign(_a.paginateMeta, { absolute: false }));
        }
        else {
            this.addRouteWithMeta(pg, "get", this.adminPaginate.bind(this), Object.assign(_a.adminPaginateMeta, { absolute: false }));
        }
        this.addRouteWithMeta("", "delete", this.delete.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: _a.id
            },
        });
    }
}
_a = BaseController;
BaseController.page = zod_1.z.coerce.number().positive().default(1);
BaseController.limit = zod_1.z.coerce.number().positive().default(10);
BaseController.url = zod_1.z.string().regex(/\w+(\/[\w-]+)+/);
BaseController.phone = zod_1.z.string().regex(/^[0][9][01239][0-9]{8,8}$/);
BaseController.email = zod_1.z.string().email();
BaseController.totp = zod_1.z.string().length(6).regex(/^[0-9]*$/);
BaseController.booleanFromquery = zod_1.z.enum(["true", "false"]).transform((data) => data == "true");
BaseController.password = zod_1.z.string().min(8).default("admin123456@");
BaseController.date = zod_1.z.string().regex(/^(?:(?:19|20)\d{2})-(?:(?:0[1-9]|1[0-2]))-(?:(?:0[1-9]|1\d|2[0-8])|(29|30)(?!(?:-02))|31(?=(?:-0[13578]|-1[02]))|29(?=-02-(?:19|20)(?:[02468][048]|[13579][26])))$/);
BaseController.time = zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
BaseController.shaba = zod_1.z.string().regex(/^IR[0-9]{24}$/);
BaseController.card = zod_1.z.string().regex(/^[1-9][0-9]{15}$/);
BaseController.ip = zod_1.z.string().regex(/^(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(((([0-9a-fA-F]){1,4})\:){7}([0-9a-fA-F]){1,4})$/);
BaseController.id = zod_1.z.string()
    .transform((val) => {
    if (typeof val !== 'string')
        return undefined;
    return myRegex.test(val) ? val : undefined;
});
BaseController.address = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    state: zod_1.z.string(),
    city: zod_1.z.string(),
    cityPart: zod_1.z.string().optional(),
    street: zod_1.z.string().optional(),
    address: zod_1.z.string(),
    plaque: zod_1.z.string(),
    _id: _a.id.optional(),
    unit: zod_1.z.number().optional(),
    type: zod_1.z.string().optional(),
    title: zod_1.z.string().optional()
});
BaseController.search = zod_1.z.record(zod_1.z.string(), zod_1.z.any());
BaseController.random = zod_1.z.coerce.number().positive().max(99999).min(10000);
BaseController.paginateMeta = {
    "1": {
        index: 0,
        source: "query",
        destination: "page",
        schema: _a.page
    },
    "2": {
        index: 1,
        source: "query",
        destination: "limit",
        schema: _a.limit
    }
};
BaseController.adminPaginateMeta = {
    "1": {
        index: 0,
        source: "query",
        destination: "page",
        schema: _a.page
    },
    "2": {
        index: 1,
        source: "query",
        destination: "limit",
        schema: _a.limit
    },
    "3": {
        index: 2,
        source: "admin"
    }
};
BaseController.findByIdMeta = {
    "1": {
        index: 0,
        source: "query",
        destination: "id",
        schema: _a.id
    }
};
BaseController.searcheMeta = {
    "1": {
        index: 0,
        source: "query",
        destination: "page",
        schema: _a.page
    },
    "2": {
        index: 1,
        source: "query",
        destination: "limit",
        schema: _a.limit
    },
    "3": {
        index: 2,
        source: "query",
        destination: "params",
        schema: _a.search,
    },
    "4": {
        index: 3,
        source: "admin"
    }
};
BaseController.paginationConfMeta = {
    "1": {
        index: 0,
        source: "admin",
    },
    "2": {
        index: 1,
        source: "session"
    }
};
BaseController.exportMeta = {
    "0": {
        index: 0,
        source: "query"
    },
    "1": {
        index: 1,
        source: "admin",
    },
};
exports.default = BaseController;
__decorate([
    CheckLog
], BaseController.prototype, "create", null);
__decorate([
    CheckLog
], BaseController.prototype, "insertMany", null);
__decorate([
    CheckLog
], BaseController.prototype, "editById", null);
__decorate([
    CheckLog
], BaseController.prototype, "editOne", null);
__decorate([
    CheckLog
], BaseController.prototype, "replaceOne", null);
__decorate([
    __param(0, (0, parameters_1.Admin)()),
    __param(1, (0, parameters_1.Session)())
], BaseController.prototype, "getPaginationConfig", null);
__decorate([
    CheckLog
], BaseController.prototype, "delete", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        schema: zod_1.z.record(zod_1.z.string(), zod_1.z.any())
    })),
    __param(1, (0, parameters_1.Admin)())
], BaseController.prototype, "exportPDF", null);
