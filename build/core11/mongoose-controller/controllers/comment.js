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
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/comment/repository"));
const parameters_1 = require("../../decorators/parameters");
const repository_2 = __importDefault(require("../repositories/article/repository"));
const model_1 = require("../repositories/article/model");
const repository_3 = __importDefault(require("../repositories/commentNote/repository"));
const repository_4 = __importDefault(require("../repositories/content/repository"));
const repository_5 = __importDefault(require("../repositories/commentBlock/repository"));
const reopository_1 = __importDefault(require("../repositories/commentForm/reopository"));
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const repository_6 = __importDefault(require("../repositories/linkTag/repository"));
const repository_7 = __importDefault(require("../repositories/notificationTokens/repository"));
const notification_1 = __importDefault(require("../../messaging/notification"));
let ejs = require("ejs");
const sortMap = {
    "oldest": {
        _id: 1
    },
    "newest": {
        _id: -1
    },
    "hotest": {
        replies: -1
    }
};
var subscriptions = [];
class CommentController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.modules = options.modules;
        this.commentNoteRepo = new repository_3.default();
        this.contentRepo = new repository_4.default();
        this.commentBlockRepo = new repository_5.default();
        this.commentFormRepo = new reopository_1.default();
        this.linktagRepo = new repository_6.default();
        this.notificationTokenRepo = new repository_7.default();
    }
    initApis() {
        super.initApis();
    }
    async create(data, sendMessage, admin) {
        data.admin = admin._id;
        let reply = data.reply;
        data.status = "confirmed";
        let res = await super.create(data);
        if (reply != undefined) {
            let replyDoc = await this.repository.findOneAndUpdate({
                _id: reply
            }, {
                $inc: {
                    replies: 1
                },
                $set: {
                    adminReply: true
                }
            });
            await this.repository.updateOne({
                _id: res.data["_id"]
            }, {
                $set: {
                    level: ((replyDoc === null || replyDoc === void 0 ? void 0 : replyDoc.level) || 1) + 1
                }
            });
            if (sendMessage == true) {
                try {
                    this.sendNotification(res.data);
                    this.sendSMS(res.data);
                }
                catch (error) {
                }
            }
        }
        return res;
    }
    async sendSMS(comment) {
        var _a, _b;
        try {
            let phone;
            if (comment.userReplied) {
                let user = await ((_a = this.userRepository) === null || _a === void 0 ? void 0 : _a.findById(comment.userReplied));
                if (user != null) {
                    phone = user.phoneNumber;
                }
            }
            else if (comment.userInfoReplied) {
                phone = comment.userInfoReplied["phone"];
            }
            else {
                return;
            }
            let p;
            let contentId;
            if ((comment === null || comment === void 0 ? void 0 : comment.page) != null) {
                let language = comment.language;
                let lang = await this.contentRepo.languageRepo.findById(language);
                if ((lang === null || lang === void 0 ? void 0 : lang.domain) != undefined) {
                    let domain = await this.contentRepo.domainRepo.findById(lang === null || lang === void 0 ? void 0 : lang.domain);
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    });
                    p = ((domain === null || domain === void 0 ? void 0 : domain.sslType) != "none" ? "https://" : "http://") + (domain === null || domain === void 0 ? void 0 : domain.domain);
                    contentId = content === null || content === void 0 ? void 0 : content._id;
                }
                else {
                    let domain = await this.contentRepo.domainRepo.findOne({
                        isDefault: true
                    });
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    });
                    p = ((domain === null || domain === void 0 ? void 0 : domain.sslType) != "none" ? "https://" : "http://") + (domain === null || domain === void 0 ? void 0 : domain.domain);
                    contentId = content === null || content === void 0 ? void 0 : content._id;
                }
            }
            if (contentId) {
                let link = await ((_b = this.linktagRepo) === null || _b === void 0 ? void 0 : _b.findOne({
                    link: contentId
                }));
                if (link != null) {
                    let url = p + link.tag + `?comment=${comment._id}`;
                    await smsMessager_1.default.send({
                        receptor: phone,
                        template: "commentReply",
                        parameters: {
                            url
                        }
                    });
                }
            }
        }
        catch (error) {
        }
    }
    async sendNotification(comment) {
        var _a, _b;
        try {
            let tokens;
            if (comment.userReplied) {
                let user = await ((_a = this.userRepository) === null || _a === void 0 ? void 0 : _a.findById(comment.userReplied));
                if (user != null) {
                    tokens = user.notificationTokens;
                }
            }
            else if (comment.userInfoReplied) {
                let commentform = await this.commentFormRepo.findOne({
                    "info.phone": comment.userInfoReplied["phone"]
                });
                if (commentform != null) {
                    tokens = commentform.notificationTokens;
                }
            }
            else {
                return;
            }
            let p;
            let contentId;
            if ((comment === null || comment === void 0 ? void 0 : comment.page) != null) {
                let language = comment.language;
                let lang = await this.contentRepo.languageRepo.findById(language);
                if ((lang === null || lang === void 0 ? void 0 : lang.domain) != undefined) {
                    let domain = await this.contentRepo.domainRepo.findById(lang === null || lang === void 0 ? void 0 : lang.domain);
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    });
                    p = ((domain === null || domain === void 0 ? void 0 : domain.sslType) != "none" ? "https://" : "http://") + (domain === null || domain === void 0 ? void 0 : domain.domain);
                    contentId = content === null || content === void 0 ? void 0 : content._id;
                }
                else {
                    let domain = await this.contentRepo.domainRepo.findOne({
                        isDefault: true
                    });
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    });
                    p = ((domain === null || domain === void 0 ? void 0 : domain.sslType) != "none" ? "https://" : "http://") + (domain === null || domain === void 0 ? void 0 : domain.domain);
                    contentId = content === null || content === void 0 ? void 0 : content._id;
                }
            }
            if (contentId) {
                let link = await ((_b = this.linktagRepo) === null || _b === void 0 ? void 0 : _b.findOne({
                    link: contentId
                }));
                if (link != null) {
                    let url = p + link.tag + `?comment=${comment._id}&replyto=${comment.reply}`;
                    await notification_1.default.send({
                        receptor: tokens,
                        template: "commentReply",
                        parameters: {
                            url
                        },
                        language: comment.language,
                        url
                    });
                }
            }
        }
        catch (error) {
        }
    }
    async confirmComment(id) {
        try {
            let comment = await this.repository.findById(id);
            let res = await this.editById(id, {
                $set: {
                    status: "confirmed"
                }
            });
            if ((comment === null || comment === void 0 ? void 0 : comment.status) != "confirmed" && (comment === null || comment === void 0 ? void 0 : comment.reply)) {
                try {
                    let replyDoc = await this.repository.findOneAndUpdate({
                        _id: comment.reply
                    }, {
                        $inc: {
                            replies: 1
                        }
                    });
                    await this.repository.updateOne({
                        _id: id
                    }, {
                        $set: {
                            level: ((replyDoc === null || replyDoc === void 0 ? void 0 : replyDoc.level) || 1) + 1
                        }
                    });
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
    async reject(id) {
        try {
            let comment = await this.repository.findById(id);
            let res = await this.editById(id, {
                $set: {
                    status: "rejected"
                }
            });
            if ((comment === null || comment === void 0 ? void 0 : comment.status) == "confirmed" && (comment === null || comment === void 0 ? void 0 : comment.reply)) {
                try {
                    await this.repository.updateOne({
                        _id: comment.reply
                    }, {
                        $inc: {
                            replies: -1
                        }
                    });
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
    async recurciveDeleteComment(commentId) {
        try {
            let comments = await this.repository.findAll({
                reply: commentId
            });
            for (let i = 0; i < comments.length; i++) {
                // const element = array[i];
                await this.recurciveDeleteComment(comments[i]._id);
                await this.repository.deleteById(comments[i]._id);
            }
        }
        catch (error) {
        }
    }
    async delete(id, ...params) {
        // console.log("delete",id)
        try {
            let comment = await this.repository.findById(id);
            let res = await this.repository.deleteById(id);
            if ((comment === null || comment === void 0 ? void 0 : comment.status) == "confirmed") {
                if (comment === null || comment === void 0 ? void 0 : comment.reply) {
                    await this.repository.updateOne({
                        _id: comment.reply
                    }, {
                        $inc: {
                            replies: -1
                        }
                    });
                }
            }
            this.recurciveDeleteComment(id);
            return {
                status: 200,
                data: res
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getPush() {
        console.log("push");
        return new Promise((resolve, reject) => {
            ejs.renderFile("build/templates/push.ejs", {}, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    status: 200,
                    data,
                    html: true
                });
            });
        });
    }
    async subscribeWebPush(body) {
        console.log("subscription", body);
        const subscription = body;
        subscriptions.push(subscription);
        return {
            status: 200
        };
    }
    // @Post("/push/send")
    // async sendNotification(): Promise<Response> {
    //     console.log("send" )
    //     const notificationPayload = {
    //         title: 'New Notification',
    //         message: 'This is a custom notification!'
    //     };
    //     const promises = subscriptions.map((sub: any) => {
    //         console.log("sub", sub)
    //         return webpush.sendNotification(sub, JSON.stringify(notificationPayload))
    //             .catch(err => console.error('Error sending notification', err));
    //     });
    //     await Promise.all(promises)
    //     return {
    //         status: 200
    //     }
    // }
    async getNotes(phone) {
        try {
            let commentNote = await this.commentNoteRepo.findOne({
                user: phone
            }, {}, [{
                    path: "notes.admin",
                    select: ["name", "familyName", "phoneNumber", "email", "profile"]
                }]);
            return {
                status: 200,
                data: (commentNote === null || commentNote === void 0 ? void 0 : commentNote.notes) || []
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteNote(phone, noteID) {
        try {
            await this.commentNoteRepo.findOneAndUpdate({
                user: phone
            }, {
                $pull: {
                    notes: {
                        _id: noteID
                    }
                }
            });
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addNote(phone, text, adminInfo) {
        try {
            try {
                let commentNote = await this.commentNoteRepo.findOne({
                    user: phone
                });
                if (commentNote == null) {
                    await this.commentNoteRepo.insert({
                        user: phone,
                        notes: [{
                                text,
                                admin: adminInfo._id
                            }]
                    });
                    return {
                        status: 200,
                    };
                }
                else {
                    await this.commentNoteRepo.findByIdAndUpdate(commentNote._id, {
                        $push: {
                            notes: {
                                text,
                                admin: adminInfo._id
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
        catch (error) {
            throw error;
        }
    }
    async update(id, data) {
        try {
            let extComment = await this.repository.findById(id);
            let r = await this.editById(id, {
                $set: data
            });
            let comment = await this.repository.findById(id);
            if (comment === null || comment === void 0 ? void 0 : comment.reply) {
                if ((extComment === null || extComment === void 0 ? void 0 : extComment.status) == "confirmed"
                    && (comment === null || comment === void 0 ? void 0 : comment.status) != "confirmed") {
                }
                if ((extComment === null || extComment === void 0 ? void 0 : extComment.status) != "confirmed"
                    && (comment === null || comment === void 0 ? void 0 : comment.status) == "confirmed") {
                }
            }
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    async searchComments() {
        try {
            return {};
        }
        catch (error) {
            throw error;
        }
    }
    async filter(page, limit, sortKey, moduleName, moduleQuery, filters) {
        try {
            let sort = sortMap[sortKey];
            let query = {};
            let pageIDs;
            if (Object.keys(moduleQuery).length != 0 && moduleName != undefined) {
                let selectedModule = this.modules.find((x, index) => {
                    if (x.name == moduleName) {
                        return x;
                    }
                });
                if (selectedModule != undefined) {
                    pageIDs = [];
                    let q = this.moduleSearchHelper(moduleQuery, selectedModule.filters);
                    let pages = await selectedModule.repo.findAll(q, {
                        projection: {
                            _id: 1
                        }
                    });
                    for (let i = 0; i < pages.length; i++) {
                        pageIDs.push(pages[i]._id);
                    }
                    query['page'] = {
                        $in: pageIDs
                    };
                }
            }
            let q = await this.searchHelper(filters);
            query = Object.assign(query, q);
            return this.paginate(page, limit, query, {
                population: [{
                        path: "user",
                        select: ["name", "family", "email", "profile"]
                    },
                    {
                        path: "admin",
                        select: ["name", "familyName", "phoneNumber", "email", "profile"]
                    },
                    {
                        path: "page",
                        select: ["content", "summary"]
                    },
                ],
                sort
            });
        }
        catch (error) {
            throw error;
        }
    }
    getModuleFilters(moduleName) {
        let selectedModule = this.modules.find((x, index) => {
            if (x.name == moduleName) {
                return x;
            }
        });
        return {
            data: selectedModule === null || selectedModule === void 0 ? void 0 : selectedModule.filters,
            status: 200
        };
    }
    async test() {
        let comments = await this.repository.findAll({
            reply: {
                $exists: true
            }
        });
        for (let i = 0; i < comments.length; i++) {
            let exists = await this.repository.isExists({
                reply: comments[i]._id
            });
            if (exists) {
                console.log(comments[i]._id);
            }
        }
    }
    async getCommentFullTree(commentId) {
        try {
            let commentTree = await this.getRootComment(commentId);
            let commentTreeObject = await this.repository.findOne({
                _id: commentTree
            }, {}, [
                {
                    path: "user",
                    select: ["name", "family", "email", "profile"]
                },
                {
                    path: "admin",
                    select: ["name", "familyName", "phoneNumber", "email", "profile"]
                }
            ]);
            let tree = await this.makeTree(commentTreeObject);
            let comment = await this.repository.findOne({
                _id: commentId
            }, {}, [{
                    path: "page",
                    select: ["content", "summary", "url", "language", "title", "commentImportant"]
                }]);
            let parent;
            if (comment === null || comment === void 0 ? void 0 : comment.reply) {
                parent = await this.repository.findOne({
                    _id: commentId
                });
            }
            let page;
            let commentInfo = comment === null || comment === void 0 ? void 0 : comment.commentInfo;
            if ((comment === null || comment === void 0 ? void 0 : comment.page) != null) {
                page = JSON.parse(JSON.stringify(comment.page));
                let language = comment.language;
                let lang = await this.contentRepo.languageRepo.findById(language);
                if ((lang === null || lang === void 0 ? void 0 : lang.domain) != undefined) {
                    let domain = await this.contentRepo.domainRepo.findById(lang === null || lang === void 0 ? void 0 : lang.domain);
                    let content = await this.contentRepo.findOne({
                        id: page._id
                    });
                    let p = (domain === null || domain === void 0 ? void 0 : domain.sslType) != "none" ? "https://" : "http://";
                    page.url = p + (content === null || content === void 0 ? void 0 : content.url);
                }
                else {
                    let domain = await this.contentRepo.domainRepo.findOne({
                        isDefault: true
                    });
                    let content = await this.contentRepo.findOne({
                        id: page._id
                    });
                    let p = (domain === null || domain === void 0 ? void 0 : domain.sslType) != "none" ? "https://" : "http://";
                    page.url = p + (domain === null || domain === void 0 ? void 0 : domain.domain) + (content === null || content === void 0 ? void 0 : content.url);
                }
            }
            return {
                data: {
                    tree,
                    page,
                    commentInfo
                }
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async searchUser(type, term) {
        var _a;
        let query = {};
        if (type == "guest") {
            let qs = term.split(" ");
            if (qs.length > 1) {
                query['$and'] = [
                    {
                        "info.name": {
                            $regex: qs[0]
                        }
                    },
                    {
                        "info.family": {
                            $regex: qs[1]
                        }
                    }
                ];
            }
            else {
                query['$or'] = [
                    {
                        "info.name": {
                            $regex: term
                        }
                    },
                    {
                        "info.family": {
                            $regex: term
                        }
                    }
                ];
            }
            let users = await this.commentFormRepo.paginate(query, 10, 1);
            return {
                data: users,
                status: 200
            };
        }
        else {
            let qs = term.split(" ");
            if (qs.length > 1) {
                query['$and'] = [
                    {
                        "name": {
                            $regex: qs[0]
                        }
                    },
                    {
                        "family": {
                            $regex: qs[1]
                        }
                    }
                ];
            }
            else {
                query['$or'] = [
                    {
                        "name": {
                            $regex: term
                        }
                    },
                    {
                        "family": {
                            $regex: term
                        }
                    }
                ];
            }
            let users = await ((_a = this.userRepository) === null || _a === void 0 ? void 0 : _a.paginate(query, 10, 1));
            return {
                data: users,
                status: 200
            };
        }
    }
    async searchAdmin(term) {
        var _a;
        try {
            let query = {};
            let qs = term.split(" ");
            if (qs.length > 1) {
                query['$and'] = [
                    {
                        "name": {
                            $regex: qs[0]
                        }
                    },
                    {
                        "familyName": {
                            $regex: qs[1]
                        }
                    }
                ];
            }
            else {
                query['$or'] = [
                    {
                        "name": {
                            $regex: term
                        }
                    },
                    {
                        "familyName": {
                            $regex: term
                        }
                    }
                ];
            }
            let admins = await ((_a = this.adminRepo) === null || _a === void 0 ? void 0 : _a.paginate(query, 10, 1, {
                projection: {
                    name: 1,
                    familyName: 1,
                }
            }));
            return {
                data: admins,
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getRootComment(commentId) {
        let comment = await this.repository.findById(commentId);
        if (comment === null || comment === void 0 ? void 0 : comment.reply) {
            return await this.getRootComment(comment.reply);
        }
        return commentId;
    }
    async makeTree(comment) {
        comment = JSON.parse(JSON.stringify(comment));
        let children = [];
        let replies = await this.repository.findAll({
            reply: comment._id
        }, {}, [
            {
                path: "user",
                select: ["name", "family", "email", "profile"]
            },
            {
                path: "admin",
                select: ["name", "familyName", "phoneNumber", "email", "profile"]
            }
        ]);
        for (let i = 0; i < replies.length; i++) {
            let r = await this.makeTree(replies[i]);
            r.parent = comment._id;
            children.push(r);
        }
        comment["children"] = children;
        return comment;
    }
    getSearchList() {
        return super.getSearchList();
    }
    async getCommentCount(moduleQuery, moduleName, filters) {
        let query = {};
        let pageIDs;
        if (moduleName != undefined) {
            let selectedModule = this.modules.find((x, index) => {
                if (x.name == moduleName) {
                    return x;
                }
            });
            if (selectedModule != undefined) {
                pageIDs = [];
                let q = this.moduleSearchHelper(moduleQuery, selectedModule.filters);
                let pages = await selectedModule.repo.findAll(q, {
                    projection: {
                        _id: 1
                    }
                });
                for (let i = 0; i < pages.length; i++) {
                    pageIDs.push(pages[i]._id);
                }
                query['page'] = {
                    $in: pageIDs
                };
            }
        }
        let q = await this.searchHelper(filters);
        query = Object.assign(query, q);
        let result = await this.repository.collection.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: {
                        status: "$status",
                        type: "$type"
                    },
                    count: {
                        $sum: 1
                    }
                }
            }
        ]);
        let statuses = ["confirmed", "rejected", "proccessing"];
        let comments = 0;
        let questions = 0;
        let all = 0;
        let finalResult = [];
        for (let i = 0; i < statuses.length; i++) {
            let count = 0;
            for (let j = 0; j < result.length; j++) {
                if (statuses[i] == result[j]["_id"].status) {
                    all += result[j].count;
                    count += result[j].count;
                    if (result[j]["_id"].type == "comment") {
                        comments += result[j].count;
                    }
                    else {
                        questions += result[j].count;
                    }
                    // break
                }
            }
            finalResult.push({
                _id: statuses[i],
                count
            });
        }
        finalResult.push({
            _id: "all",
            count: all
        });
        finalResult.push({
            _id: "questions",
            count: questions
        });
        finalResult.push({
            _id: "comments",
            count: comments
        });
        return {
            status: 200,
            data: finalResult
        };
    }
    async like() {
    }
    async dislike() {
    }
    async blockUser(phone, blockType, duration, durationType) {
        try {
            let expire;
            if (durationType != undefined) {
                if (durationType == "hour") {
                    expire = new Date(Date.now() + (3600000 * (duration || 1)));
                }
                else {
                    expire = new Date(Date.now() + (86400000 * (duration || 1)));
                }
            }
            let block = await this.commentBlockRepo.findOne({
                phone: {
                    $eq: phone
                }
            });
            if (block == null) {
                await this.commentBlockRepo.insert({
                    phone,
                    blockType,
                    duration,
                    durationType,
                    expire
                });
            }
            else {
                await this.commentBlockRepo.updateOne({
                    _id: block._id
                }, {
                    $set: {
                        blockType,
                        duration,
                        durationType,
                        enabled: true,
                        expire
                    }
                });
            }
            return {
                status: 200,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkUserBlock(phone) {
        try {
            let block = await this.commentBlockRepo.findOne({
                phone
            });
            if (block == null || block.enabled == false) {
                return {
                    data: {
                        isBlock: false
                    }
                };
            }
            if (block.blockType == "permanent"
                || block.expire > new Date()) {
                return {
                    data: {
                        isBlock: true,
                        expire: block.expire
                    }
                };
            }
            return {
                data: {
                    isBlock: false
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async unBlock(phone) {
        try {
            let data = await this.commentBlockRepo.updateOne({
                phone: {
                    $eq: phone
                }
            }, {
                $set: {
                    enabled: false
                }
            });
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async searchHelper(queryParam) {
        // console.log(queryParam)
        let query = {};
        if (queryParam == undefined) {
            return query;
        }
        if (queryParam["userType$eq"]) {
            if (queryParam["userType$eq"] == "user") {
                query["user"] = {
                    $exists: true
                };
            }
            else {
                query["userInfo"] = {
                    $exists: true
                };
            }
            delete queryParam["userType$eq"];
        }
        let q = await super.searchHelper(queryParam);
        return Object.assign(q, query);
    }
    moduleSearchHelper(queryParam, moduleFilters) {
        var query = {};
        for (const key in moduleFilters) {
            var ands = [];
            for (let i = 0; i < moduleFilters[key].length; i++) {
                if (queryParam[key + "$" + moduleFilters[key][i]]) {
                    if (moduleFilters[key][i] == "lte") {
                        var condition = {};
                        condition[key] = {
                            "$lte": queryParam[key + "$" + moduleFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (moduleFilters[key][i] == "gte") {
                        var condition = {};
                        condition[key] = {
                            "$gte": queryParam[key + "$" + moduleFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (moduleFilters[key][i] == "eq") {
                        var condition = {};
                        condition[key] = {
                            "$eq": queryParam[key + "$" + moduleFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (moduleFilters[key][i] == "list") {
                        var condition = {};
                        condition[key] = {
                            "$in": queryParam[key + "$" + moduleFilters[key][i]]
                        };
                        ands.push(condition);
                    }
                    else if (moduleFilters[key][i] == "reg") {
                        var condition = {};
                        condition[key] = {
                            "$regex": new RegExp(queryParam[key + "$" + moduleFilters[key][i]])
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
}
exports.CommentController = CommentController;
__decorate([
    __param(1, (0, parameters_1.Body)({
        destination: "sendMessage",
        schema: zod_1.z.boolean().default(false)
    })),
    __param(2, (0, parameters_1.Admin)())
], CommentController.prototype, "create", null);
__decorate([
    (0, method_1.Post)("/confirm"),
    __param(0, (0, parameters_1.Body)({
        destination: "comment",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "confirmComment", null);
__decorate([
    (0, method_1.Post)("/reject"),
    __param(0, (0, parameters_1.Body)({
        destination: "comment",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "reject", null);
__decorate([
    (0, method_1.Get)("/push")
], CommentController.prototype, "getPush", null);
__decorate([
    (0, method_1.Post)("/push/subscribe"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.any()
    }))
], CommentController.prototype, "subscribeWebPush", null);
__decorate([
    (0, method_1.Get)("/notes"),
    __param(0, (0, parameters_1.Query)({
        destination: "phone",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "getNotes", null);
__decorate([
    (0, method_1.Post)("/note/delete"),
    __param(0, (0, parameters_1.Body)({
        destination: "phone",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "noteID",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "deleteNote", null);
__decorate([
    (0, method_1.Post)("/note"),
    __param(0, (0, parameters_1.Body)({
        destination: "phone",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "text",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Admin)())
], CommentController.prototype, "addNote", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            status: zod_1.z.enum(["confirmed", "rejected", "proccessing"]).optional(),
            text: zod_1.z.string().optional(),
            type: zod_1.z.enum(["question", "comment"]).optional()
        })
    }))
], CommentController.prototype, "update", null);
__decorate([
    (0, method_1.Get)("/serach")
], CommentController.prototype, "searchComments", null);
__decorate([
    (0, method_1.Post)("/filter"),
    __param(0, (0, parameters_1.Body)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "sort",
        schema: zod_1.z.enum(["oldest", "newest", "hotest"]).default("newest")
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "module",
        schema: zod_1.z.string().default("article")
    })),
    __param(4, (0, parameters_1.Body)({
        destination: "moduleQuery",
        schema: controller_1.default.search.optional()
    })),
    __param(5, (0, parameters_1.Body)({
        destination: "filters",
        schema: controller_1.default.search.optional()
    }))
], CommentController.prototype, "filter", null);
__decorate([
    (0, method_1.Get)("/module/filters"),
    __param(0, (0, parameters_1.Query)({
        destination: "module",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "getModuleFilters", null);
__decorate([
    (0, method_1.Get)("/tree"),
    __param(0, (0, parameters_1.Query)({
        destination: "comment",
        schema: controller_1.default.id
    }))
], CommentController.prototype, "getCommentFullTree", null);
__decorate([
    (0, method_1.Get)("/user/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "type",
        schema: zod_1.z.enum(["guest", "user"])
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "term",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "searchUser", null);
__decorate([
    (0, method_1.Get)("/admin/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "term",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "searchAdmin", null);
__decorate([
    (0, method_1.Get)("/search/list")
], CommentController.prototype, "getSearchList", null);
__decorate([
    (0, method_1.Post)("/counts"),
    __param(0, (0, parameters_1.Body)({
        destination: "moduleQuery",
        schema: controller_1.default.search.optional()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "module",
        schema: zod_1.z.string().optional()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "filters",
        schema: controller_1.default.search.optional()
    }))
], CommentController.prototype, "getCommentCount", null);
__decorate([
    (0, method_1.Post)("/like")
], CommentController.prototype, "like", null);
__decorate([
    (0, method_1.Post)("/dislike")
], CommentController.prototype, "dislike", null);
__decorate([
    (0, method_1.Post)("/block"),
    __param(0, (0, parameters_1.Body)({
        destination: "phone",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "type",
        schema: zod_1.z.enum(["temporary", "permanent"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "duration",
        schema: zod_1.z.coerce.number().int().positive().optional()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "durationType",
        schema: zod_1.z.enum(["hour", "day"]).optional()
    }))
], CommentController.prototype, "blockUser", null);
__decorate([
    (0, method_1.Get)("/block/check"),
    __param(0, (0, parameters_1.Query)({
        destination: "phone",
        schema: controller_1.default.phone
    }))
], CommentController.prototype, "checkUserBlock", null);
__decorate([
    (0, method_1.Post)("/unblock"),
    __param(0, (0, parameters_1.Body)({
        destination: "phone",
        schema: zod_1.z.string()
    }))
], CommentController.prototype, "unBlock", null);
const comment = new CommentController("/comment", new repository_1.default(), {
    modules: [{
            name: "article",
            filters: {
                _id: ["eq"],
                category: ["eq", "list"],
                title: ["reg"],
                type: ["list", "eq"],
                viewMode: ["list", "eq"],
                language: ["eq"],
                commentImportant: ["eq"],
                author: ["eq", "list"],
                publisher: ["eq"]
            },
            repo: new repository_2.default({
                model: model_1.ArticleModel,
                typeName: "article",
                selectData: {
                    type: 1,
                    title: 1,
                    mainImage: 1,
                    author: 1,
                    category: 1,
                    publishDate: 1,
                    insertDate: 1
                },
                sort: {
                    "publishDate": {
                        show: "زمان انتشار"
                    },
                    "insertDate": {
                        show: "زمان انتشار"
                    },
                    "view": {
                        show: "بازدید"
                    }
                },
            }),
            showName: "مقاله",
        }],
    // userRepository : new UserRepository<BaseUser>({
    //     model: UserModel,
    //     // salt: "111244"
    // }),
    searchFilters: {
        create: ["gte", "lte"],
        atachment: ["eq"],
        status: ["eq", "list"],
        userType: ["eq"],
        language: ["eq"],
        type: ["eq", "list"],
        text: ["eq", "reg"],
        user: ["eq", "list"],
        admin: ["eq", "list"],
        "userInfo.phone": ["eq", "list"]
    },
    insertSchema: zod_1.z.object({
        text: zod_1.z.string(),
        page: controller_1.default.id,
        module: zod_1.z.string().default("article"),
        language: controller_1.default.id,
        reply: controller_1.default.id.optional(),
        userReplied: controller_1.default.id.optional(),
        adminReplied: controller_1.default.id.optional(),
        userInfoReplied: zod_1.z.any().default({}).optional()
    })
});
exports.default = comment;
