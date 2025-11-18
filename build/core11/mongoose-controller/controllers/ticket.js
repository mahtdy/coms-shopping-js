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
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const model_1 = require("../repositories/ticket/model");
const repository_1 = __importDefault(require("../repositories/ticket/repository"));
const zod_1 = __importDefault(require("zod"));
const fileManager_1 = __importDefault(require("../../services/fileManager"));
const method_1 = require("../../decorators/method");
const repository_2 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const config_1 = __importDefault(require("../../services/config"));
class TicketController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        if (options === null || options === void 0 ? void 0 : options.userRepo)
            this.userRepo = options.userRepo;
    }
    async create(data, admin, file, files) {
        if (data.messages) {
            for (let i = 0; i < data.messages.length; i++) {
                data.messages[i].from = 'admin';
                data.messages[i].admin = admin._id;
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
        data.owner = "admin";
        data.admin = admin._id;
        data.starterAdmin = admin._id;
        data.starter = 'admin';
        return await super.create(data);
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
    async assignTicket(adminId, ticketId, admin, departmentId) {
        let query = {
            $set: {
                "admin": adminId,
                "state": "ارجاء شده"
            }
        };
        if (departmentId) {
            query['$set']['department'] = departmentId;
        }
        query["$push"] = {
            messages: {
                department: departmentId,
                from: "admin",
                admin: adminId,
                isAssigned: true,
                assigner: admin._id
            },
            admins: admin._id
        };
        if (admin.department) {
            query["$push"]["messages"]["assignerDepartment"] = admin.department;
        }
        return this.editById(ticketId, query);
    }
    async addMessage(messages, id, admin, file, files, state) {
        if (messages) {
            for (let i = 0; i < messages.length; i++) {
                messages[i].from = 'admin';
                messages[i].admin = admin._id;
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
                lastMessage: 'admin',
                lastModified: new Date(),
                stateNumber: 1,
                admin: admin._id
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
    async addNote(id, note, admin) {
        return this.editById(id, {
            $set: {
                notes: note
            },
            $push: {
                messages: {
                    from: 'admin',
                    admin: admin._id,
                    isNote: true,
                    text: note
                }
            }
        });
    }
    async getCountByState() {
        try {
            return {
                status: 200,
                data: await this.repository.getCountByState({})
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
    async searchHelper(queryParam) {
        var _a;
        var q = await super.searchHelper(queryParam);
        if (queryParam["user$eq"]) {
            try {
                var user = await ((_a = this.userRepo) === null || _a === void 0 ? void 0 : _a.findOne({
                    phoneNumber: queryParam["user$eq"]
                }));
            }
            catch (error) {
                throw error;
            }
            if (user != null) {
                q["user"] = user._id;
            }
        }
        return q;
    }
    async editMessage(ticketId, messageId, text) {
        try {
            return this.editOne({
                _id: ticketId,
                $expr: {
                    $eq: [{ "$indexOfArray": ["$messages._id", messageId] }, {
                            $subtract: [{ $size: "$messages" }, 1]
                        }]
                },
                "messages._id": messageId
            }, {
                $set: {
                    "messages.$.text": text
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async deleteMessage(ticketId, messageId) {
        var _a;
        try {
            var response = await this.editOne({
                _id: ticketId,
                $expr: {
                    $eq: [{ $indexOfArray: ["$messages._id", messageId] }, {
                            $subtract: [{ $size: "$messages" }, 1]
                        }]
                }
            }, {
                $pop: {
                    messages: 1
                }
            });
            //delete data from cdn
            if ((response === null || response === void 0 ? void 0 : response.status) == 200) {
                var messages = (_a = response.data) === null || _a === void 0 ? void 0 : _a.messages;
                var lastMessage = messages[messages.length - 1];
                if (lastMessage.files) {
                    var cdn = new fileManager_1.default();
                    if (lastMessage.files[0]) {
                        await cdn.findCdnFromUrl(lastMessage.files[0].path);
                        await cdn.removeFiles(lastMessage.files.map((elem) => {
                            return elem.path;
                        }));
                    }
                }
            }
            return response;
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
    }
}
exports.TicketController = TicketController;
__decorate([
    __param(1, (0, parameters_1.Admin)()),
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
    (0, method_1.Put)("/assign"),
    __param(0, (0, parameters_1.Body)({
        destination: "adminId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "ticketId",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Admin)()),
    __param(3, (0, parameters_1.Body)({
        destination: "departmentId",
        schema: controller_1.default.id.optional()
    }))
], TicketController.prototype, "assignTicket", null);
__decorate([
    (0, method_1.Post)("/message", {
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "messages",
        schema: zod_1.default.array(zod_1.default.object({
            text: zod_1.default.string(),
            files: zod_1.default.array(zod_1.default.string())
        }).omit({
            "files": true
        }))
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Admin)()),
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
    (0, method_1.Post)("/note"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "note",
        schema: zod_1.default.string()
    })),
    __param(2, (0, parameters_1.Admin)())
], TicketController.prototype, "addNote", null);
__decorate([
    (0, method_1.Get)("s/count")
], TicketController.prototype, "getCountByState", null);
__decorate([
    (0, method_1.Get)("/search/list")
], TicketController.prototype, "getSearchList", null);
__decorate([
    (0, method_1.Put)("/message"),
    __param(0, (0, parameters_1.Body)({
        destination: "ticketId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "messageId",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "text",
        schema: zod_1.default.string()
    }))
], TicketController.prototype, "editMessage", null);
__decorate([
    (0, method_1.Delete)("/message"),
    __param(0, (0, parameters_1.Body)({
        destination: "ticketId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "messageId",
        schema: controller_1.default.id
    }))
], TicketController.prototype, "deleteMessage", null);
var ticket = new TicketController("/ticket", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        "notes": zod_1.default.string(),
        "importance": zod_1.default.number().default(1),
        "subject": zod_1.default.string(),
        "owner": zod_1.default.string().default("admin"),
        "user": controller_1.default.id,
        "department": controller_1.default.id,
        "messages": zod_1.default.array(zod_1.default.object({
            text: zod_1.default.string(),
            files: zod_1.default.array(zod_1.default.string())
        }).omit({
            "files": true
        })),
        "lastMessage": zod_1.default.string().default("admin"),
        "starter": zod_1.default.string().default("admin")
    }),
    searchFilters: {
        department: ["eq"],
        state: ["eq", "list"],
        importance: ["eq", "lte", "gte", "list"],
        subject: ["reg", "eq"],
        ticketNumber: ["eq", "lte", "gte"],
        lastModified: ["gte", "lte"]
    }
});
exports.default = ticket;
