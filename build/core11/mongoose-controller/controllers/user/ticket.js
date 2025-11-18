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
const model_1 = require("../../repositories/ticket/model");
const repository_1 = __importDefault(require("../../repositories/ticket/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../../decorators/method");
const repository_2 = __importDefault(require("../../repositories/fileManagerConfig/repository"));
const config_1 = __importDefault(require("../../../services/config"));
// import { UserInfo } from 
class TicketController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    create(data, user, file, files) {
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
        return super.create(data);
    }
    async closeTicket(id) {
        return this.editById(id, {
            $set: {
                state: model_1.TicketState.closed,
                lastModified: new Date(),
                stateNumber: 0,
                closeDate: new Date()
            }
        });
    }
    async openTicket(id) {
        return this.editById(id, {
            $set: {
                state: model_1.TicketState.open,
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
        return await this.editById(id, query);
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
    async search(page, limit, reqQuery, user) {
        var query = await this.searchHelper(reqQuery);
        return await this.paginate(page, limit, query, {
            sort: this.getSort(reqQuery)
        }, user);
    }
    paginate(page, limit, query, options, user) {
        if (user) {
            if (!query) {
                query = {};
            }
            query.user = user.id;
        }
        return super.paginate(page, limit, query, options);
    }
    async moveFilesToCDN() {
        // console.log("here")
        return {
            next: true
        };
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addPreExecs("/message", "post", this.moveFilesToCDN.bind(this));
    }
}
exports.TicketController = TicketController;
__decorate([
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
    (0, method_1.Put)("/close"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], TicketController.prototype, "closeTicket", null);
__decorate([
    (0, method_1.Put)("/open"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
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
    __param(3, (0, parameters_1.User)())
], TicketController.prototype, "search", null);
__decorate([
    __param(4, (0, parameters_1.User)())
], TicketController.prototype, "paginate", null);
var ticket = new TicketController("/ticket", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        "notes": zod_1.default.string(),
        "importance": zod_1.default.number().default(1),
        "subject": zod_1.default.string(),
        "owner": zod_1.default.string().default("user"),
        "user": controller_1.default.id,
        "department": controller_1.default.id,
        "messages": zod_1.default.array(zod_1.default.object({
            text: zod_1.default.string(),
            files: zod_1.default.array(zod_1.default.string())
        }).omit({
            "files": true
        })),
        "lastMessage": zod_1.default.string().default("user"),
        "starter": zod_1.default.string().default("user")
    }),
    searchFilters: {
        department: ["eq"],
        state: ["eq", "list"],
        importance: ["eq", "lte", "gte", "list"],
        subject: ["reg", "eq"],
        ticketNumber: ["eq", "lte", "gte"],
        lastModified: ["gte", "lte"]
    },
    apiDoc: {
        security: [{
                BasicAuth: []
            }]
    }
});
exports.default = ticket;
