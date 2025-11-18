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
exports.InternalMessageExternal = exports.NotifMessagingExternal = exports.EmailMessagingExternal = exports.SMSMessagingExternal = void 0;
const mongoose_1 = require("mongoose");
const controller_1 = __importDefault(require("../mongoose-controller/controller"));
const repository_1 = __importDefault(require("../mongoose-controller/repositories/smsTemplate/repository"));
const method_1 = require("../decorators/method");
const parameters_1 = require("../decorators/parameters");
const zod_1 = require("zod");
const smsMessager_1 = __importDefault(require("../messaging/smsMessager"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/apiKey/repository"));
const queue_1 = __importDefault(require("../services/queue"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/smsMessageLog/repository"));
const permission_1 = __importDefault(require("../permission"));
const repository_4 = __importDefault(require("../mongoose-controller/repositories/emailTemplate/repository"));
const emailMessager_1 = __importDefault(require("../messaging/emailMessager"));
const repository_5 = __importDefault(require("../mongoose-controller/repositories/notificationTemplate/repository"));
const notification_1 = __importDefault(require("../messaging/notification"));
const repository_6 = __importDefault(require("../mongoose-controller/repositories/internalMessageTemplate/repository"));
const internalMessager_1 = __importDefault(require("../messaging/internalMessager"));
class SMSMessagingExternal extends controller_1.default {
    serve(...args) {
        // console.log(super.serve())
        return super.serve();
    }
    constructor() {
        var repo = new repository_1.default();
        super("/external/sms", repo);
        this.apiKeyRepo = new repository_2.default();
        this.smsMessageLogRepo = new repository_3.default();
    }
    // template
    async create(data, apikey, ip) {
        var _a;
        try {
            data.apiCreator = (_a = (await this.apiKeyRepo.findOne({
                token: apikey
            }))) === null || _a === void 0 ? void 0 : _a.token;
        }
        catch (error) {
            throw error;
        }
        return super.create(data);
    }
    async delete(id, apikey, ip) {
        return super.delete(id);
    }
    async editTemplate(data, id, apikey, ip) {
        try {
            var template = await this.repository.findById(id, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
        if (template == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        // var updateData: UpdateQuery<SmsTemplate> = {}
        var updateData = {
            $set: {}
        };
        if (data.text) {
            updateData["$set"]["text"] = data.text;
        }
        updateData["$set"]["sendOTP"] = data.sendOTP;
        if (data.disableDefaultConfig == true) {
            updateData["$unset"] = {
                defaultSmsConfig: 1
            };
        }
        else if (data.defaultSmsConfig) {
            updateData["$set"]["defaultSmsConfig"] = data.defaultSmsConfig;
        }
        return this.editById(id, updateData);
    }
    async doPaginate(page, limit, apikey, ip) {
        try {
            var api = await this.apiKeyRepo.findOne({
                token: {
                    $eq: apikey
                }
            });
            if (api == null)
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            return this.paginate(page, limit, {
                apiCreator: api._id
            });
        }
        catch (error) {
            throw error;
        }
    }
    // @Permission.CheckPermit([
    //     Permission.APIKeyResover(0, "sms", "get-templates")
    // ])
    // @Get("/status")
    // async checkTemplateStatus(
    //     @Header("apikey") apikey: string,
    //     @Query({
    //         destination: "id",
    //         schema: BaseController.id
    //     }) id: string): Promise<Response> {
    //     try {
    //         var status = await SmsMessager.getTemplateStatus(id)
    //     } catch (error) {
    //         throw error
    //     }
    //     if (status == 500) {
    //         return {
    //             status: 500,
    //             message: "خطای داخلی"
    //         }
    //     }
    //     return {
    //         status: 200,
    //         data: { status }
    //     }
    // }
    async validateTitle(title, apikey, ip) {
        return super.checkExists({
            title
        });
    }
    async checkOwnership(id, apikey) {
        try {
            var api = await this.apiKeyRepo.findOne({
                token: apikey
            });
            if (api == null) {
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            }
            if (!await this.repository.isExists({
                apiCreator: {
                    $eq: api === null || api === void 0 ? void 0 : api._id
                },
                _id: id
            })) {
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            }
        }
        catch (error) {
            throw error;
        }
        return {
            next: true
        };
    }
    async sendSMS(template, sendingData, apikey, ip) {
        var id = new mongoose_1.Types.ObjectId();
        sendingData['id'] = id.toHexString();
        sendingData['apikey'] = apikey;
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendSMS", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    id
                }
            };
        }
        try {
            var ok = await smsMessager_1.default.send(sendingData);
            return {
                status: 200,
                data: {
                    ok,
                    id
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sendSMSMulti(template, sendingData, apikey, ip) {
        sendingData['apikey'] = apikey;
        var ids = [];
        for (let i = 0; i < sendingData.data.length; i++) {
            let id = new mongoose_1.Types.ObjectId();
            sendingData.data[i]['id'] = id.toHexString();
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendSMSMulti", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    ids
                }
            };
        }
        try {
            smsMessager_1.default.sendMulti(sendingData);
            return {
                status: 200,
                data: {
                    ok: true,
                    ids
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async cancle(id, apikey, ip) {
        try {
            await queue_1.default.cancel({
                name: {
                    $in: ["sendSMS", "sendSMSMulti"]
                },
                "data.id": id,
                'data.apikey': apikey
            });
            return {
                status: 200
            };
        }
        catch (error) {
            return {
                status: 500,
                message: error
            };
        }
    }
    async checkSendingStatus(id) {
        try {
            var log = await this.smsMessageLogRepo.findById(id);
            if (log == null)
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            if (log.delivered) {
                return {
                    status: 200,
                    data: {
                        code: 1
                    }
                };
            }
            if (log.fialed) {
                return {
                    status: 200,
                    data: {
                        code: -1
                    },
                    message: log.falureMSG
                };
            }
            var status = await smsMessager_1.default.getOTPSMSStatus((log === null || log === void 0 ? void 0 : log.senderId) || "");
            if (status == 1) {
                await this.smsMessageLogRepo.updateOne({ _id: id }, { $set: { delivered: true } });
            }
            if (status == -1) {
                await this.smsMessageLogRepo.updateOne({ _id: id }, { $set: { delivered: false, fialed: true } });
            }
            return {
                status: 200,
                data: await smsMessager_1.default.getOTPSMSStatus((log === null || log === void 0 ? void 0 : log.senderId) || "")
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        this.addPreExecs("", "delete", this.checkOwnership.bind(this));
        this.addPreExecs("", "put", this.checkOwnership.bind(this));
    }
    // @Post()
    async init() {
        // this.addPreExecs("", "post",  HasPermission([
        //     {
        //         func : this.apiKeyRepo.isExists.bind(this.apiKeyRepo),
        //         args:[{
        //             index : 1,
        //             getter : function(value: any){
        //                 token: value
        //             }
        //         }]
        //     }
        // ]))
    }
}
exports.SMSMessagingExternal = SMSMessagingExternal;
__decorate([
    (0, method_1.Post)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "sms", "create-template", 2)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            inputs: zod_1.z.array(zod_1.z.string()),
            text: zod_1.z.string(),
            sendOTP: zod_1.z.boolean().optional(),
            module: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "create", null);
__decorate([
    (0, method_1.Delete)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "sms", "delete-template", 2)
    ]),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "delete", null);
__decorate([
    (0, method_1.Put)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "sms", "update-template", 3)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string().optional(),
            defaultSmsConfig: controller_1.default.id.optional(),
            disableDefaultConfig: zod_1.z.boolean().optional(),
            sendOTP: zod_1.z.boolean().optional()
        })
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "editTemplate", null);
__decorate([
    (0, method_1.Get)("es"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "sms", "get-templates", 3),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "doPaginate", null);
__decorate([
    (0, method_1.Get)("/validate"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "sms", "get-templates", 2),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "title",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "validateTitle", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Header)("apikey"))
], SMSMessagingExternal.prototype, "checkOwnership", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "sms", "send", 2),
    ]),
    (0, method_1.Post)("/send"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            parameters: controller_1.default.search,
            receptor: controller_1.default.phone,
            schadule: zod_1.z.coerce.date().optional()
        })
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "sendSMS", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "sms", "send-multi", 2),
    ]),
    (0, method_1.Post)("/send/multi"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            data: zod_1.z.array(zod_1.z.object({
                parameters: controller_1.default.search,
                receptor: controller_1.default.phone,
            })),
            schadule: zod_1.z.coerce.date().optional()
        })
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "sendSMSMulti", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "sms", "cancle", 2),
    ]),
    (0, method_1.Post)("/cancle"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], SMSMessagingExternal.prototype, "cancle", null);
__decorate([
    (0, method_1.Get)("/sending/status"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], SMSMessagingExternal.prototype, "checkSendingStatus", null);
class EmailMessagingExternal extends controller_1.default {
    constructor() {
        var repo = new repository_4.default();
        super("/external/email", repo);
        this.apiKeyRepo = new repository_2.default();
    }
    async create(data, apikey, ip) {
        var _a;
        var apikey = "";
        try {
            data.apiCreator = (_a = (await this.apiKeyRepo.findOne({
                token: apikey
            }))) === null || _a === void 0 ? void 0 : _a.token;
        }
        catch (error) {
            throw error;
        }
        return super.create(data);
    }
    async delete(id, apikey, ip) {
        return super.delete(id);
    }
    async editTemplate(data, id, apikey, ip) {
        try {
            var template = await this.repository.findById(id, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
        if (template == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        // var updateData: UpdateQuery<SmsTemplate> = {}
        var updateData = {
            $set: {}
        };
        if (data.text) {
            updateData["$set"]["text"] = data.text;
        }
        updateData['$set']['isHTML'] = data.isHTML;
        if (data.disableDefaultConfig == true) {
            updateData["$unset"] = {
                defaultSmsConfig: 1
            };
        }
        else if (data.defaultEmailConfig) {
            updateData["$set"]["defaultEmailConfig"] = data.defaultEmailConfig;
        }
        return this.editById(id, updateData);
    }
    async doPaginate(page, limit, apikey, ip) {
        try {
            var api = await this.apiKeyRepo.findOne({
                token: {
                    $eq: apikey
                }
            });
            if (api == null)
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            return this.paginate(page, limit, {
                apiCreator: api._id
            });
        }
        catch (error) {
            throw error;
        }
    }
    async validateTitle(title, apikey, ip) {
        return super.checkExists({
            title
        });
    }
    async send(sendingData, apikey, ip, files, file) {
        var id = new mongoose_1.Types.ObjectId();
        sendingData['id'] = id.toHexString();
        sendingData['apikey'] = apikey;
        try {
            sendingData['parameters'] = JSON.parse(sendingData.parameters);
        }
        catch (error) {
        }
        if (files) {
            sendingData["files"] = files;
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendEmail", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    id
                }
            };
        }
        try {
            var ok = await emailMessager_1.default.send(sendingData);
            return {
                status: 200,
                data: {
                    ok,
                    id
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sendMulti(sendingData, apikey, ip, file, files) {
        sendingData['apikey'] = apikey;
        var ids = [];
        for (let i = 0; i < sendingData.data.length; i++) {
            let id = new mongoose_1.Types.ObjectId();
            sendingData.data[i]['id'] = id.toHexString();
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendSMSMulti", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    ids
                }
            };
        }
        try {
            smsMessager_1.default.sendMulti(sendingData);
            return {
                status: 200,
                data: {
                    ok: true,
                    ids
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async cancle(id, apikey, ip) {
        try {
            await queue_1.default.cancel({
                name: {
                    $in: ["sendEmail", "sendEmailMulti"]
                },
                "data.id": id,
                'data.apikey': apikey
            });
            return {
                status: 200
            };
        }
        catch (error) {
            return {
                status: 500,
                message: error
            };
        }
    }
    async checkSendingStatus(id) {
        return {
            status: 200
        };
    }
    initApis() {
    }
    async init() {
        // this.addPreExecs("", "post",  HasPermission([
        //     {
        //         func : this.apiKeyRepo.isExists.bind(this.apiKeyRepo),
        //         args:[{
        //             index : 1,
        //             getter : function(value: any){
        //                 token: value
        //             }
        //         }]
        //     }
        // ]))
    }
}
exports.EmailMessagingExternal = EmailMessagingExternal;
__decorate([
    (0, method_1.Post)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "email", "create-template", 2)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            inputs: zod_1.z.array(zod_1.z.string()),
            text: zod_1.z.string(),
            isHTML: zod_1.z.boolean().optional(),
            module: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], EmailMessagingExternal.prototype, "create", null);
__decorate([
    (0, method_1.Delete)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "email", "delete-template", 2)
    ]),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], EmailMessagingExternal.prototype, "delete", null);
__decorate([
    (0, method_1.Put)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "email", "update-template", 3)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string().optional(),
            defaultEmailConfig: controller_1.default.id.optional(),
            disableDefaultConfig: zod_1.z.boolean().optional(),
            isHTML: zod_1.z.boolean().optional()
        })
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], EmailMessagingExternal.prototype, "editTemplate", null);
__decorate([
    (0, method_1.Get)("es"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "email", "get-templates", 3),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], EmailMessagingExternal.prototype, "doPaginate", null);
__decorate([
    (0, method_1.Get)("/validate"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "email", "get-templates", 2),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "title",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], EmailMessagingExternal.prototype, "validateTitle", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "email", "email", 2),
    ]),
    (0, method_1.Post)("/send", {
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            parameters: zod_1.z.string(),
            receptor: controller_1.default.email,
            schadule: zod_1.z.coerce.date().optional(),
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)()),
    __param(3, (0, parameters_1.Body)({
        destination: "files"
    })),
    __param(4, (0, parameters_1.Files)({
        destination: "files",
        isOptional: true,
        config: {
            name: "files",
            maxCount: 10
        },
        schema: zod_1.z.any().optional(),
        mapToBody: true,
    }))
], EmailMessagingExternal.prototype, "send", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "email", "send-multi", 2),
    ]),
    (0, method_1.Post)("/send/multi"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            data: zod_1.z.array(zod_1.z.object({
                parameters: controller_1.default.search,
                receptor: controller_1.default.email,
            })),
            schadule: zod_1.z.coerce.date().optional()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)()),
    __param(3, (0, parameters_1.Files)({
        destination: "files",
        isArray: true,
        isOptional: true,
        config: {
            name: "file",
            maxCount: 10
        },
        mapToBody: true
    })),
    __param(4, (0, parameters_1.Body)({
        destination: "files"
    }))
], EmailMessagingExternal.prototype, "sendMulti", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "email", "cancle", 2),
    ]),
    (0, method_1.Post)("/cancle"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], EmailMessagingExternal.prototype, "cancle", null);
__decorate([
    (0, method_1.Get)("/sending/status"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], EmailMessagingExternal.prototype, "checkSendingStatus", null);
class NotifMessagingExternal extends controller_1.default {
    constructor() {
        var repo = new repository_5.default();
        super("/external/notif", repo);
        this.apiKeyRepo = new repository_2.default();
    }
    async create(data, apikey, ip) {
        var _a;
        var apikey = "";
        try {
            data.apiCreator = (_a = (await this.apiKeyRepo.findOne({
                token: apikey
            }))) === null || _a === void 0 ? void 0 : _a.token;
        }
        catch (error) {
            throw error;
        }
        return super.create(data);
    }
    async delete(id, apikey, ip) {
        return super.delete(id);
    }
    async editTemplate(data, id, apikey, ip) {
        try {
            var template = await this.repository.findById(id, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
        if (template == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        // var updateData: UpdateQuery<SmsTemplate> = {}
        var updateData = {
            $set: {}
        };
        if (data.text) {
            updateData["$set"]["text"] = data.text;
        }
        if (data.disableDefaultConfig == true) {
            updateData["$unset"] = {
                defaultSmsConfig: 1
            };
        }
        else if (data.defaultNotificationConfig) {
            updateData["$set"]["defaultNotificationConfig"] = data.defaultNotificationConfig;
        }
        return this.editById(id, updateData);
    }
    async doPaginate(page, limit, apikey, ip) {
        try {
            var api = await this.apiKeyRepo.findOne({
                token: {
                    $eq: apikey
                }
            });
            if (api == null)
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            return this.paginate(page, limit, {
                apiCreator: api._id
            });
        }
        catch (error) {
            throw error;
        }
    }
    async validateTitle(title, apikey, ip) {
        return super.checkExists({
            title
        });
    }
    async send(sendingData, apikey, ip) {
        var id = new mongoose_1.Types.ObjectId();
        sendingData['id'] = id.toHexString();
        sendingData['apikey'] = apikey;
        try {
            sendingData['parameters'] = JSON.parse(sendingData.parameters);
        }
        catch (error) {
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendNotif", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    id
                }
            };
        }
        try {
            var ok = await notification_1.default.send(sendingData);
            return {
                status: 200,
                data: {
                    ok,
                    id
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sendMulti(sendingData, apikey, ip) {
        sendingData['apikey'] = apikey;
        var ids = [];
        for (let i = 0; i < sendingData.data.length; i++) {
            let id = new mongoose_1.Types.ObjectId();
            sendingData.data[i]['id'] = id.toHexString();
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendNotifMulti", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    ids
                }
            };
        }
        try {
            notification_1.default.sendMulti(sendingData);
            return {
                status: 200,
                data: {
                    ok: true,
                    ids
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async cancle(id, apikey, ip) {
        try {
            await queue_1.default.cancel({
                name: {
                    $in: ["sendNotifMulti", "sendNotifMulti"]
                },
                "data.id": id,
                'data.apikey': apikey
            });
            return {
                status: 200
            };
        }
        catch (error) {
            return {
                status: 500,
                message: error
            };
        }
    }
    initApis() {
    }
    async init() {
        // this.addPreExecs("", "post",  HasPermission([
        //     {
        //         func : this.apiKeyRepo.isExists.bind(this.apiKeyRepo),
        //         args:[{
        //             index : 1,
        //             getter : function(value: any){
        //                 token: value
        //             }
        //         }]
        //     }
        // ]))
    }
}
exports.NotifMessagingExternal = NotifMessagingExternal;
__decorate([
    (0, method_1.Post)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "notif", "create-template", 2)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            inputs: zod_1.z.array(zod_1.z.string()),
            text: zod_1.z.string(),
            module: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "create", null);
__decorate([
    (0, method_1.Delete)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "notif", "delete-template", 2)
    ]),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "delete", null);
__decorate([
    (0, method_1.Put)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "notif", "update-template", 3)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string().optional(),
            defaultNotificationConfig: controller_1.default.id.optional(),
            disableDefaultConfig: zod_1.z.boolean().optional()
        })
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "editTemplate", null);
__decorate([
    (0, method_1.Get)("es"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "notif", "get-templates", 3),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "doPaginate", null);
__decorate([
    (0, method_1.Get)("/validate"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "notif", "get-templates", 2),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "title",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "validateTitle", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "notif", "send", 2),
    ]),
    (0, method_1.Post)("/send"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            parameters: zod_1.z.string(),
            receptor: zod_1.z.string(),
            schadule: zod_1.z.coerce.date().optional(),
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "send", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "notif", "send-multi", 2),
    ]),
    (0, method_1.Post)("/send/multi"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            data: zod_1.z.array(zod_1.z.object({
                parameters: controller_1.default.search,
                receptor: zod_1.z.string(),
            })),
            schadule: zod_1.z.coerce.date().optional()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "sendMulti", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "notif", "cancle", 2),
    ]),
    (0, method_1.Post)("/cancle"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], NotifMessagingExternal.prototype, "cancle", null);
class InternalMessageExternal extends controller_1.default {
    constructor() {
        var repo = new repository_6.default();
        super("/external/inernalmsg", repo);
        this.apiKeyRepo = new repository_2.default();
    }
    async create(data, apikey, ip) {
        var _a;
        var apikey = "";
        try {
            data.apiCreator = (_a = (await this.apiKeyRepo.findOne({
                token: apikey
            }))) === null || _a === void 0 ? void 0 : _a.token;
        }
        catch (error) {
            throw error;
        }
        return super.create(data);
    }
    async delete(id, apikey, ip) {
        return super.delete(id);
    }
    async editTemplate(data, id, apikey, ip) {
        try {
            var template = await this.repository.findById(id, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
        if (template == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        // var updateData: UpdateQuery<SmsTemplate> = {}
        var updateData = {
            $set: {}
        };
        if (data.text) {
            updateData["$set"]["text"] = data.text;
        }
        return this.editById(id, updateData);
    }
    async doPaginate(page, limit, apikey, ip) {
        try {
            var api = await this.apiKeyRepo.findOne({
                token: {
                    $eq: apikey
                }
            });
            if (api == null)
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            return this.paginate(page, limit, {
                apiCreator: api._id
            });
        }
        catch (error) {
            throw error;
        }
    }
    async validateTitle(title, apikey, ip) {
        return super.checkExists({
            title
        });
    }
    async send(sendingData, apikey, ip) {
        var id = new mongoose_1.Types.ObjectId();
        sendingData['id'] = id.toHexString();
        sendingData['apikey'] = apikey;
        try {
            sendingData['parameters'] = JSON.parse(sendingData.parameters);
        }
        catch (error) {
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendInternal", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    id
                }
            };
        }
        try {
            var ok = await internalMessager_1.default.send(sendingData);
            return {
                status: 200,
                data: {
                    ok,
                    id
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sendMulti(sendingData, apikey, ip) {
        sendingData['apikey'] = apikey;
        var ids = [];
        for (let i = 0; i < sendingData.data.length; i++) {
            let id = new mongoose_1.Types.ObjectId();
            sendingData.data[i]['id'] = id.toHexString();
        }
        if (sendingData.schadule) {
            var job = await queue_1.default.schedule(sendingData.schadule, "sendInternalMulti", sendingData);
            return {
                status: 200,
                data: {
                    schaduled: true,
                    ids
                }
            };
        }
        try {
            internalMessager_1.default.sendMulti(sendingData);
            return {
                status: 200,
                data: {
                    ok: true,
                    ids
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async cancle(id, apikey, ip) {
        try {
            await queue_1.default.cancel({
                name: {
                    $in: ["sendInternal", "sendInternalMulti"]
                },
                "data.id": id,
                'data.apikey': apikey
            });
            return {
                status: 200
            };
        }
        catch (error) {
            return {
                status: 500,
                message: error
            };
        }
    }
    initApis() {
    }
    async init() {
        // this.addPreExecs("", "post",  HasPermission([
        //     {
        //         func : this.apiKeyRepo.isExists.bind(this.apiKeyRepo),
        //         args:[{
        //             index : 1,
        //             getter : function(value: any){
        //                 token: value
        //             }
        //         }]
        //     }
        // ]))
    }
}
exports.InternalMessageExternal = InternalMessageExternal;
__decorate([
    (0, method_1.Post)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "internal", "create-template", 2)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            inputs: zod_1.z.array(zod_1.z.string()),
            text: zod_1.z.string(),
            module: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "create", null);
__decorate([
    (0, method_1.Delete)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "internal", "delete-template", 2)
    ]),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "delete", null);
__decorate([
    (0, method_1.Put)(""),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "internal", "update-template", 3)
    ]),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string().optional()
        })
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "editTemplate", null);
__decorate([
    (0, method_1.Get)("es"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(2, "internal", "get-templates", 3),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Header)("apikey")),
    __param(3, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "doPaginate", null);
__decorate([
    (0, method_1.Get)("/validate"),
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "internal", "get-templates", 2),
    ]),
    __param(0, (0, parameters_1.Query)({
        destination: "title",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "validateTitle", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "internal", "send", 2),
    ]),
    (0, method_1.Post)("/send"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            parameters: zod_1.z.string(),
            receptor: zod_1.z.string(),
            namespace: zod_1.z.string(),
            schadule: zod_1.z.coerce.date().optional(),
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "send", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "internal", "send-multi", 2),
    ]),
    (0, method_1.Post)("/send/multi"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            template: zod_1.z.string(),
            data: zod_1.z.array(zod_1.z.object({
                parameters: controller_1.default.search,
                receptor: zod_1.z.string(),
            })),
            namespace: zod_1.z.string(),
            schadule: zod_1.z.coerce.date().optional()
        })
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "sendMulti", null);
__decorate([
    permission_1.default.CheckPermit([
        permission_1.default.APIKeyResover(1, "internal", "cancle", 2),
    ]),
    (0, method_1.Post)("/cancle"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Header)("apikey")),
    __param(2, (0, parameters_1.IP)())
], InternalMessageExternal.prototype, "cancle", null);
