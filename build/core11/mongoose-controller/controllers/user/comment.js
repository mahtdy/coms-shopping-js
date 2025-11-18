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
exports.CommentController = void 0;
const controller_1 = __importDefault(require("../../controller"));
const zod_1 = require("zod");
const method_1 = require("../../../decorators/method");
const parameters_1 = require("../../../decorators/parameters");
const repository_1 = __importDefault(require("../../repositories/languageComment/repository"));
const repository_2 = __importDefault(require("../../repositories/userComment/repository"));
const fileManager_1 = __importDefault(require("../../../services/fileManager"));
const article_1 = require("../article");
const repository_3 = __importDefault(require("../../repositories/fileManagerConfig/repository"));
const path_1 = __importDefault(require("path"));
const repository_4 = __importDefault(require("../../repositories/user/repository"));
const random_1 = __importDefault(require("../../../random"));
const smsMessager_1 = __importDefault(require("../../../messaging/smsMessager"));
const reopository_1 = __importDefault(require("../../repositories/commentForm/reopository"));
const repository_5 = __importDefault(require("../../repositories/language/repository"));
const repository_6 = __importDefault(require("../../repositories/domain/repository"));
const axios_1 = __importDefault(require("axios"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const repository_7 = __importDefault(require("../../repositories/commentBlock/repository"));
const repository_8 = __importDefault(require("../../repositories/notificationTokens/repository"));
class CommentController extends controller_1.default {
    constructor(baseRoute, repo, userModel, options) {
        super(baseRoute, repo, options);
        this.languageCommentRepo = new repository_1.default();
        this.userCommentRepo = new repository_2.default();
        this.cdnRepo = new repository_3.default();
        this.userRepo = new repository_4.default({
            model: userModel
        });
        this.commentFormRepo = new reopository_1.default();
        this.languageRepo = new repository_5.default();
        this.domainRepo = new repository_6.default();
        this.commentBlockRepo = new repository_7.default();
        this.notificationTokenRepo = new repository_8.default();
    }
    serve() {
        var middlewares = Reflect.getMetadata("middlewares" + this.constructor.name, this) || {};
        var logRoutes = Reflect.getMetadata("logRoutes" + this.constructor.name, this) || {};
        this.routes.forEach(element => {
            var name = element.execs.name.replace("bound ", "");
            // console.log(name)
            if (middlewares[name]) {
                if (!element.middlewares) {
                    element.middlewares = [];
                }
                element.middlewares.push(...middlewares[name]);
            }
            element.log = logRoutes[name];
            var confs = Reflect.getMetadata(name + this.constructor.name, this);
            // console.log(name)
            element.meta = confs;
            if (element.preExecs) {
                for (let i = 0; i < element.preExecs.length; i++) {
                    if (!element.preExecs[i].meta) {
                        var name = element.preExecs[i].func.name.replace("bound ", "");
                        var confs = Reflect.getMetadata(name + this.constructor.name, this);
                        // console.log(element.method,element.route,"confs" ,confs)
                        element.preExecs[i].meta = confs;
                    }
                }
            }
            if (this.apiDoc) {
                element.apiDoc = Object.assign(this.apiDoc, element.apiDoc);
            }
            return element;
        });
        // return this.routes
        return super.serve();
    }
    initApis() {
        this.sync();
    }
    async sync() {
        let comments = await this.repository.findAll({});
        for (let i = 0; i < comments.length; i++) {
            try {
                let c = await this.repository.getcount({
                    reply: comments[i]._id,
                    status: "confirmed"
                });
                await this.repository.updateOne({
                    _id: comments[i]._id
                }, {
                    $set: {
                        replies: c
                    }
                });
            }
            catch (error) {
            }
        }
    }
    async checkBlock(user, hash) {
        var _a;
        try {
            let phone;
            if (user == undefined) {
                if (hash == undefined) {
                    return {
                        status: 403
                    };
                }
                let commentForm = await this.commentFormRepo.findOne({
                    hash
                });
                if (commentForm == null) {
                    return {
                        status: 403
                    };
                }
                phone = (_a = commentForm.info) === null || _a === void 0 ? void 0 : _a.phone;
            }
            else {
                phone = user.phoneNumber;
            }
            let block = await this.commentBlockRepo.findOne({
                phone
            });
            if (block == null || block.enabled == false) {
                return {
                    next: true
                };
            }
            if (block.blockType == "permanent"
                || block.expire > new Date()) {
                return {
                    status: 403,
                    data: block
                };
            }
            return {
                next: true
            };
        }
        catch (error) {
            throw error;
        }
    }
    async create(data, commentInfo, ip, user) {
        if (user != undefined) {
            data.user = user.id;
        }
        if (user == undefined) {
            if (data.hash == undefined) {
                return {
                    status: 403
                };
            }
            let inf = await this.commentFormRepo.findOne({ hash: data.hash });
            if (inf == null) {
                return {
                    status: 403
                };
            }
            data.userInfo = inf.info;
        }
        let reply;
        try {
            let lang = await this.languageCommentRepo.findOne({
                language: data.language
            });
            if (lang != null) {
                if (lang["ungegistered-user-comment"] == false) {
                    data.user = user.id;
                }
                if (lang["comment-submit-without-confirm"] == true) {
                    if (data.reply) {
                        reply = data.reply;
                    }
                    data.status = "confirmed";
                }
                // if(captch)
            }
        }
        catch (error) {
        }
        if (commentInfo == undefined) {
            commentInfo = {};
        }
        let geo = geoip_lite_1.default.lookup(ip);
        commentInfo["geo"] = geo;
        commentInfo["ip"] = ip;
        data.commentInfo = commentInfo;
        let res = await super.create(data);
        if (reply != undefined) {
            let replyDoc = await this.repository.findOneAndUpdate({
                _id: reply
            }, {
                $inc: {
                    replies: 1
                }
            });
            await this.repository.updateOne({
                _id: res.data["_id"]
            }, {
                $set: {
                    level: ((replyDoc === null || replyDoc === void 0 ? void 0 : replyDoc.level) || 1) + 1
                }
            });
        }
        return res;
    }
    async subscribeNotification(host, body, user, hash) {
        try {
            let domain = await this.domainRepo.findOne({
                domain: host
            });
            if (domain == null) {
                return {
                    status: 400
                };
            }
            if (user == undefined) {
                await this.commentFormRepo.updateOne({
                    hash: {
                        $eq: hash
                    }
                }, {
                    $push: {
                        notificationTokens: {
                            domain: domain._id,
                            type: "web-push",
                            config: body
                        }
                    }
                });
            }
            else {
                await this.userRepo.updateOne({
                    _id: user.id
                }, {
                    $push: {
                        notificationTokens: {
                            domain: domain._id,
                            type: "web-push",
                            config: body
                        }
                    }
                });
            }
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getDomainNotificationPublicKey(host) {
        var _a;
        try {
            let domain = await this.domainRepo.findOne({
                domain: host
            });
            if (domain == null) {
                return {
                    status: 400
                };
            }
            return {
                status: 200,
                data: (_a = domain.notificationConfig) === null || _a === void 0 ? void 0 : _a.publicKey
            };
        }
        catch (error) {
            throw error;
        }
    }
    async paginateComments(page, limit, pageId, sortOrder, cType, hash, user) {
        let clientId;
        if (user == undefined) {
            if (hash != undefined) {
                clientId = hash;
            }
        }
        else {
            clientId = user.phoneNumber;
        }
        let sort = {
            _id: -1
        };
        if (sortOrder == "oldest") {
            sort = {
                _id: 1
            };
        }
        if (sortOrder == "most-like") {
            sort = {
                like: -1
            };
        }
        if (sortOrder == "most-replied") {
            sort = {
                replies: -1
            };
        }
        let query = {
            page: pageId,
            status: "confirmed",
            reply: {
                $exists: false
            }
        };
        if (cType != undefined) {
            query["type"] = cType;
        }
        let res = await this.paginate(page, limit, query, {
            population: [
                {
                    path: "user"
                },
                {
                    path: "reply"
                },
                {
                    path: "userReplied"
                },
                {
                    path: "admin",
                    select: ["name", "familyName"]
                },
                {
                    path: "adminReplied",
                    select: ["name", "familyName"]
                }
            ],
            sort
        });
        if (clientId != undefined) {
            try {
                let list = JSON.parse(JSON.stringify(res.data.list));
                for (let i = 0; i < list.length; i++) {
                    let c = await this.userCommentRepo.findOne({
                        comment: list[i]._id,
                        clientId
                    });
                    if (c != null) {
                        list[i].likeComment = c.type;
                    }
                }
                res.data.list = list;
            }
            catch (error) {
            }
        }
        return res;
    }
    async getReplies(comment, limit, page, hash, user) {
        try {
            let clientId;
            if (user == undefined) {
                if (hash != undefined) {
                    clientId = hash;
                }
            }
            else {
                clientId = user.phoneNumber;
            }
            let res = {
                data: await this.repository.paginate({
                    reply: comment,
                    status: "confirmed",
                }, limit, page, {
                    population: [
                        {
                            path: "user"
                        },
                        {
                            path: "reply"
                        },
                        {
                            path: "userReplied"
                        },
                        {
                            path: "admin",
                            select: ["name", "familyName"]
                        },
                        {
                            path: "adminReplied",
                            select: ["name", "familyName"]
                        }
                    ]
                })
            };
            if (clientId != undefined) {
                try {
                    let list = JSON.parse(JSON.stringify(res.data.list));
                    for (let i = 0; i < list.length; i++) {
                        let c = await this.userCommentRepo.findOne({
                            comment: list[i]._id,
                            clientId
                        });
                        if (c != null) {
                            list[i].likeComment = c.type;
                        }
                    }
                    res.data.list = list;
                }
                catch (error) {
                }
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async getComment(comment) {
        try {
            return this.findById(comment);
        }
        catch (error) {
            throw error;
        }
    }
    async likeComment(clientId, comment, language) {
        try {
            let languageConfig = await this.languageCommentRepo.findOne({
                language
            });
            let type = "like-dislike";
            if (languageConfig != null) {
                type = languageConfig["like-type"];
            }
            let userComment = await this.userCommentRepo.findOne({
                clientId,
                comment
            });
            if (userComment == null) {
                await this.userCommentRepo.insert({
                    clientId,
                    comment,
                    type: "like"
                });
                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        like: 1,
                    }
                });
                return {
                    data: "new",
                    status: 200
                };
            }
            else if (userComment.type == "dislike") {
                await this.userCommentRepo.updateOne({
                    _id: userComment._id
                }, {
                    $set: {
                        type: "like"
                    }
                });
                let updateQuery = {
                    like: 1,
                    dislike: -1
                };
                if (type == "like") {
                    updateQuery = {
                        like: 1,
                    };
                }
                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        like: 1,
                        dislike: -1
                    }
                });
                return {
                    data: type == "like" ? "new" : "change",
                    status: 200
                };
            }
            else {
                if (type == "like") {
                    await this.repository.updateOne({
                        _id: comment
                    }, {
                        $inc: {
                            like: -1
                        }
                    });
                    await this.userCommentRepo.findOneAndDelete({
                        _id: userComment._id
                    });
                    return {
                        data: "change",
                        status: 200
                    };
                }
                return {
                    data: "exists",
                    status: 200
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async dislikeComment(clientId, comment, language) {
        try {
            let languageConfig = await this.languageCommentRepo.findOne({
                language
            });
            let type = "like-dislike";
            if ((languageConfig === null || languageConfig === void 0 ? void 0 : languageConfig["like-type"]) == "like") {
                return {
                    status: 200,
                    data: "exists"
                };
            }
            let userComment = await this.userCommentRepo.findOne({
                clientId,
                comment
            });
            if (userComment == null) {
                await this.userCommentRepo.insert({
                    clientId,
                    comment,
                    type: "dislike"
                });
                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        dislike: 1,
                    }
                });
                return {
                    data: "new",
                    status: 200
                };
            }
            else if (userComment.type == "like") {
                await this.userCommentRepo.updateOne({
                    _id: userComment._id
                }, {
                    $set: {
                        type: "dislike"
                    }
                });
                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        dislike: 1,
                        like: -1
                    }
                });
                return {
                    data: "change",
                    status: 200
                };
            }
            else {
                return {
                    data: "exists",
                    status: 200
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getCommentConfig(language) {
        try {
            return {
                data: await this.languageCommentRepo.findOne({
                    language
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async reportComment(id) {
        try {
            let res = this.editById(id, {
                $set: {
                    reported: true,
                    status: "proccessing"
                }
            });
            let comment = await this.repository.findOne({
                _id: id,
                reply: {
                    $exists: true
                }
            });
            if (comment != null) {
                try {
                    await this.repository.findByIdAndUpdate(comment.reply, {
                        $inc: {
                            replies: -1
                        }
                    });
                }
                catch (error) {
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    async checkUserInfo(type, value) {
        try {
            let query = {};
            if (type == "phone") {
                query.phoneNumber = {
                    $eq: value
                };
            }
            else {
                query.email = value;
            }
            return {
                status: 200,
                data: await this.userRepo.isExists(query)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getCaptchaToken(language) {
        var _a;
        try {
            let lang = await this.languageRepo.findById(language);
            let domain;
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                domain = await this.domainRepo.findOne({
                    _id: lang.domain
                });
            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            if (domain == null) {
                return {
                    status: 400,
                    message: "دامنه ای معتبر وجود ندارد"
                };
            }
            return {
                data: (_a = domain.cptchaInfo) === null || _a === void 0 ? void 0 : _a.site_key
            };
        }
        catch (error) {
            throw error;
        }
    }
    async validatePhone(phone, session) {
        try {
            let userExists = await this.userRepo.isExists({
                phoneNumber: phone
            });
            if (userExists) {
                return {
                    status: 400,
                    message: "شماره تلفن وارد شده قبلا ثبت نام شده است"
                };
            }
            var random = random_1.default.randomNumber();
            try {
                var result = await smsMessager_1.default.send({
                    receptor: phone,
                    template: 'userCommentRegister',
                    parameters: {
                        random: random,
                    }
                });
                if (result == false) {
                    return {
                        status: 500,
                        message: "مشکلی در سرویس پیامکی رخ داده است"
                    };
                }
                session["random"] = random;
                session.phone = phone;
                session.cookie.expires = new Date(Date.now() + 120 * 1000);
                return {
                    status: 200,
                    message: "کد ورود با موفقیت برای شما ارسال شد",
                    session
                };
            }
            catch (error) {
                // throw error
                return {
                    status: 500,
                    message: "مشکلی در سرویس پیامکی رخ داده است"
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async checkRandomCode(random, session) {
        if (session["random"] != random || random == undefined) {
            return {
                status: 400,
                message: "کد وارد شده نامعتبر است"
            };
        }
        else {
            session["ok"] = true;
            session.cookie.expires = new Date(Date.now() + 600 * 1000);
            return {
                status: 200,
                session
            };
        }
    }
    async checkSubmitCaptch(info) {
        try {
            let lang = await this.languageRepo.findById(info.language);
            let domain;
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                domain = await this.domainRepo.findOne({
                    _id: lang.domain
                });
            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            if (domain == null || (domain === null || domain === void 0 ? void 0 : domain.cptchaInfo) == undefined) {
                return {
                    next: true
                };
            }
            const response = await axios_1.default.get(`https://www.google.com/recaptcha/api/siteverify?secret=${domain === null || domain === void 0 ? void 0 : domain.cptchaInfo.secret_key}&response=${info.googleToken}`);
            if (response.data.success) {
                return {
                    next: true
                };
                // return res.json({ success: true });
            }
            else {
                return {
                    status: 400
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
    async submitInfo(info, session) {
        console.log(info.autoSignup);
        // if (info.autoSignup) {
        //     try {
        //         let password = RandomGenarator.generateHashStr(8)
        //         await this.userRepo.insert({
        //             name: info.name,
        //             family: info.family,
        //             phoneNumber: info.phone,
        //             email: info.email,
        //             password
        //         } as any)
        //         await SmsMessager.send({
        //             receptor: info.phone,
        //             parameters: {
        //                 password
        //             },
        //             template: "userAdded"
        //         })
        //     } catch (error) {
        //     }
        // }
        let langInfo = await this.languageCommentRepo.findOne({
            language: info.language
        });
        if (langInfo != null) {
            if (langInfo["comment-submit-without-confirm"] != true) {
                return {
                    status: 403
                };
            }
            if (langInfo["validate-phone"] == true && session.ok != true) {
                return {
                    status: 403
                };
            }
            if (session.ok) {
                info.phone = session.phone;
                if (info.autoSignup == true
                    && langInfo["show-auto-signup"] == true) {
                    let password = random_1.default.generateHashStr(12);
                    await this.userRepo.insert({
                        name: info.name,
                        family: info.family,
                        email: info.email,
                        phoneNumber: info.phone,
                        password: password,
                    });
                }
            }
            let hash = random_1.default.generateHashStr(32);
            await this.commentFormRepo.insert({
                hash,
                info,
                submitted: session.ok == true
            });
            return {
                status: 200,
                data: {
                    hash
                }
            };
        }
    }
    async recover(hash) {
        try {
            return {
                status: 200,
                data: await this.commentFormRepo.findOne({ hash: hash })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async attachFile(file, files, language) {
        try {
            let lang = await this.languageCommentRepo.findOne({
                language
            });
            if (lang != null) {
                // if(captch)
                let savePath = lang["upload-path"];
                var conf = await this.cdnRepo.findById(savePath.fileManager);
                var cdn = new fileManager_1.default();
                await cdn.init(true);
                let dest = article_1.ArticleController.getUploadDestination(savePath.path, "y-m-d") + path_1.default.basename(file);
                let data = await cdn.upload(file, dest);
                return {
                    status: 200,
                    data
                };
            }
            return {
                status: 400
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
}
exports.CommentController = CommentController;
__decorate([
    (0, method_1.PreExec)({
        method: "post",
        route: ""
    }),
    __param(0, (0, parameters_1.User)({
        required: false
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "hash",
        schema: zod_1.z.string().optional()
    }))
], CommentController.prototype, "checkBlock", null);
__decorate([
    (0, method_1.Post)("", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string(),
            page: controller_1.default.id,
            module: zod_1.z.string().default("article"),
            language: controller_1.default.id,
            reply: controller_1.default.id.optional(),
            userReplied: controller_1.default.id.optional(),
            adminReplied: controller_1.default.id.optional(),
            userInfo: zod_1.z.any().default({}).optional(),
            hash: zod_1.z.string().optional(),
            userInfoReplied: zod_1.z.any().default({}).optional(),
            type: zod_1.z.enum(["question", "comment"]).default("comment"),
            atachment: zod_1.z.array(zod_1.z.string().url()).optional()
        })
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "commentInfo",
        schema: zod_1.z.object({
            browser: zod_1.z.string(),
            os: zod_1.z.string()
        }).optional()
    })),
    __param(2, (0, parameters_1.IP)()),
    __param(3, (0, parameters_1.User)({
        required: false
    }))
], CommentController.prototype, "create", null);
__decorate([
    (0, method_1.Post)("/notification/subscribe"),
    __param(0, (0, parameters_1.Header)("host")),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.any()
    })),
    __param(2, (0, parameters_1.User)({
        required: false
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "hash",
        schema: zod_1.z.string().optional(),
    }))
], CommentController.prototype, "subscribeNotification", null);
__decorate([
    (0, method_1.Get)("/domain/notification/config"),
    __param(0, (0, parameters_1.Header)("host"))
], CommentController.prototype, "getDomainNotificationPublicKey", null);
__decorate([
    (0, method_1.Get)("s"),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "pageId",
        schema: controller_1.default.id
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "sortOrder",
        schema: zod_1.z.enum(["latest", "oldest", "most-like", "most-replied"]).default("latest")
    })),
    __param(4, (0, parameters_1.Query)({
        destination: "type",
        schema: zod_1.z.enum(["question", "comment"]).optional()
    })),
    __param(5, (0, parameters_1.Query)({
        destination: "hash",
        schema: zod_1.z.string().optional(),
    })),
    __param(6, (0, parameters_1.User)({
        required: false
    }))
], CommentController.prototype, "paginateComments", null);
__decorate([
    (0, method_1.Get)("/replies"),
    __param(0, (0, parameters_1.Query)({
        destination: "comment",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "hash",
        schema: zod_1.z.string().optional(),
    })),
    __param(4, (0, parameters_1.User)({
        required: false
    }))
], CommentController.prototype, "getReplies", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "comment",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "getComment", null);
__decorate([
    (0, method_1.Post)("/like"),
    __param(0, (0, parameters_1.Query)({
        destination: "clientId",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "comment",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "likeComment", null);
__decorate([
    (0, method_1.Post)("/dislike"),
    __param(0, (0, parameters_1.Query)({
        destination: "clientId",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "comment",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "dislikeComment", null);
__decorate([
    (0, method_1.Get)("/config"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "getCommentConfig", null);
__decorate([
    (0, method_1.Post)("/report"),
    __param(0, (0, parameters_1.Query)({
        destination: "comment",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "reportComment", null);
__decorate([
    (0, method_1.Get)("/info/check"),
    __param(0, (0, parameters_1.Query)({
        destination: "type",
        schema: zod_1.z.enum(["phone", "email"])
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "value",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "checkUserInfo", null);
__decorate([
    (0, method_1.Get)("/captcha/google"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "getCaptchaToken", null);
__decorate([
    (0, method_1.Post)("/phone/validate"),
    __param(0, (0, parameters_1.Body)({
        destination: "phone",
        schema: controller_1.default.phone
    })),
    __param(1, (0, parameters_1.Session)())
], CommentController.prototype, "validatePhone", null);
__decorate([
    (0, method_1.Post)("/phone/validate/random"),
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Session)())
], CommentController.prototype, "checkRandomCode", null);
__decorate([
    (0, method_1.PreExec)({
        method: "post",
        route: "/info/submit"
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            language: controller_1.default.id,
            googleToken: zod_1.z.string().optional()
        })
    }))
], CommentController.prototype, "checkSubmitCaptch", null);
__decorate([
    (0, method_1.Post)("/info/submit"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            name: zod_1.z.string(),
            family: zod_1.z.string(),
            email: controller_1.default.email.optional(),
            phone: controller_1.default.phone,
            language: controller_1.default.id,
            autoSignup: zod_1.z.boolean().default(false),
        })
    })),
    __param(1, (0, parameters_1.Session)())
], CommentController.prototype, "submitInfo", null);
__decorate([
    (0, method_1.Get)("/info/recover"),
    __param(0, (0, parameters_1.Query)({
        destination: "hash",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "recover", null);
__decorate([
    (0, method_1.Post)("/attach"),
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 5,
            // size : 5000000
        },
        mapToBody: true,
        destination: "file",
        // isArray: true,
        schema: zod_1.z.any().optional(),
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "attachFile", null);
// const comment = new CommentController("/comment", new CommentRepository())
// export default comment
