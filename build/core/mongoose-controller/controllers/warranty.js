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
exports.WarrantyController = void 0;
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/warranty/repository"));
const zod_1 = require("zod");
const method_1 = require("../../../core/decorators/method");
const model_1 = require("../repositories/address/model");
const repository_2 = __importDefault(require("../repositories/paymentConfig/repository"));
const repository_3 = __importDefault(require("../repositories/loanTemplate/repository"));
const repository_4 = __importDefault(require("../repositories/loanSetting/repository"));
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const random_1 = __importDefault(require("../../random"));
const emailMessager_1 = __importDefault(require("../../messaging/emailMessager"));
class WarrantyController extends controller_1.default {
    constructor(baseRoute, repo, paymentRepo, options) {
        super(baseRoute, repo, options);
        this.paymentRepo = paymentRepo;
        this.loanTemplateRepo = new repository_3.default();
        this.loanSettingRepo = new repository_4.default();
        this.population = [
            {
                path: "warrantor.address"
            },
            {
                path: "warrantor.workAddrress"
            },
            {
                path: "paymentConfig"
            },
            {
                path: "deedAddress"
            }
        ];
    }
    // @Post("")
    async create(data, file, files) {
        console.log(data, file);
        if (file != undefined) {
            // data.attachement = file.replace(ConfigService.getConfig("staticRoute") ,ConfigService.getConfig("staticFileRoute") )
        }
        console.log(data);
        return super.create(data);
    }
    async addWarantorInfo(warrantor, id) {
        try {
            return {
                status: 200,
                data: await this.repository.addWarrantor(warrantor, id)
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getWarrantyById(id) {
        try {
            return await this.findOne({
                _id: id
            }, {
                population: [
                    {
                        path: "warrantor.address"
                    },
                    {
                        path: "warrantor.workAddrress"
                    }
                ]
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editWarranty(id, warrantor) {
        try {
            return {
                status: 200,
                data: await this.repository.editWarrantor(id, warrantor)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addAttachments(id, name, attachement, files) {
        try {
            const warranty = await this.repository.findById(id);
            if (warranty == null) {
                return {
                    status: 404
                };
            }
            if (warranty.attachments == undefined) {
                warranty.attachments = {};
            }
            let a = warranty.attachments[name];
            if (a) {
                warranty.attachments[name].push({
                    url: attachement
                });
            }
            else {
                warranty.attachments[name] = [{ url: attachement }];
            }
            await this.repository.updateOne({
                _id: id
            }, {
                $set: warranty
            });
            return {
                status: 200,
                data: attachement
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteAttachments(id, name, link) {
        try {
            const warranty = await this.repository.findById(id);
            if (warranty == null) {
                return {
                    status: 404
                };
            }
            if (warranty.attachments == undefined) {
                warranty.attachments = {};
            }
            let attachment = warranty.attachments[name];
            if (attachment) {
                warranty.attachments[name] = warranty.attachments[name].filter((item) => item.url !== link);
            }
            return await this.editById(id, {
                $set: warranty
            }, warranty.attachments);
        }
        catch (error) {
            throw error;
        }
    }
    async addWarranty(id, data) {
        try {
            return {
                status: 200,
                data: await this.repository.addWarranty(id, data)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addDeedAttachment(id, attachement, files) {
        try {
            let data = {};
            let deed = [];
            if (typeof attachement == "string") {
                if (attachement != "")
                    deed.push({
                        url: attachement
                    });
            }
            else {
                for (let i = 0; i < attachement.length; i++) {
                    deed.push({
                        url: attachement[i]
                    });
                }
            }
            return this.editById(id, {
                $push: {
                    deed: {
                        $each: deed
                    }
                }
            }, attachement);
        }
        catch (error) {
            throw error;
        }
    }
    async removeDeedAttachment(id, link) {
        try {
            const warranty = await this.repository.findById(id);
            if (warranty == null) {
                return {
                    status: 404
                };
            }
            if (warranty.attachments == undefined) {
                warranty.attachments = {};
            }
            let attachment = warranty.deed;
            if (attachment) {
                warranty.deed = warranty.deed.filter((item) => item.url !== link);
            }
            return await this.editById(id, {
                $set: warranty
            }, warranty.deed);
        }
        catch (error) {
            throw error;
        }
    }
    async addHomeOfficeAttachment(id, attachement, files) {
        try {
            let data = {};
            let homeOffices = [];
            if (typeof attachement == "string") {
                if (attachement != "")
                    homeOffices.push({
                        url: attachement
                    });
            }
            else {
                for (let i = 0; i < attachement.length; i++) {
                    homeOffices.push({
                        url: attachement[i]
                    });
                }
            }
            return this.editById(id, {
                $push: {
                    homeOffice: {
                        $each: homeOffices
                    }
                }
            }, attachement);
        }
        catch (error) {
            throw error;
        }
    }
    async removeHomeOfficeAttachment(id, link) {
        try {
            const warranty = await this.repository.findById(id);
            if (warranty == null) {
                return {
                    status: 404
                };
            }
            if (warranty.attachments == undefined) {
                warranty.attachments = {};
            }
            let attachment = warranty.homeOffice;
            if (attachment) {
                warranty.homeOffice = warranty.homeOffice.filter((item) => item.url !== link);
            }
            return await this.editById(id, {
                $set: warranty
            }, warranty.deed);
        }
        catch (error) {
            throw error;
        }
    }
    async confirmAttchments(id) {
        var _a, _b;
        try {
            let waranties = await this.repository.findAll({
                paymentConfig: id
            });
            for (let i = 0; i < waranties.length; i++) {
                let warranty = waranties[i];
                if (warranty == null) {
                    return {
                        status: 404
                    };
                }
                let attachements = warranty.attachments || {};
                if (!warranty.isOwn) {
                    let array = ["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo"];
                    for (let i = 0; i < array.length; i++) {
                        let files = attachements[array[i]];
                        if (files == undefined || files.length == 0) {
                            return {
                                status: 400,
                                message: "مدارک تکمیل نشده است"
                            };
                        }
                    }
                }
            }
            let config = await this.getWarrantyConfig(id);
            let s = config.personalCount;
            for (let i = 0; i < waranties.length; i++) {
                if (waranties[i].type == "personal"
                    && waranties[i].info != undefined
                    && waranties[i].confirmed
                    && waranties[i].info.amount != undefined
                    && waranties[i].info.amount >= config.personal) {
                    s -= 1;
                }
            }
            if (s >= 1) {
                return {
                    status: 400,
                    message: `تعداد ضامنین شخصی کافی نمی‌باشد. تعداد مورد نیاز:${config.personalCount} عدد`
                };
            }
            if (config.deedEnable) {
                let haveDeed = false;
                let allDeed = config.deed;
                for (let i = 0; i < waranties.length; i++) {
                    if (waranties[i].type == "deed" && waranties[i].deed != undefined && waranties[i].confirmed && ((_a = waranties[i].info) === null || _a === void 0 ? void 0 : _a.deedamount) != undefined) {
                        allDeed -= (_b = waranties[i].info) === null || _b === void 0 ? void 0 : _b.deedamount;
                        if (allDeed <= 0) {
                            haveDeed = true;
                            break;
                        }
                    }
                }
                if (!haveDeed) {
                    return {
                        status: 400,
                        message: "ضمانت ملکی درج نشده یا فایل مربوط ب ضمانت ضمیمه نشده است"
                    };
                }
            }
            await this.paymentRepo.confirmWarranty(id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteWarranty(id) {
        return this.delete(id);
    }
    async getWarrantiesByPayment(id) {
        try {
            return await this.paginate(1, 100, {
                paymentConfig: id
            }, {
                population: [{
                        path: "warrantor.address"
                    }, {
                        path: "warrantor.workAddrress"
                    }]
            });
        }
        catch (error) {
            throw error;
        }
    }
    async validate(id, inputType, input, notExistsId) {
        try {
            let q = {
                paymentConfig: id,
            };
            if (inputType == "phone") {
                q["warrantor.phone"] = input;
            }
            else {
                q["warrantor.email"] = input;
            }
            if (notExistsId != undefined) {
                q["_id"] = {
                    $ne: notExistsId
                };
            }
            return this.checkExists(q);
        }
        catch (error) {
            throw error;
        }
    }
    async addPrice(data) {
        try {
            let warranty = await this.repository.findById(data.id);
            if (warranty == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            return await this.editById(data.id, {
                $set: {
                    amount: data.amount
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async confirmWarranty(data) {
        try {
            let id = data.id;
            let warranty = await this.repository.findById(id);
            if (warranty == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            let attachements = warranty.attachments || {};
            if (!warranty.isOwn) {
                let array = ["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo"];
                for (let i = 0; i < array.length; i++) {
                    let files = attachements[array[i]];
                    if (files == undefined || files.length == 0) {
                        return {
                            status: 400,
                            message: "مدارک تکمیل نشده است"
                        };
                    }
                }
            }
            if (warranty.info == undefined) {
                return {
                    status: 400,
                    message: "مدارک تکمیل نشده است"
                };
            }
            let q = warranty.type == "deed" ? data : {};
            q["confirmed"] = true;
            q["isReject"] = false;
            return await this.editById(id, {
                $set: q
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectWarranty(data) {
        try {
            return {
                data: await this.repository.rejectWarranty(data.id, data.rejectMessage),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async requestVerifyPhone(id) {
        try {
            let warrantor = await this.repository.findById(id);
            if (warrantor == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            if (warrantor.warrantor.phoneVirified) {
                return {
                    status: 400,
                    message: "این ضامن قبلا تایید شده است"
                };
            }
            let random = random_1.default.randomNumber();
            await smsMessager_1.default.send({
                parameters: {
                    verificationCode: random
                },
                receptor: warrantor.warrantor.phone,
                template: "warrantorVerificationCode"
            });
            return this.editById(id, {
                $set: {
                    "warrantor.phoneCode": random
                }
            }, {});
        }
        catch (error) {
            throw error;
        }
    }
    async requestVerifyEmail(id) {
        try {
            let warrantor = await this.repository.findById(id);
            if (warrantor == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            if (warrantor.warrantor.emailVirified) {
                return {
                    status: 400,
                    message: "این ضامن قبلا تایید شده است"
                };
            }
            let random = random_1.default.randomNumber();
            await emailMessager_1.default.send({
                parameters: {
                    verificationCode: random
                },
                receptor: warrantor.warrantor.email,
                template: "warrantorVerificationCode"
            });
            return this.editById(id, {
                $set: {
                    "warrantor.emailCode": random
                }
            }, {});
        }
        catch (error) {
            throw error;
        }
    }
    async verifyPhone(id, code) {
        try {
            let warrantor = await this.repository.findById(id);
            if (warrantor == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            if (warrantor.warrantor.phoneVirified) {
                return {
                    status: 400,
                    message: "این ضامن قبلا تایید شده است"
                };
            }
            if (code != warrantor.warrantor.phoneCode) {
                return {
                    status: 400,
                    message: "کد وارد شده اشتباه است"
                };
            }
            return this.editById(id, {
                $set: {
                    "warrantor.phoneVirified": true
                }
            }, {});
        }
        catch (error) {
            throw error;
        }
    }
    async verifyEmail(id, code) {
        try {
            let warrantor = await this.repository.findById(id);
            if (warrantor == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            if (warrantor.warrantor.emailVirified) {
                return {
                    status: 400,
                    message: "این ضامن قبلا تایید شده است"
                };
            }
            if (code != warrantor.warrantor.emailCode) {
                return {
                    status: 400,
                    message: "کد وارد شده اشتباه است"
                };
            }
            return this.editById(id, {
                $set: {
                    "warrantor.emailVirified": true
                }
            }, {});
        }
        catch (error) {
            throw error;
        }
    }
    async getWarrantyConfig(id) {
        var _a, _b;
        try {
            let loan = await this.paymentRepo.findOne({
                _id: id,
                installmentConfig: {
                    $exists: true
                }
            });
            if (loan == null) {
                throw new Error("وام یافت نشد");
            }
            if ((_a = loan.installmentConfig) === null || _a === void 0 ? void 0 : _a.loanTemplate) {
                let loanTemplate = await this.loanTemplateRepo.findById((_b = loan.installmentConfig) === null || _b === void 0 ? void 0 : _b.loanTemplate);
                if (loanTemplate == null) {
                    throw new Error("طرح وام یافت نشد");
                }
                let loanPeriod = undefined;
                for (let i = 0; i < loanTemplate.periodes.length; i++) {
                    if (loanTemplate.periodes[i]._id.toHexString() == loan.installmentConfig.loanPeriod.toHexString()) {
                        loanPeriod = loanTemplate.periodes[i];
                        break;
                    }
                }
                if (loanPeriod == undefined) {
                    throw new Error("دوره طرح وام مشخص نشده است");
                }
                let deed = Math.floor(loan.amount * (1 + (loanPeriod.warranty.deed.min / 100)));
                let deedEnable = loanPeriod.warranty.deed.enabled;
                let personal = Math.floor(loan.amount * (1 + (loanPeriod.warranty.personal.min / 100)));
                let personalCount = loanPeriod.warranty.personal.guarantorsCount;
                return {
                    deed,
                    deedEnable,
                    personal,
                    personalCount
                };
            }
            else {
                let loanSetting = await this.loanSettingRepo.findOne({
                    from: {
                        $lte: loan.amount
                    },
                    to: {
                        $gte: loan.amount
                    }
                });
                if (loanSetting == null) {
                    throw new Error("تنظیمات وام یافت نشد");
                }
                let deed = Math.floor(loan.amount * (1 + (loanSetting.deed.min / 100)));
                let deedEnable = loanSetting.deed.enabled;
                let personal = Math.floor(loan.amount * (1 + (loanSetting.personal.min / 100)));
                let personalCount = loanSetting.personal.guarantorsCount;
                return {
                    deed,
                    deedEnable,
                    personal,
                    personalCount
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async searchHelper(queryParam) {
        let q = await super.searchHelper(queryParam);
        if (q["type"] == undefined) {
            q["type"] = {
                "$exists": true
            };
        }
        return q;
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
                sort: this.getSort(reqQuery),
                population: this.population
            });
        }
        return await this.paginate(page, limit, query, {
            sort: this.getSort(reqQuery),
            population: this.population
        });
    }
    initApis() {
        this.addRouteWithMeta("/search", "get", this.search.bind(this), Object.assign(controller_1.default.searcheMeta, { absolute: false }));
    }
}
exports.WarrantyController = WarrantyController;
__decorate([
    __param(1, (0, parameters_1.Body)({
        destination: "attachements"
    })),
    __param(2, (0, parameters_1.Files)({
        config: {
            name: "attachement",
            maxCount: 5,
            types: ["jpg", "pdf", "png", "zip"],
            dest: "src/uploads/waranty/",
            rename: true
        },
        schema: zod_1.z.any().optional(),
        destination: "attachement",
        isArray: true,
        mapToBody: true,
        isOptional: true
    }))
], WarrantyController.prototype, "create", null);
__decorate([
    (0, method_1.Post)("/warrantor/info"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            nameAndFamily: zod_1.z.string(),
            email: controller_1.default.email.optional(),
            phone: controller_1.default.phone,
            address: model_1.addressSchema.optional(),
            telephone: zod_1.z.string(),
            fatherName: zod_1.z.string(),
            birthCertificateNumber: zod_1.z.string().regex(/^[0-9]*$/),
            gender: zod_1.z.enum(["male", "female", "other"]),
            nationalCode: zod_1.z.string().regex(/^[0-9]*$/),
            workAddrress: model_1.addressSchema.optional(),
            workTelephone: zod_1.z.string(),
            jobTitle: zod_1.z.string()
        }),
        destination: "data"
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "addWarantorInfo", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "getWarrantyById", null);
__decorate([
    (0, method_1.Put)("/warrantor/info"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            nameAndFamily: zod_1.z.string(),
            email: controller_1.default.email.optional(),
            phone: controller_1.default.phone,
            address: model_1.addressSchema.optional(),
            telephone: zod_1.z.string(),
            fatherName: zod_1.z.string(),
            birthCertificateNumber: zod_1.z.string().regex(/^[0-9]*$/),
            gender: zod_1.z.enum(["male", "female", "other"]),
            nationalCode: zod_1.z.string().regex(/^[0-9]*$/),
            workAddrress: model_1.addressSchema.optional(),
            workTelephone: zod_1.z.string(),
            jobTitle: zod_1.z.string()
        }),
        destination: "data"
    }))
], WarrantyController.prototype, "editWarranty", null);
__decorate([
    (0, method_1.Post)("/attachments", {
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.enum(["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo", "financeInfo", "sanaInfo", "otherInfo"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "attachement"
    })),
    __param(3, (0, parameters_1.Files)({
        config: {
            name: "attachement",
            maxCount: 5,
            types: ["jpg", "png", "webp", "jpeg"],
            dest: "src/uploads/waranty/",
            rename: true,
        },
        schema: zod_1.z.any().optional(),
        destination: "attachement",
        isArray: true,
        mapToBody: true,
        isOptional: true,
        moveFilesToCDN: {
            name: "attachement",
            config: {
                path: "loan/",
            },
        },
    }))
], WarrantyController.prototype, "addAttachments", null);
__decorate([
    (0, method_1.Post)("/attachments/remove"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.enum(["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo", "financeInfo", "sanaInfo", "otherInfo"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "link",
        schema: zod_1.z.string()
    }))
], WarrantyController.prototype, "deleteAttachments", null);
__decorate([
    (0, method_1.Post)(""),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "data",
        schema: zod_1.z.object({
            type: zod_1.z.enum(["deed", "personal"]),
            personalType: zod_1.z.enum(["check", "promissory"]).optional(),
            info: zod_1.z.any(),
            deedAddress: controller_1.default.address.optional()
        }),
        parseJson: true
    }))
], WarrantyController.prototype, "addWarranty", null);
__decorate([
    (0, method_1.Post)("/deed/attachment"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "attachement"
    })),
    __param(2, (0, parameters_1.Files)({
        config: {
            name: "attachement",
            maxCount: 5,
            types: ["jpg", "png", "webp", "jpeg"],
            dest: "src/uploads/waranty/",
            rename: true,
        },
        schema: zod_1.z.any().optional(),
        destination: "attachement",
        isArray: true,
        mapToBody: true,
        isOptional: true,
        moveFilesToCDN: {
            name: "attachement",
            config: {
                path: "loan/",
            },
        },
    }))
], WarrantyController.prototype, "addDeedAttachment", null);
__decorate([
    (0, method_1.Post)("/deed/attachment/remove"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "link",
        schema: zod_1.z.string()
    }))
], WarrantyController.prototype, "removeDeedAttachment", null);
__decorate([
    (0, method_1.Post)("/home-office/attachment"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "attachement"
    })),
    __param(2, (0, parameters_1.Files)({
        config: {
            name: "attachement",
            maxCount: 5,
            types: ["jpg", "png", "webp", "jpeg"],
            dest: "src/uploads/waranty/",
            rename: true,
        },
        schema: zod_1.z.any().optional(),
        destination: "attachement",
        isArray: true,
        mapToBody: true,
        isOptional: true,
        moveFilesToCDN: {
            name: "attachement",
            config: {
                path: "loan/",
            },
        },
    }))
], WarrantyController.prototype, "addHomeOfficeAttachment", null);
__decorate([
    (0, method_1.Post)("/home-office/attachment/remove"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "link",
        schema: zod_1.z.string()
    }))
], WarrantyController.prototype, "removeHomeOfficeAttachment", null);
__decorate([
    (0, method_1.Post)("/confirm/by-payment"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "confirmAttchments", null);
__decorate([
    (0, method_1.Delete)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "deleteWarranty", null);
__decorate([
    (0, method_1.Get)("/by-payment"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "getWarrantiesByPayment", null);
__decorate([
    (0, method_1.Post)("/validate"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "type",
        schema: zod_1.z.enum(["phone", "email"])
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "input",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "notExistsId",
        schema: controller_1.default.id.optional()
    }))
], WarrantyController.prototype, "validate", null);
__decorate([
    (0, method_1.Post)("/price"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            "id": controller_1.default.id,
            "amount": zod_1.z.coerce.number().min(0).optional()
        })
    }))
], WarrantyController.prototype, "addPrice", null);
__decorate([
    (0, method_1.Post)("/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            "isInMortgage": zod_1.z.boolean().optional(),
            "id": controller_1.default.id
        }).optional()
    }))
], WarrantyController.prototype, "confirmWarranty", null);
__decorate([
    (0, method_1.Post)("/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_1.default.id.optional(),
            rejectMessage: zod_1.z.string()
        })
    }))
], WarrantyController.prototype, "rejectWarranty", null);
__decorate([
    (0, method_1.Post)("/verify/phone/request"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "requestVerifyPhone", null);
__decorate([
    (0, method_1.Post)("/verify/email/request"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], WarrantyController.prototype, "requestVerifyEmail", null);
__decorate([
    (0, method_1.Post)("/verify/phone"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.random
    }))
], WarrantyController.prototype, "verifyPhone", null);
__decorate([
    (0, method_1.Post)("/verify/email"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.random
    }))
], WarrantyController.prototype, "verifyEmail", null);
const warranty = new WarrantyController("/warranty", new repository_1.default(), new repository_2.default(), {
    // insertSchema : z.object({
    //     type : z.enum(["deed" , "personal"]),
    //     attachement : z.array(z.string()),
    //     paymentConfig : BaseController.id.optional(),
    //     personalType : z.enum(["check" , "promissory"]).optional(),
    //     info : z.any()
    // }).omit({
    //     "attachement": true
    // }),
    // paginationConfig : {
    //     fields : {
    //         personalType : {
    //             en_title : "personalType", 
    //             fa_title : "",
    //             isOptional : true,
    //             sortOrderKey : true,
    //             type : "string",
    //             translator : {
    //                 "check" : "",
    //                 "promissory" : ""
    //             }
    //         },
    //         type : {
    //             en_title : "",
    //             fa_title : "",
    //             isOptional : true,
    //             sortOrderKey : true,
    //             type : "string",
    //             translator : {
    //                 "deed" : "",
    //                 "personal" : ""
    //             },
    //         },
    //         "info.number" :{
    //             en_title : "info.number" 
    //         },
    //     },
    //     paginationUrl : "",
    //     searchUrl : "",
    //     serverType : "",
    //     tableLabel : "warranty",
    // }
    searchFilters: {
        paymentConfig: ["eq", "list"],
        personalType: ["eq", "list"],
        type: ["eq", "list"]
    }
});
exports.default = warranty;
