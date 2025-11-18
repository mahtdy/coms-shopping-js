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
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/paymentConfigPreText/repository"));
class PaymentConfigController extends controller_1.default {
    constructor(baseRoute, repo, invoiceRepo, options) {
        super(baseRoute, repo, options);
        this.invoiceRepo = invoiceRepo;
        this.paymentConfigPreTextRepo = new repository_1.default();
    }
    async editCheck(data) {
    }
    async searchHelper(queryParam) {
        let q = await super.searchHelper(queryParam);
        if (queryParam["type$ne"]) {
            q["type"] = { $ne: queryParam["type$ne"] };
        }
        return q;
    }
    // paginate(page: number, limit: number, query?: FilterQuery<PaymentConfig>, options?: QueryInfo | undefined, ...params: any[]): Promise<Response> {
    //     if(options == undefined){
    //         options = {}
    //     }
    //     if( options.population == undefined){
    //         options["population"] = []
    //     }
    //     options["population"].push({
    //         path : "invoice",
    //         select : ["tax"]
    //     })
    //     // console.log("paginate" ,options)
    //     return super.paginate(page, limit, query, options)
    // }
    // adminPaginate(page: number, limit: number, adminInfo: AdminInfo, query?: FilterQuery<PaymentConfig>, options?: QueryInfo | undefined, ...params: any[]): Promise<Response> {
    //     if(options == undefined){
    //         options = {}
    //     }
    //     if( options.population == undefined){
    //         options["population"] = []
    //     }
    //     options["population"]?.push({
    //         path : "invoice",
    //         select : ["tax"]
    //     })
    //     // console.log("adminPaginate")
    //     return super.adminPaginate(page, limit, adminInfo, query, options)
    // }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("es/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("es/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.default = PaymentConfigController;
__decorate([
    (0, method_1.Post)("/check/edit"),
    __param(0, (0, parameters_1.Body)({}))
], PaymentConfigController.prototype, "editCheck", null);
