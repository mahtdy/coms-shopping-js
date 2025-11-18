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
exports.TicketController = void 0;
const parameters_1 = require("../../../decorators/parameters");
const controller_1 = __importDefault(require("../../controller"));
const repository_1 = __importDefault(require("../../repositories/ticket/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../../decorators/method");
const repository_2 = __importDefault(require("../../repositories/fileManagerConfig/repository"));
const config_1 = __importDefault(require("../../../services/config"));
const repository_3 = __importDefault(require("../../repositories/department/repository"));
// import { UserInfo } from 
class TicketController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.departmentRepo = new repository_3.default();
        // this.loginRequired = true
        this.apiDoc = {
            security: [{
                    BasicAuth: []
                }]
        };
    }
    create(data, user, file, files) {
        data.messages = JSON.parse(data.messages);
        if (data.messages) {
            for (let i = 0; i < data.messages.length; i++) {
                data.messages[i].from = 'user';
                data.messages[i].user = user.id;
            }
            if (file && file != "") {
                try {
                    data.messages[0]['files'] = [{
                            path: file,
                            size: files[0].size / 1000
                        }];
                }
                catch (error) {
                }
            }
        }
        data.owner = "user";
        data.user = user.id;
        data.starter = "user";
        data.lastMessage = "user";
        return super.create(data);
    }
    async getTicket(id, user) {
        return this.findOne({
            _id: id,
            user: user.id
        });
    }
    async closeTicket(id, user) {
        return this.editOne({
            user: user.id,
            _id: id
        }, {
            $set: {
                state: "closed",
                lastModified: new Date(),
                stateNumber: 0,
                closeDate: new Date()
            }
        });
    }
    async openTicket(id, user) {
        return this.editOne({
            user: user.id,
            _id: id
        }, {
            $set: {
                state: "open",
                stateNumber: 1,
                lastModified: new Date()
            },
            $unset: {
                closeDate: 1
            }
        });
    }
    async addMessage(messages, id, user, file, files, state) {
        if (messages) {
            for (let i = 0; i < messages.length; i++) {
                messages[i].from = 'user';
                messages[i].user = user.id;
            }
            if (file != "") {
                try {
                    messages[0]['files'] = [{
                            path: file,
                            size: files[0].size / 1000
                        }];
                }
                catch (error) {
                }
            }
        }
        var query = {
            $push: { messages: messages },
            $set: {
                lastMessage: 'user',
                lastModified: new Date(),
                stateNumber: 1,
                user: user.id
            },
            $unset: {
                closeDate: 1
            }
        };
        if (state) {
            query["$set"]["state"] = state;
        }
        return this.editOne({
            user: user.id,
            _id: id
        }, query);
    }
    async getCountByState(user) {
        try {
            return {
                status: 200,
                data: await this.repository.getCountByState({
                    user: user.id
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    getSearchList() {
        return {
            status: 200,
            data: Object.assign(this.searchFilters, {
                user: ["eq"]
            })
        };
    }
    async searchDepartment() {
        try {
            return {
                data: await this.departmentRepo.paginate({}, 20, 1),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async search(page, limit, reqQuery, user) {
        var query = await this.searchHelper(reqQuery);
        query["user"] = user.id;
        return await this.paginate(page, limit, query, {
            sort: this.getSort(reqQuery),
            population: [{
                    path: "department",
                    select: ["name"]
                }]
        }, user);
    }
    async submitFeedback(data, user) {
        return this.editOne({
            user: user.id,
            _id: data.id
        }, {
            $set: {
                feedback: data.feedback,
                feedbackStar: data.feedbackStar
            }
        });
    }
    async moveFilesToCDN() {
        // console.log("here")
        return {
            next: true
        };
    }
    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addPreExecs("/message", "post", this.moveFilesToCDN.bind(this));
    }
}
exports.TicketController = TicketController;
__decorate([
    (0, method_1.Post)(""),
    __param(1, (0, parameters_1.User)()),
    __param(2, (0, parameters_1.Body)({
        destination: "file"
    })),
    __param(3, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 1,
            types: ["jpg", "pdf", "png", "zip"]
        },
        schema: zod_1.default.any().optional(),
        destination: "file",
        mapToBody: true,
        moveFilesToCDN: {
            name: "file",
            config: {
                path: "ticketing/",
                customServer: async function () {
                    try {
                        var cdnRepo = new repository_2.default();
                        var conf = await cdnRepo.findOne({
                            isDefaultContent: true
                        });
                        var conf = await cdnRepo.findOne({
                            isDefault: true
                        });
                        if (conf == null) {
                            return config_1.default.getConfig("TEMP_FILEMANAGER");
                        }
                        return conf;
                    }
                    catch (error) {
                        return config_1.default.getConfig("TEMP_FILEMANAGER");
                    }
                }
            }
        },
        isOptional: true
    }))
], TicketController.prototype, "create", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.User)())
], TicketController.prototype, "getTicket", null);
__decorate([
    (0, method_1.Put)("/close"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.User)())
], TicketController.prototype, "closeTicket", null);
__decorate([
    (0, method_1.Put)("/open"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.User)())
], TicketController.prototype, "openTicket", null);
__decorate([
    (0, method_1.Post)("/message", {
        contentType: "multipart/form-data",
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "messages",
        schema: zod_1.default.array(zod_1.default.object({
            text: zod_1.default.string(),
            files: zod_1.default.array(zod_1.default.string()).default([])
        }).omit({ "files": true })),
        parseJson: true,
        isArray: true
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.User)()),
    __param(3, (0, parameters_1.Body)({
        destination: "file"
    })),
    __param(4, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 5,
            types: ["jpg", "pdf", "png", "zip"]
        },
        schema: zod_1.default.any().optional(),
        destination: "file",
        mapToBody: true,
        moveFilesToCDN: {
            name: "file",
            config: {
                path: "ticketing/",
                customServer: async function () {
                    try {
                        var cdnRepo = new repository_2.default();
                        var conf = await cdnRepo.findOne({
                            isDefaultContent: true
                        });
                        if (conf == null) {
                            return config_1.default.getConfig("TEMP_FILEMANAGER");
                        }
                        return conf;
                    }
                    catch (error) {
                        return config_1.default.getConfig("TEMP_FILEMANAGER");
                    }
                }
            }
        },
        isOptional: true
    }))
], TicketController.prototype, "addMessage", null);
__decorate([
    (0, method_1.Get)("s/count"),
    __param(0, (0, parameters_1.User)())
], TicketController.prototype, "getCountByState", null);
__decorate([
    (0, method_1.Get)("/search/list")
], TicketController.prototype, "getSearchList", null);
__decorate([
    (0, method_1.Get)("/department/search")
], TicketController.prototype, "searchDepartment", null);
__decorate([
    (0, method_1.Get)("/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Query)({
        schema: controller_1.default.search
    })),
    __param(3, (0, parameters_1.User)())
], TicketController.prototype, "search", null);
__decorate([
    (0, method_1.Post)("/feedback"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.default.object({
            id: controller_1.default.id,
            feedback: zod_1.default.string(),
            feedbackStar: zod_1.default.coerce.number().int().min(0).max(5).optional()
        })
    })),
    __param(1, (0, parameters_1.User)())
], TicketController.prototype, "submitFeedback", null);
var ticket = new TicketController("/ticket", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        "importance": controller_1.default.numberFromForm.default("1"),
        "subject": zod_1.default.string(),
        "department": controller_1.default.id,
        "messages": zod_1.default.string()
    }),
    searchFilters: {
        _id: ["list", "eq"],
        department: ["eq"],
        state: ["eq", "list"],
        importance: ["eq", "lte", "gte", "list"],
        subject: ["reg", "eq"],
        ticketNumber: ["eq", "lte", "gte"],
        lastModified: ["gte", "lte"]
    },
    population: [
        {
            path: "messages.admin",
            select: ["name", "familyName"]
        },
        {
            path: "messages.assignedAdmin",
            select: ["name", "familyName"]
        },
        {
            path: "messages.assigner",
            select: ["name", "familyName"]
        },
        {
            path: "department",
            select: ["name"]
        },
        {
            path: "messages.department",
            select: ["name"]
        },
        {
            path: "messages.assignerDepartment",
            select: ["name"]
        }
    ],
    apiDoc: {
        security: [{
                BasicAuth: []
            }]
    }
});
exports.default = ticket;
