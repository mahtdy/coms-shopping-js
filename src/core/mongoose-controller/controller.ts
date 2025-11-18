
import { Types, Document, UpdateQuery, FilterQuery } from 'mongoose';
import BaseRepositoryService, { QueryInfo } from "./repository"
import Controller, { Response } from '../controller';

import { ZodSchema, z } from "zod";
import { RouteMeta } from '../controller';
import { Admin, Query, Session } from '../decorators/parameters';
import { AdminInfo } from './auth/admin/admin-logIn';
import AdminRepository from './repositories/admin/repository';
import { BaseAdmin } from './repositories/admin/model';
import { styles } from './style';

const excel = require('node-excel-export');
const { parse } = require('json2csv');
let ejs = require("ejs");
let pdf = require("html-pdf");
import * as _ from 'lodash';

import RandExp from 'randexp';

import fs from "fs"

export var paginationConfigs: PaginationConfig[] = []

export function CheckLog(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {

        var self = this as BaseController<Document>

        try {
            var result: Response = await originalMethod.apply(this, args);
            result.log = self.log
            return result;
        } catch (err) {
            throw err;

        }
    };
    Object.defineProperty(descriptor.value, 'name', {
        writable: true,
        value: propertyKey
    });
    return descriptor

};


interface TableAction {
    type: string,
    api: string,
    route: string,
    enableFunc?: any,
    showFunc?: any,
    routeFunc?: any,
    queryName: string,
    fromData?: string[],
    text?: string
}

export interface AutoComplete {
    url: string,
    key: string,
    target_value?: string,
    target_func?: string,
    fields?: string[],
    target_idKey: string,
    isopen_sub: boolean,
    values: any[],
    selected_values?: any[]
}

export interface FieldProperty {
    en_title: string,
    fa_title: string,
    object_value?: string[],
    sortOrderKey: boolean,
    filter_name?: string,
    // checked: boolean, 
    type: "date" | "number" | "string" | "boolean" | "link" | "score",
    filters?: ("list" | "lte" | "gte" | "eq" | "reg")[],
    isAutoComplate?: boolean,
    isOptional: boolean,
    target_func?: string,
    // clicked: boolean, 
    // values: any, 
    // position_x?: number, 
    // position_y?: number, 
    // is_open: boolean, 
    autoComplete?: AutoComplete,
    islong?: boolean,
    sideImage?: string,
    isSelect?: boolean,
    selectList?: string[],
    customTab?: string,
    translator?: any
}


export interface Tab {
    title: string,
    preQuery?: any,
    enTitle?: string,
    icon: string
}


export interface PaginationConfig {
    fields: {
        [key: string]: FieldProperty
    },
    searchUrl: string,
    paginationUrl: string,
    exportpdfUrl?: string,
    exportexelUrl?: string,
    exportcsvUrl?: string,
    serverType: string,
    tableLabel: string,
    actions?: TableAction[],
    auto_search_url?: string,
    auto_search_values?: any[],
    auto_search_key?: string,
    auto_search_submit?: string,
    auto_search_title?: string,
    auto_filter_name?: string,
    auto_filter_idKey?: string,
    canCustomizeTable?: boolean,

    tabs?: Tab[]
    // sorts : any 
}


export interface ControllerOptions {
    excelConfig?: any
    csvConfig?: any
    pdfConfig?: any
    population?: any,
    insertSchema?: ZodSchema,
    paginationConfig?: PaginationConfig,
    searchFilters?: any,
    log?: boolean,
    apiDoc?: any
    collectionName?: string,
    adminRepo?: AdminRepository<BaseAdmin>,
    isAdminPaginate?: boolean
}


// interface PaginateOptions{
//     query : FilterQuery< Document>
// }

interface PermissionData {
    permissionData: any | any[]
    dataCheck: {
        key: string,
        targetKey?: string,
        compration: "eqaul" | 'includes',
        values: any
    }[]
}

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
}

const CSVBaseConfig = {
    fields: [],
    fieldNames: []
}

const ExcelBaseConfig = {

}

const IdRegex = /^[a-f\d]{24}$/ 
const idGen = new RandExp(IdRegex)

export default class BaseController<T extends Document> extends Controller {
    public repository: BaseRepositoryService<T>;
    public searchFilters: any;
    public exelConfig?: any
    public csvConfig?: any
    public pdfConfig?: any
    public paginationConfig?: PaginationConfig
    public population?: any
    public log?: boolean
    public collectionName?: string
    public adminRepo?: AdminRepository<BaseAdmin>
    public isAdminPaginate?: boolean

    insertSchema?: ZodSchema
    static page = z.coerce.number().positive().default(1)
    static limit = z.coerce.number().positive().default(10)
    static url = z.string().regex(/\w+(\/[\w-]+)+/)
    static phone = z.string().regex(/^[0][9][01239][0-9]{8,8}$/)
    static email = z.string().email()
    static totp = z.string().length(6).regex(/^[0-9]*$/)

    static booleanFromquery = z.enum(["true", "false"]).transform((data: "true" | "false") => data == "true")
    static arrayFromForm = z.string().transform( (data : string) => JSON.parse(data) )
    static numberFromForm = z.string().transform( (data : string) => Number(data) )
    static password = z.string().min(8).default("admin123456@")
    static date = z.string().regex(/^(?:(?:19|20)\d{2})-(?:(?:0[1-9]|1[0-2]))-(?:(?:0[1-9]|1\d|2[0-8])|(29|30)(?!(?:-02))|31(?=(?:-0[13578]|-1[02]))|29(?=-02-(?:19|20)(?:[02468][048]|[13579][26])))$/)
    static time = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)

    static shaba = z.string().regex(/^IR[0-9]{24}$/)
    static card = z.string().regex(/^[1-9][0-9]{15}$/)

    static ip = z.string().regex(/^(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(((([0-9a-fA-F]){1,4})\:){7}([0-9a-fA-F]){1,4})$/)

    static id = z.string().regex(/^[a-f\d]{24}$/i)
        
    static address = z.object({
        x: z.number(),
        y: z.number(),
        state: z.string(),
        city: z.string(),
        cityPart: z.string().optional(),
        street: z.string().optional(),
        address: z.string(),
        plaque: z.string(),
        _id: this.id.optional(),
        unit: z.number().optional(),
        type: z.string().optional(),
        title: z.string().optional()
    })
    static search = z.record(z.string(), z.any())
    static random = z.coerce.number().positive().max(99999).min(10000)
    static paginateMeta: RouteMeta = {
        "1": {
            index: 0,
            source: "query",
            destination: "page",
            schema: BaseController.page
        },
        "2": {
            index: 1,
            source: "query",
            destination: "limit",
            schema: BaseController.limit
        }
    }

    static adminPaginateMeta: RouteMeta = {
        "1": {
            index: 0,
            source: "query",
            destination: "page",
            schema: BaseController.page
        },
        "2": {
            index: 1,
            source: "query",
            destination: "limit",
            schema: BaseController.limit
        },
        "3": {
            index: 2,
            source: "admin"
        }
    }
    static findByIdMeta: RouteMeta = {
        "1": {
            index: 0,
            source: "query",
            destination: "id",
            schema: BaseController.id
        }
    }
    static searcheMeta: RouteMeta = {
        "1": {
            index: 0,
            source: "query",
            destination: "page",
            schema: BaseController.page
        },
        "2": {
            index: 1,
            source: "query",
            destination: "limit",
            schema: BaseController.limit
        },
        "3": {
            index: 2,
            source: "query",
            destination: "params",
            schema: BaseController.search,
        },
        "4": {
            index: 3,
            source: "admin"
        }
    }
    static paginationConfMeta: RouteMeta = {
        "1": {
            index: 0,
            source: "admin",
        },
        "2": {
            index: 1,
            source: "session"
        }
    }
    static exportMeta: RouteMeta = {
        "0": {
            index: 0,
            source: "query"
        },
        "1": {
            index: 1,
            source: "admin",
        },
    }


    constructor(baseRoute: string, repository: BaseRepositoryService<T>,
        options: ControllerOptions = {
            excelConfig: {},
            csvConfig: {},
            pdfConfig: {},
            population: []
        },) {
        super(baseRoute, options?.apiDoc)
        this.searchFilters = options.searchFilters || {}

        this.repository = repository
        this.exelConfig = options.excelConfig
        this.csvConfig = options.csvConfig
        this.pdfConfig = options.pdfConfig
        this.population = options.population
        this.paginationConfig = options.paginationConfig
        this.collectionName = options.collectionName
        this.adminRepo = options.adminRepo
        this.isAdminPaginate = options.isAdminPaginate

        this.log = options.log
        this.insertSchema = options.insertSchema || z.any()
        this.initApis()



        // if(options.searchFilters) {
        //     this.add
        // }

        if (options.paginationConfig) {
            let i = paginationConfigs.findIndex((val: PaginationConfig, i) => {
                return options.paginationConfig?.tableLabel == val.tableLabel
            })
            if (i == -1) {
                paginationConfigs.push(options.paginationConfig)
            }
            this.addRouteWithMeta("/pagination/config", "get", this.getPaginationConfig.bind(this), BaseController.paginationConfMeta)
        }
    };




    addCustomfunction(func: Function, args: any) {
        return func(args)
    }


    @CheckLog
    async create(data: T, ...params: [...any]): Promise<Response> {
        try {
            var data = await this.repository.insert(data) as T
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }


    @CheckLog
    async insertMany(data: T[], ...params: [...any]): Promise<Response> {
        try {
            var data = await this.repository.insertMany(data)
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }


    @CheckLog
    async editById(id: Types.ObjectId | string, query: UpdateQuery<T>, injectResponse?: any): Promise<Response> {
        try {
            var document: T | null = await this.repository.findByIdAndUpdate(id, query)
        } catch (error: any) {
            throw error
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد",
                data: {}
            }
        }
        if (injectResponse != undefined) {
            return {
                status: 200,
                data: injectResponse,
                message: " عملیات موفق"
            }
        }
        return {
            status: 200,
            data: document,
            message: "موفق"
        }
    }

    @CheckLog
    async editOne(filterQuery: FilterQuery<T>, query: UpdateQuery<T>, injectResponse?: any,): Promise<Response> {
        try {
            var document: T | null = await this.repository.findOneAndUpdate(filterQuery, query)
        } catch (error: any) {
            return {
                status: 400,
                message: "دیتای نامعتبر",
                data: {
                    message: error.message
                }
            }
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد",
                data: {}
            }
        }
        if (injectResponse != undefined) {
            return {
                status: 200,
                data: injectResponse,
                message: " عملیات موفق"
            }
        }
        return {
            status: 200,
            data: document,
            message: "موفق"
        }
    }

    @CheckLog
    async replaceOne(filterQuery: FilterQuery<T>, document: T, injectResponse?: any): Promise<Response> {
        try {
            await this.repository.replace(filterQuery, document)
            return {
                status: 200,
                data: injectResponse,
            }
        } catch (error) {
            throw error
        }
    }

    async findById(id: string | Types.ObjectId, queryInfo?: QueryInfo): Promise<Response> {


        try {
            var document: T | null = await this.repository.findById(id, queryInfo || {}, this.population)
        } catch (error) {
            console.log("error", error)
            throw error
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد"
            }
        }
        return {
            status: 200,
            data: document,
            message: " عملیات موفق"
        }
    }

    async findOne(filterQuery: FilterQuery<T>, queryInfo?: QueryInfo): Promise<Response> {
        try {
            var document: T | null = await this.repository.findOne(filterQuery, queryInfo || {}, this.population)
        } catch (error) {
            throw error
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد"
            }
        }
        return {
            status: 200,
            data: document,
            message: " عملیات موفق"
        }
    }

    async checkExists(filterQuery: FilterQuery<T>): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.repository.isExists(filterQuery),
                message: " عملیات موفق"
            }
        } catch (error) {
            throw error
        }
    }

    async adminPaginate(page: number, limit: number, adminInfo: AdminInfo, query: FilterQuery<T> = {}, options?: QueryInfo, ...params: [...any]): Promise<Response> {
        try {
            if (this.collectionName == undefined)
                return this.paginate(page, limit, query, options)
            let admin = await this.adminRepo?.findById(adminInfo._id)

            if (admin?.isSuperAdmin) {
                return {
                    status: 200,
                    data: await this.repository.paginate(query, limit, page, options)
                }
            }
            var dataMap = await this.adminRepo?.getSchemasByCollection(this.collectionName || "", adminInfo._id, admin?.role as string || "") || []
            if (options == undefined) {
                options = {}
            }

            let projection: any = {}
            for (let i = 0; i < dataMap.length; i++) {
                projection[dataMap[i]] = 1
            }

            options.projection = projection

            return this.paginate(page, limit, query, options)
        } catch (error) {
            return {
                status: 500,
                data: {}
            }
        }
    }

    async paginate(page: number, limit: number, query: FilterQuery<T> = {}, options?: QueryInfo, ...params: [...any]): Promise<Response> {
        console.log("paginate")
        try {
            return {
                status: 200,
                data: await this.repository.paginate(query, limit, page, options)
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async getConfigSchema(config: any, permission: any) {

    }

    async getConfigAction(config: any, permission: any) {

    }


    async getFieldsConf(admin: string, role: string, language?: string): Promise<{
        [key: string]: FieldProperty
    }> {
        var fields = _.cloneDeep(this.paginationConfig?.fields as {
            [key: string]: FieldProperty
        })
        let exists = await this.adminRepo?.isSchemaExists(this.collectionName || "")

        if (!exists) {

            return fields
        }



        var data = await this.adminRepo?.getSchemasByCollection(this.collectionName || "", admin, role)

        for (const key in fields) {
            if (!data?.includes(key)) {
                delete fields[key]
            }
        }


        return fields
    }

    async getPaginationConfig(@Admin() adminInfo: AdminInfo, @Session() session: any): Promise<Response> {
        // console.log(this.paginationConfig?.tableLabel,session)
        if (this.adminRepo != undefined) {
            var conf: any = _.cloneDeep(this.paginationConfig)
            conf.fields = await (this.adminRepo as any).translateLanguage(conf.fields, this.paginationConfig?.tableLabel, session.language)
            return {
                status: 200,
                data: conf
            }
        }

        try {
            let admin = await (this.adminRepo as any).findById(adminInfo._id)
            // console.log(this.paginationConfig?.fields)
            var conf: any = _.cloneDeep(this.paginationConfig)
            conf.fields = await (this.adminRepo as any).translateLanguage(conf.fields, this.paginationConfig?.tableLabel, session.language)

            if (admin?.isSuperAdmin) {
                return {
                    status: 200,
                    data: conf
                }
            }


            var conf: any = _.cloneDeep(this.paginationConfig)
            conf.fields = await this.getFieldsConf(adminInfo._id, admin?.role as string || "")
            conf.fields = await (this.adminRepo as any).translateLanguage(conf.fields, this.paginationConfig?.tableLabel, session.language)
            console.log(conf)
            return {
                status: 200,
                data: conf
            }
        } catch (error) {
            console.log(error)
        }


        return {
            status: 200,
            data: this.paginationConfig
        }
    }


    async findMany(query: FilterQuery<T>, options?: QueryInfo): Promise<Response> {
        try {
            return {
                data: await this.repository.findMany(query),
                message: "موفق"
            }

        } catch (error) {
            throw error
        }
    }

    @CheckLog
    async delete(id: Types.ObjectId | string, ...params: [...any]): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.repository.deleteById(id)
            }
        } catch (error) {
            throw error
        }
    }

    public async search(page: number, limit: number, reqQuery: any, admin?: any, ...params: [...any]) {
        var query = await this.searchHelper(reqQuery)
        // console.log("fuck" , query)
        if (reqQuery["_id$ne"]) {
            query["_id"] = {
                $ne: reqQuery["_id$ne"]
            }
        }

        if (this.collectionName != undefined || this.isAdminPaginate) {
            return this.adminPaginate(page, limit, admin as AdminInfo, query, {
                sort: this.getSort(reqQuery)
            })
        }
        return await this.paginate(page, limit, query, {
            sort: this.getSort(reqQuery)
        })
    }

    public getSearchList(): Response {
        return {
            status: 200,
            data: this.searchFilters
        }
    }

    public async searchHelper(queryParam: any = {}) {

        var query: any = {}
        for (const key in this.searchFilters) {
            var ands = []
            for (let i = 0; i < this.searchFilters[key].length; i++) {
                if (queryParam[key + "$" + this.searchFilters[key][i]]) {

                    if (this.searchFilters[key][i] == "lte") {
                        var condition: any = {}
                        condition[key] = {
                            "$lte": queryParam[key + "$" + this.searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (this.searchFilters[key][i] == "gte") {
                        var condition: any = {}
                        condition[key] = {
                            "$gte": queryParam[key + "$" + this.searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (this.searchFilters[key][i] == "eq") {
                        var condition: any = {}
                        condition[key] = {
                            "$eq": queryParam[key + "$" + this.searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (this.searchFilters[key][i] == "list") {
                        var condition: any = {}
                        condition[key] = {
                            "$in": queryParam[key + "$" + this.searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (this.searchFilters[key][i] == "reg") {
                        var condition: any = {}
                        condition[key] = {
                            "$regex": new RegExp(queryParam[key + "$" + this.searchFilters[key][i]] as string)
                        }
                        ands.push(condition)
                    }
                }
            }
            if (ands.length == 1) {
                query[key] = ands[0][key]
            }
            else if (ands.length > 1) {
                if (query["$and"]) {
                    query["$and"].push(ands)
                }
                else {
                    query["$and"] = ands
                }
            }
        }
        return query
    }

    static async customSearchHelper(queryParam: any = {}, searchFilters: any) {

        var query: any = {}
        for (const key in searchFilters) {
            var ands = []
            for (let i = 0; i < searchFilters[key].length; i++) {
                if (queryParam[key + "$" + searchFilters[key][i]]) {

                    if (searchFilters[key][i] == "lte") {
                        var condition: any = {}
                        condition[key] = {
                            "$lte": queryParam[key + "$" + searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (searchFilters[key][i] == "gte") {
                        var condition: any = {}
                        condition[key] = {
                            "$gte": queryParam[key + "$" + searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (searchFilters[key][i] == "eq") {
                        var condition: any = {}
                        condition[key] = {
                            "$eq": queryParam[key + "$" + searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (searchFilters[key][i] == "list") {
                        var condition: any = {}
                        condition[key] = {
                            "$in": queryParam[key + "$" + searchFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (searchFilters[key][i] == "reg") {
                        var condition: any = {}
                        condition[key] = {
                            "$regex": new RegExp(queryParam[key + "$" + searchFilters[key][i]] as string)
                        }
                        ands.push(condition)
                    }
                }
            }
            if (ands.length == 1) {
                query[key] = ands[0][key]
            }
            else if (ands.length > 1) {
                if (query["$and"]) {
                    query["$and"].push(ands)
                }
                else {
                    query["$and"] = ands
                }
            }
        }
        return query
    }

    static async getSort(queryParam: any = {}) {
        var sortKey = queryParam.sortKey || "_id"
        var sort: any = {}
        sort[sortKey as string] = -1
        if (queryParam.sortOrderKey == "1") {
            sort[sortKey as string] = 1
        }
        return sort
    }

    public getSort(queryParam: any = {}) {

        var sortKey = queryParam.sortKey || "_id"
        var sort: any = {}
        sort[sortKey as string] = -1
        if (queryParam.sortOrderKey == "1") {
            sort[sortKey as string] = 1
        }
        return sort
    }


    public async dataTransform(dataList: any[]) {
        return dataList
    }

    async exportExcel(
        query: any,
        adminInfo: AdminInfo,
        ...params: [...any]): Promise<Response> {
        var fields = query?.fields
        var query = await this.searchHelper(query)
        try {
            var dataList = await this.repository.findAll(query,
                {
                    sort: this.getSort(query)
                }, this.population
            )
        } catch (error) {
            throw error
        }


        if (this.collectionName == undefined) {
            return BaseController.doExportExcel(await this.dataTransform(dataList), this.exelConfig)
        }

        let admin = await this.adminRepo?.findById(adminInfo._id)

        if (admin?.isSuperAdmin) {
            // return BaseController.doExportCSV(await this.dataTransform(dataList), this.csvConfig, this.pdfConfig.dataMap)
            return BaseController.doExportExcel(await this.dataTransform(dataList), this.exelConfig)
        }

        var dataMap = await this.adminRepo?.getSchemasByCollection(this.collectionName || "", adminInfo._id, admin?.role as string || "")
        dataMap = dataMap?.reverse()
        return BaseController.doExportExcel(await this.dataTransform(dataList), this.exelConfig, dataMap)


    }
    static async doExportExcel(
        dataList: any[] = [],
        exelConfig: any,
        fields?: string[] | string
    ): Promise<Response> {
        try {


            if (fields != undefined) {
                if (typeof fields == "string") {
                    fields = [fields]
                }
                let conf: any = {}
                for (let i = 0; i < fields.length; i++) {
                    if (exelConfig[fields[i]] != undefined) {
                        conf[fields[i]] = exelConfig[fields[i]]
                    }

                }
                exelConfig = conf
            }

            var report = excel.buildExport(
                [
                    {
                        name: 'Report',
                        specification: exelConfig,
                        data: dataList
                    }
                ]
            );
            return {
                responseHeader: {
                    'Content-Type': 'application/vnd.openxmlformats',
                    "Content-Disposition": "attachment; filename=" + "Report.xlsx"
                },
                json: false,
                data: report
            }

        } catch (error) {
            // console.log(error)
            throw error
        }
    }


    async exportCSV(
        query: any,
        adminInfo: AdminInfo,
        ...params: [...any]): Promise<Response> {
        var fields = query?.fields
        var query = await this.searchHelper(query)
        try {
            var dataList = await this.repository.findAll(query,
                {
                    sort: this.getSort(query)
                }, this.population
            )
        } catch (error) {
            throw error
        }

        if (this.collectionName == undefined) {
            return BaseController.doExportCSV(await this.dataTransform(dataList), this.csvConfig)
        }

        let admin = await this.adminRepo?.findById(adminInfo._id)

        if (admin?.isSuperAdmin) {
            return BaseController.doExportCSV(await this.dataTransform(dataList), this.csvConfig)
        }

        var dataMap = await this.adminRepo?.getSchemasByCollection(this.collectionName || "", adminInfo._id, admin?.role as string || "")
        dataMap = dataMap?.reverse()
        return BaseController.doExportCSV(await this.dataTransform(dataList), this.csvConfig, dataMap)


    }
    static async doExportCSV(
        dataList: any[] = [],
        csvConfig: any,
        fieldss?: string[] | string
    ): Promise<Response> {
        try {
            if (fieldss != undefined) {

                if (typeof fieldss == "string") {
                    fieldss = [fieldss]
                }
                // exelConfig = conf
                let fieldNames: string[] = []
                for (let i = 0; i < csvConfig.fields.length; i++) {

                    if (fieldss.includes(csvConfig.fields[i])) {
                        fieldNames.push(csvConfig.fields[i])
                    }

                }

                csvConfig.fields = fieldNames
            }

            var data = parse(dataList, { fields: csvConfig.fields, fieldNames: csvConfig.fieldNames });
            return {
                responseHeader: {
                    "Content-Disposition": "attachment; filename=" + "result.csv"
                },
                json: false,
                data: data
            }

        } catch (error) {
            throw error
        }
    }


    async exportPDF(
        @Query({
            schema: z.record(z.string(), z.any())
        },
        ) query: any,
        @Admin() adminInfo: AdminInfo
        , ...params: [...any]): Promise<Response> {
        var fields = query?.fields
        var query = await this.searchHelper(query)
        try {
            var dataList = await this.repository.findAll(query,
                {
                    sort: this.getSort(query)
                }, this.population
            )
        } catch (error) {
            throw error
        }
        if (this.collectionName == undefined) {
            return BaseController.doExportPDF(await this.dataTransform(dataList), this.pdfConfig, this.pdfConfig.dataMap)
        }
        let admin = await this.adminRepo?.findById(adminInfo._id)

        if (admin?.isSuperAdmin) {
            return BaseController.doExportPDF(await this.dataTransform(dataList), this.pdfConfig, this.pdfConfig.dataMap)
        }

        var dataMap = await this.adminRepo?.getSchemasByCollection(this.collectionName || "", adminInfo._id, admin?.role as string || "")
        dataMap = dataMap?.reverse()
        return BaseController.doExportPDF(await this.dataTransform(dataList), this.pdfConfig, dataMap)
    }
    static async doExportPDF(
        dataList: any[] = [],
        pdfConfig: any,
        fields: any
    ): Promise<Response> {
        try {
            if (fields != undefined) {
                if (typeof fields == "string") {
                    fields = [fields]
                }
                let conf: any = {}
                var fieldss: string[] = []
                var dataMapss: string[] = []
                for (let i = 0; i < fields.length; i++) {
                    // conf[fields[i]] = exelConfig[fields[i]]
                    let j = pdfConfig.dataMap.findIndex((value: any) => {
                        return value == fields[i]
                    })
                    if (j != -1) {
                        dataMapss.push(pdfConfig.dataMap[j])
                        fieldss.push(pdfConfig.titles[j])
                    }

                }

                pdfConfig.titles = fieldss
                pdfConfig.dataMap = dataMapss
                // exelConfig = conf
            }
            return await new Promise((resolve, reject) => {
                ejs.renderFile(pdfConfig.path, { dataList: dataList, titles: pdfConfig.titles, dataMap: pdfConfig.dataMap }, (err: any, data: any) => {
                    if (err) {
                        reject(err)
                    } else {
                        pdf.create(data, pdfConfig.options).toBuffer(function (err: any, data: any) {
                            if (err) {
                                return reject(err)
                            } else {
                                return resolve({
                                    responseHeader: {
                                        'Content-Type': 'application/pdf',
                                        "Content-Disposition": "attachment; filename=" + "result.pdf"
                                    },
                                    json: false,
                                    data

                                })
                            }
                        });
                    }
                });

            })

        } catch (error) {
            throw error
        }
    }


    static async doExportPDFFromFile(
        file: string
    ) {
        console.log(file)
        return new Promise((resolve, reject) => {
            var html = fs.readFileSync(file, 'utf8');
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
            pdf.create(html, options).toBuffer(function (err: any, data: any) {
                if (err) {
                    console.log(err)
                    return reject(err)
                } else {
                    return resolve({
                        responseHeader: {
                            'Content-Type': 'application/pdf',
                            "Content-Disposition": "attachment; filename=" + "result.pdf"
                        },
                        json: false,
                        data

                    })
                }
            });

        })
    }


    async validatePermission(
        permissionData: PermissionData
    ) {
        let checkList = permissionData.dataCheck
        for (let i = 0; i < checkList.length; i++) {
            if (checkList[i].compration == "eqaul") {
                if (permissionData.permissionData[checkList[i].key] != checkList[i].values) {
                    return false
                }
            }
            else {
                if (!permissionData.permissionData[checkList[i].key].includes(checkList[i].values)) {
                    return false
                }
            }
        }
        return true
    }


    async transformData(
        permissionData: PermissionData & {
            data: any
        }

    ) {
        let data = permissionData.data

        let checkList = permissionData.dataCheck
        for (let i = 0; i < checkList.length; i++) {
            var targetKey = checkList[i].targetKey || checkList[i].key
            if (checkList[i].compration == "eqaul") {
                if (permissionData.permissionData[checkList[i].key] != checkList[i].values) {
                    // console.log(targetKey)
                    delete data[targetKey]
                }
            }
            else {
                if (!permissionData.permissionData[checkList[i].key].includes(checkList[i].values)) {
                    delete data[targetKey]
                }
            }
        }
        return data
    }

    async getPDFConfig(fields: any) {
        let pdf: any = { ...PDFBaseConfig }
        for (const key in fields) {
            pdf.dataMap.push(fields[key].en_title)
            pdf.titles.push(fields[key].fa_title)
        }
        return pdf
        this.pdfConfig = pdf
    }

    async getCSVConfig(fields: any) {
        let csv: any = { ...CSVBaseConfig }
        for (const key in fields) {
            csv.fields.push(fields[key].en_title)
            csv.fieldNames.push(fields[key].fa_title)
        }
        return csv
    }

    async getExcelConfig(fields: any) {
        let excel: any = { ...ExcelBaseConfig }
        for (const key in fields) {
            excel[fields[key].en_title] = {
                displayName: fields[key].fa_title,
                headerStyle: styles.headerOdd,
                cellStyle: styles.cellOdd,
                width: 120,
            }
        }
        return excel
    }


    async addExportRoutes() {
        if (this.paginationConfig) {
            this.csvConfig = await this.getCSVConfig(this.paginationConfig.fields)
            this.exelConfig = await this.getExcelConfig(this.paginationConfig.fields)
            this.pdfConfig = await this.getPDFConfig(this.paginationConfig.fields)
        }
        this.addRouteWithMeta("s/exel", "get", this.exportExcel.bind(this), BaseController.exportMeta)
        this.addRouteWithMeta("s/csv", "get", this.exportCSV.bind(this), BaseController.exportMeta)
        this.addRouteWithMeta("s/pdf", "get", this.exportPDF.bind(this), BaseController.exportMeta)
    }

    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        })
        var pg = this.baseRoute.endsWith("e") ? "s" : "es"
        if (this.collectionName == undefined && this.isAdminPaginate != true) {

            this.addRouteWithMeta(pg, "get", this.paginate.bind(this), Object.assign(BaseController.paginateMeta, { absolute: false }))
        }
        else {
            this.addRouteWithMeta(pg, "get", this.adminPaginate.bind(this), Object.assign(BaseController.adminPaginateMeta, { absolute: false }))
        }

        this.addRouteWithMeta("", "delete", this.delete.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: BaseController.id
            },
        })
    }

}

