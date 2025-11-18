import { Response } from "../../../controller";
import BaseController, { ControllerOptions } from "../../controller";
import Comment from "../../repositories/comment/model";
import CommentRepository from "../../repositories/comment/repository";

import { z } from "zod"
import { Get, Post, PreExec } from "../../../decorators/method";
import { Body, Files, Header, IP, Query, Session, User } from "../../../decorators/parameters";
import { UserInfo } from "../../auth/user/userAuthenticator";
import LanguageCommentRepository from "../../repositories/languageComment/repository";
import UserCommentRepository from "../../repositories/userComment/repository";
import CDN_Manager from "../../../services/fileManager";
import { ArticleController } from "../article";
import FileManagerConfigRepository from "../../repositories/fileManagerConfig/repository";
import path from "path";
import BaseUser from "../../repositories/user/model";
import UserRepository from "../../repositories/user/repository";
import { FilterQuery, Model } from "mongoose";
import RandomGenarator from "../../../random";
import SmsMessager from "../../../messaging/smsMessager";
import CommentFormRepository from "../../repositories/commentForm/reopository";
import LanguageRepository from "../../repositories/language/repository";
import DomainRepository from "../../repositories/domain/repository";
import axios from "axios";
import { QueryInfo } from "../../repository";
import geoip from "geoip-lite"
import CommentBlockRepository from "../../repositories/commentBlock/repository";
import { Route } from "../../../application";
import NotificationTokenRepository from "../../repositories/notificationTokens/repository";
import FakeCommentRepository from "../../repositories/fakeComment/repository";

export class CommentController extends BaseController<Comment> {
    languageCommentRepo: LanguageCommentRepository
    userCommentRepo: UserCommentRepository
    cdnRepo: FileManagerConfigRepository
    userRepo: UserRepository<BaseUser>
    commentFormRepo: CommentFormRepository
    languageRepo: LanguageRepository
    domainRepo: DomainRepository
    commentBlockRepo: CommentBlockRepository
    notificationTokenRepo: NotificationTokenRepository
    fakeCommentRepo : FakeCommentRepository

    constructor(baseRoute: string, repo: CommentRepository, userModel: Model<BaseUser>, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.languageCommentRepo = new LanguageCommentRepository()
        this.userCommentRepo = new UserCommentRepository()
        this.cdnRepo = new FileManagerConfigRepository()
        this.userRepo = new UserRepository({
            model: userModel
        })
        this.commentFormRepo = new CommentFormRepository()
        this.languageRepo = new LanguageRepository()
        this.domainRepo = new DomainRepository()
        this.commentBlockRepo = new CommentBlockRepository()
        this.notificationTokenRepo = new NotificationTokenRepository()
        this.fakeCommentRepo = new FakeCommentRepository()
    }


    serve(): Route[] {
        var middlewares: any = Reflect.getMetadata("middlewares" + this.constructor.name, this) || {}
        var logRoutes: any = Reflect.getMetadata("logRoutes" + this.constructor.name, this) || {}
        this.routes.forEach(element => {
            var name = element.execs.name.replace("bound ", "")
            // console.log(name)
            if (middlewares[name]) {
                if (!element.middlewares) {
                    element.middlewares = []
                }
                element.middlewares.push(...middlewares[name])
            }

            element.log = logRoutes[name]

            var confs = Reflect.getMetadata(name + this.constructor.name, this)

            // console.log(name)
            element.meta = confs
            if (element.preExecs) {
                for (let i = 0; i < element.preExecs.length; i++) {
                    if (!element.preExecs[i].meta) {
                        var name = element.preExecs[i].func.name.replace("bound ", "")
                        var confs = Reflect.getMetadata(name + this.constructor.name, this)
                        element.preExecs[i].meta = confs
                    }
                }
            }
            if (this.apiDoc) {
                element.apiDoc = Object.assign(this.apiDoc, element.apiDoc)
            }
            return element
        });
        // return this.routes
        return super.serve()
    }

    initApis(): void {
        this.sync()
    }

    async sync() {
        let comments = await this.repository.findAll({})
        for (let i = 0; i < comments.length; i++) {
            try {
                let c = await this.repository.getcount({
                    reply: comments[i]._id,
                    status: "confirmed"
                })
                await this.repository.updateOne({
                    _id: comments[i]._id
                }, {
                    $set: {
                        replies: c
                    }
                })
            } catch (error) {

            }
        }
    }

    @PreExec({
        method: "post",
        route: ""
    })
    async checkBlock(
        @User({
            required: false
        }) user: UserInfo,
        @Body({
            destination: "hash",
            schema: z.string().optional()
        }) hash: string
    ): Promise<Response> {
        try {
            console.log(user , hash)

            let phone
            if (user == undefined) {
                if (hash == undefined) {
                    return {
                        status: 403
                    }
                }
                let commentForm = await this.commentFormRepo.findOne({
                    hash
                })
                if (commentForm == null) {
                    return {
                        status: 403
                    }
                }
                phone = commentForm.info?.phone
            }
            else {
                phone = user.phoneNumber
            }

            let block = await this.commentBlockRepo.findOne({
                phone
            })

            if (block == null || block.enabled == false) {
                return {
                    next: true
                }
            }

            if (block.blockType == "permanent"
                || block.expire! > new Date()
            ) {
                return {
                    status: 403,
                    data: block
                }
            }

            return {
                next: true
            }
        } catch (error) {
            throw error
        }
    }



    @Post("", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async create(@Body({
        schema: z.object({
            text: z.string(),
            page: BaseController.id,
            module: z.string().default("article"),
            language: BaseController.id,
            reply: BaseController.id.optional(),
            userReplied: BaseController.id.optional(),
            adminReplied: BaseController.id.optional(),
            userInfo: z.any().default({}).optional(),
            hash: z.string().optional(),
            userInfoReplied: z.any().default({}).optional(),
            type: z.enum(["question", "comment"]).default("comment"),
            atachment: z.array(z.string().url()).optional()
        })
    }) data: any,
        @Body({
            destination: "commentInfo",
            schema: z.object({
                browser: z.string(),
                os: z.string()
            }).optional()
        }) commentInfo: any,
        @IP() ip: string,
        @User({
            required: false
        }) user: UserInfo
    ): Promise<Response> {
        if (user != undefined) {
            data.user = user.id
        }
        if (user == undefined) {
            if (data.hash == undefined) {
                return {
                    status: 403
                }
            }
            let inf = await this.commentFormRepo.findOne({ hash: data.hash })
            if (inf == null) {
                return {
                    status: 403
                }
            }
            data.userInfo = inf.info
        }
        let reply

        try {
            let lang = await this.languageCommentRepo.findOne({
                language: data.language
            })
            if (lang != null) {
                if (lang["ungegistered-user-comment"] == false) {
                    data.user = user.id
                }

                if (lang["comment-submit-without-confirm"] == true) {
                    if (data.reply) {
                        reply = data.reply
                    }
                    data.status = "confirmed"
                }
                // if(captch)
            }
        } catch (error) {

        }
        if (commentInfo == undefined) {
            commentInfo = {}
        }
        let geo = geoip.lookup(ip)
        commentInfo["geo"] = geo
        commentInfo["ip"] = ip
        data.commentInfo = commentInfo
        let res = await super.create(data)



        if (reply != undefined) {
            let replyDoc = await this.repository.findOneAndUpdate({
                _id: reply
            }, {
                $inc: {
                    replies: 1
                }
            })

            if(replyDoc != null && replyDoc.manualId != undefined){
                await this.fakeCommentRepo.updateOne({
                    _id : replyDoc.manualId
                },{
                    $inc: {
                        replies: 1
                    },
                })
            }

            await this.repository.updateOne({
                _id: res.data["_id"]
            }, {
                $set: {
                    level: (replyDoc?.level || 1) + 1
                }
            })
        }
        return res
    }


    @Post("/notification/subscribe")
    async subscribeNotification(
        @Header("host") host: string,
        @Body({
            schema: z.any()
        }) body: string,
        @User({
            required: false
        }) user: UserInfo,
        @Query({
            destination: "hash",
            schema: z.string().optional(),
        }) hash?: string
    ) {
        try {
            let domain = await this.domainRepo.findOne({
                domain : host
            })
            if (domain == null ){
                return {
                    status : 400
                }
            }
            if (user == undefined) {
                await this.commentFormRepo.updateOne({
                    hash : {
                        $eq : hash
                    }
                }, {
                    $push: {
                        notificationTokens: {
                            domain: domain._id,
                            type: "web-push",
                            config: body
                        }
                    }
                })
            }
            else {
                await this.userRepo.updateOne({
                    _id : user.id
                }, {
                    $push: {
                        notificationTokens: {
                            domain: domain._id,
                            type: "web-push",
                            config: body
                        }
                    }
                })
            }
            return {
                status : 200
            }
        } catch (error) {
            throw error
        }
    }


    @Get("/domain/notification/config")
    async getDomainNotificationPublicKey(
        @Header("host") host: string
    ): Promise<Response> {
        try {
            let domain = await this.domainRepo.findOne({
                domain : host
            })
            if (domain == null ){
                return {
                    status : 400
                }
            }
            return {
                status : 200,
                data : domain.notificationConfig?.publicKey
            }
        } catch (error) {
            throw error
        }
    }



    @Get("s")
    async paginateComments(
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Query({
            destination: "pageId",
            schema: BaseController.id
        }) pageId: string,
        @Query({
            destination: "sortOrder",
            schema: z.enum(["latest", "oldest", "most-like", "most-replied"]).default("latest")
        }) sortOrder: string,
        @Query({
            destination: "type",
            schema: z.enum(["question", "comment"]).optional()
        }) cType?: "question" | "comment",
        @Query({
            destination: "hash",
            schema: z.string().optional(),
        }) hash?: string,
        @User({
            required: false
        }) user?: UserInfo
    ): Promise<Response> {
        let clientId
        if (user == undefined) {
            if (hash != undefined) {
                clientId = hash
            }
        }
        else {
            clientId = user.phoneNumber
        }

        let sort: any = {
            _id: -1
        }
        if (sortOrder == "oldest") {
            sort = {
                _id: 1
            }
        }

        if (sortOrder == "most-like") {
            sort = {
                like: -1
            }
        }


        if (sortOrder == "most-replied") {
            sort = {
                replies: -1
            }
        }


        let query: any = {
            page: pageId,
            status: "confirmed",
            reply: {
                $exists: false
            }
        }
        if (cType != undefined) {
            query["type"] = cType
        }
        console.log("query" , query)

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
        })

        if (clientId != undefined) {
            try {
                let list = JSON.parse(JSON.stringify(res.data.list))
                for (let i = 0; i < list.length; i++) {
                    let c = await this.userCommentRepo.findOne({
                        comment: list[i]._id,
                        clientId
                    })

                    if (c != null) {
                        list[i].likeComment = c.type
                    }
                }
                res.data.list = list
            }
            catch (error) {

            }
        }

        return res
    }

    @Get("/replies")
    async getReplies(
        @Query({
            destination: "comment",
            schema: BaseController.id
        }) comment: string,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "hash",
            schema: z.string().optional(),
        }) hash?: string,
        @User({
            required: false
        }) user?: UserInfo
    ): Promise<Response> {
        try {
            let clientId
            if (user == undefined) {
                if (hash != undefined) {
                    clientId = hash
                }
            }
            else {
                clientId = user.phoneNumber
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
            }


            if (clientId != undefined) {
                try {
                    let list = JSON.parse(JSON.stringify(res.data.list))
                    for (let i = 0; i < list.length; i++) {

                        let c = await this.userCommentRepo.findOne({
                            comment: list[i]._id,
                            clientId
                        })

                        if (c != null) {
                            list[i].likeComment = c.type
                        }
                    }
                    res.data.list = list
                }
                catch (error) {

                }
            }

            return res

        } catch (error) {
            throw error
        }
    }

    @Get("")
    async getComment(
        @Query({
            destination: "comment",
            schema: BaseController.id
        }) comment: string
    ) {
        try {
            return this.findById(comment)
        } catch (error) {
            throw error
        }
    }

    @Post("/like")
    async likeComment(
        @Query({
            destination: "clientId",
            schema: z.string()
        }) clientId: string,
        @Query({
            destination: "comment",
            schema: BaseController.id
        }) comment: string,
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ): Promise<Response> {
        try {
            let languageConfig = await this.languageCommentRepo.findOne({
                language
            })
            let type = "like-dislike"
            if (languageConfig != null) {
                type = languageConfig["like-type"]
            }

            let userComment = await this.userCommentRepo.findOne({
                clientId,
                comment
            })
            if (userComment == null) {
                await this.userCommentRepo.insert({
                    clientId,
                    comment,
                    type: "like"
                } as any)

                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        like: 1,
                    }
                })
                return {
                    data: "new",
                    status: 200
                }
            }

            else if (userComment.type == "dislike") {
                await this.userCommentRepo.updateOne({
                    _id: userComment._id
                }, {
                    $set: {
                        type: "like"
                    }
                })

                let updateQuery: any = {
                    like: 1,
                    dislike: -1
                }
                if (type == "like") {
                    updateQuery = {
                        like: 1,
                    }
                }
                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        like: 1,
                        dislike: -1
                    }
                })
                return {
                    data: type == "like" ? "new" : "change",
                    status: 200
                }
            }
            else {
                if (type == "like") {
                    await this.repository.updateOne({
                        _id: comment
                    }, {
                        $inc: {
                            like: -1
                        }
                    })
                    await this.userCommentRepo.findOneAndDelete({
                        _id: userComment._id
                    })
                    return {
                        data: "change",
                        status: 200
                    }
                }


                return {
                    data: "exists",
                    status: 200
                }
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/dislike")
    async dislikeComment(
        @Query({
            destination: "clientId",
            schema: z.string()
        }) clientId: string,
        @Query({
            destination: "comment",
            schema: BaseController.id
        }) comment: string,
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ): Promise<Response> {
        try {
            let languageConfig = await this.languageCommentRepo.findOne({
                language
            })
            let type = "like-dislike"
            if (languageConfig?.["like-type"] == "like") {
                return {
                    status: 200,
                    data: "exists"
                }
            }

            let userComment = await this.userCommentRepo.findOne({
                clientId,
                comment
            })
            if (userComment == null) {
                await this.userCommentRepo.insert({
                    clientId,
                    comment,
                    type: "dislike"
                } as any)

                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        dislike: 1,
                    }
                })
                return {
                    data: "new",
                    status: 200
                }
            }

            else if (userComment.type == "like") {
                await this.userCommentRepo.updateOne({
                    _id: userComment._id
                }, {
                    $set: {
                        type: "dislike"
                    }
                })

                await this.repository.updateOne({
                    _id: comment
                }, {
                    $inc: {
                        dislike: 1,
                        like: -1
                    }
                })
                return {
                    data: "change",
                    status: 200
                }
            }
            else {

                return {
                    data: "exists",
                    status: 200
                }
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/config")
    async getCommentConfig(
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ) {
        try {
            return {
                data: await this.languageCommentRepo.findOne({
                    language
                })
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/report")
    async reportComment(
        @Query({
            destination: "comment",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            let res = this.editById(id, {
                $set: {
                    reported: true,
                    status: "proccessing"
                }
            })

            let comment = await this.repository.findOne({
                _id: id,
                reply: {
                    $exists: true
                }
            })
            if (comment != null) {
                try {
                    await this.repository.findByIdAndUpdate(comment.reply as string, {
                        $inc: {
                            replies: -1
                        }
                    })
                } catch (error) {

                }
            }

        } catch (error) {
            throw error
        }

    }

    @Get("/info/check")
    async checkUserInfo(
        @Query({
            destination: "type",
            schema: z.enum(["phone", "email"])
        }) type: string,
        @Query({
            destination: "value",
            schema: z.string()
        }) value: string
    ): Promise<Response> {
        try {
            let query: any = {

            }
            if (type == "phone") {
                query.phoneNumber = {
                    $eq: value
                }
            }
            else {
                query.email = value
            }

            return {
                status: 200,
                data: await this.userRepo.isExists(query)
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/captcha/google")
    async getCaptchaToken(
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ): Promise<Response> {
        try {
            let lang = await this.languageRepo.findById(language)

            let domain
            if (lang?.domain) {
                domain = await this.domainRepo.findOne({
                    _id: lang.domain
                })
            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                })
            }
            if (domain == null) {
                return {
                    status: 400,
                    message: "دامنه ای معتبر وجود ندارد"
                }
            }

            return {
                data: domain.cptchaInfo?.site_key
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/phone/validate")
    async validatePhone(
        @Body({
            destination: "phone",
            schema: BaseController.phone
        }) phone: string,
        @Session() session: any
    ): Promise<Response> {
        try {
            let userExists = await this.userRepo.isExists({
                phoneNumber: phone
            })
            if (userExists) {
                return {
                    status: 400,
                    message: "شماره تلفن وارد شده قبلا ثبت نام شده است"
                }
            }
            var random: Number = RandomGenarator.randomNumber()
            try {
                var result = await SmsMessager.send({
                    receptor: phone,
                    template: 'userCommentRegister',
                    parameters: {
                        random: random,
                    }
                })


                if (result == false) {
                    return {
                        status: 500,
                        message: "مشکلی در سرویس پیامکی رخ داده است"
                    }
                }

                session["random"] = random
                session.phone = phone
                session.cookie.expires = new Date(Date.now() + 120 * 1000)

                return {
                    status: 200,
                    message: "کد ورود با موفقیت برای شما ارسال شد",
                    session
                }

            } catch (error) {
                // throw error
                return {
                    status: 500,
                    message: "مشکلی در سرویس پیامکی رخ داده است"
                }
            }

        } catch (error) {
            throw error
        }
    }

    @Post("/phone/validate/random")
    async checkRandomCode(
        @Body({
            destination: "random",
            schema: BaseController.random
        }) random: number,
        @Session() session: any
    ) {
        if (session["random"] != random || random == undefined) {
            return {
                status: 400,
                message: "کد وارد شده نامعتبر است"
            }
        }
        else {
            session["ok"] = true
            session.cookie.expires = new Date(Date.now() + 600 * 1000)
            return {
                status: 200,
                session
            }
        }
    }

    @PreExec({
        method: "post",
        route: "/info/submit"
    })
    async checkSubmitCaptch(
        @Body({
            schema: z.object({
                language: BaseController.id,
                googleToken: z.string().optional()
            })
        }) info: any
    ): Promise<Response> {
        try {
            let lang = await this.languageRepo.findById(info.language)

            let domain
            if (lang?.domain) {
                domain = await this.domainRepo.findOne({
                    _id: lang.domain
                })
            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                })
            }

            if (domain == null || domain?.cptchaInfo == undefined) {
                return {
                    next: true
                }
            }

            const response = await axios.get(
                `https://www.google.com/recaptcha/api/siteverify?secret=${domain?.cptchaInfo!.secret_key}&response=${info.googleToken}`
            );

            if (response.data.success) {
                return {
                    next: true
                }
                // return res.json({ success: true });
            }
            else {
                return {
                    status: 400
                }
            }
        } catch (error) {
            throw error
        }
        return {
            next: true
        }
    }

    @Post("/info/submit")
    async submitInfo(
        @Body({
            schema: z.object({
                name: z.string(),
                family: z.string(),
                email: BaseController.email.optional(),
                phone: BaseController.phone,
                language: BaseController.id,
                autoSignup: z.boolean().default(false),
            })
        }) info: any,
        @Session() session: any,
    ) {
        console.log(info.autoSignup)
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
        })

        if (langInfo != null) {
            if (langInfo["comment-submit-without-confirm"] != true) {
                return {
                    status: 403
                }
            }
            if (langInfo["validate-phone"] == true && session.ok != true) {
                return {
                    status: 403
                }
            }

            if (session.ok) {
                info.phone = session.phone
                if (
                    info.autoSignup == true
                    && langInfo["show-auto-signup"] == true
                ) {
                    let password = RandomGenarator.generateHashStr(12)
                    await this.userRepo.insert({
                        name: info.name,
                        family: info.family,
                        email: info.email,
                        phoneNumber: info.phone,
                        password: password,
                    } as any)

                }
            }

            let hash = RandomGenarator.generateHashStr(32)

            await this.commentFormRepo.insert({
                hash,
                info,
                submitted: session.ok == true
            } as any)

            return {
                status: 200,
                data: {
                    hash
                }
            }
        }
    }

    @Get("/info/recover")
    async recover(
        @Query({
            destination: "hash",
            schema: z.string()
        }) hash: string
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.commentFormRepo.findOne({ hash: hash })
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/attach")
    async attachFile(
        @Body({
            destination: "file",
            schema: z.string()
        }) file: string,
        @Files({
            config: {
                name: "file",
                maxCount: 5,
                // size : 5000000
            },
            mapToBody: true,
            destination: "file",
            // isArray: true,
            schema: z.any().optional(),


        }) files: any,
        @Body({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ) {
        try {

            let lang = await this.languageCommentRepo.findOne({
                language
            })
            if (lang != null) {

                // if(captch)
                let savePath = lang["upload-path"]
                var conf = await this.cdnRepo.findById(savePath.fileManager)

                var cdn: CDN_Manager = new CDN_Manager()
                await cdn.init(true)
                let dest = ArticleController.getUploadDestination(savePath.path, "y-m-d") + path.basename(file)

                let data = await cdn.upload(file, dest)
                return {
                    status: 200,
                    data
                }
            }
            return {
                status: 400
            }


        } catch (error) {
            console.log(error)
            throw error
        }
    }
}

// const comment = new CommentController("/comment", new CommentRepository())

// export default comment