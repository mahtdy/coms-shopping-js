
import { z } from "zod"
import { Get, Post, Put } from "../../decorators/method";
import BaseController, { AutoComplete, ControllerOptions } from "../controller";
import Comment from "../repositories/comment/model";
import CommentRepository from "../repositories/comment/repository";
import { Admin, Body, Query, Session } from "../../decorators/parameters";
import { Response } from "../../controller";
import { AdminInfo } from "../auth/admin/admin-logIn";
import BaseRepositoryService from "../repository";
import ArticleRepository from "../repositories/article/repository";
import { ArticleModel } from "../repositories/article/model";
import CommentNoteRepository from "../repositories/commentNote/repository";
import { Types, UpdateQuery } from "mongoose";
import ContentRepository from "../repositories/content/repository";
import CommentBlockRepository from "../repositories/commentBlock/repository";
import CommentFormRepository from "../repositories/commentForm/reopository";
import UserRepository from "../repositories/user/repository";
import BaseUser from "../repositories/user/model";
import SmsMessager from "../../messaging/smsMessager";
import LinkTagRepository from "../repositories/linkTag/repository";
import NotificationTokenRepository from "../repositories/notificationTokens/repository";
import NotificationMessager from "../../messaging/notification";
import FakeCommentRepository from "../repositories/fakeComment/repository";


let ejs = require("ejs");

interface ModuleConfig {
    name: string,
    filters: { [x: string]: string[] },
    showName: string,
    repo: BaseRepositoryService<any>
}
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
}




var subscriptions: any[] = [];


export class CommentController extends BaseController<Comment> {
    modules: ModuleConfig[]
    commentNoteRepo: CommentNoteRepository
    contentRepo: ContentRepository
    commentBlockRepo: CommentBlockRepository
    commentFormRepo: CommentFormRepository
    userRepository?: UserRepository<BaseUser>
    linktagRepo?: LinkTagRepository
    notificationTokenRepo :  NotificationTokenRepository
    fakeCommentRepo : FakeCommentRepository

    constructor(baseRoute: string, repo: CommentRepository, options: ControllerOptions & {
        modules: ModuleConfig[],
        userRepository?: UserRepository<BaseUser>
    }) {
        super(baseRoute, repo, options)
        this.modules = options.modules
        this.commentNoteRepo = new CommentNoteRepository()
        this.contentRepo = new ContentRepository()
        this.commentBlockRepo = new CommentBlockRepository()
        this.commentFormRepo = new CommentFormRepository()
        this.linktagRepo = new LinkTagRepository()
        this.notificationTokenRepo = new NotificationTokenRepository()
        this.fakeCommentRepo = new FakeCommentRepository()
    }
    initApis(): void {
        super.initApis()
    }

    async create(data: Comment, @Body({
        destination: "sendMessage",
        schema: z.boolean().default(false)
    }) sendMessage: boolean, @Admin() admin: AdminInfo): Promise<Response> {
        data.admin = admin._id
        let reply = data.reply
        data.status = "confirmed"

        let res = await super.create(data)

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
            if (sendMessage == true) {
                try {
                    this.sendNotification(res.data)
                    this.sendSMS(res.data)
                } catch (error) {

                }
            }
        }

        return res
    }

    async sendSMS(comment: Comment) {
        try {
            let phone
            if (comment.userReplied) {
                let user = await this.userRepository?.findById(comment.userReplied)
                if (user != null) {
                    phone = user.phoneNumber

                }
            }
            else if (comment.userInfoReplied) {
                phone = comment.userInfoReplied["phone"] as string

            }

            else {
                return
            }

            let p
            let contentId
            if (comment?.page != null) {
                let language = comment.language
                let lang = await this.contentRepo.languageRepo.findById(language)
                if (lang?.domain != undefined) {
                    let domain = await this.contentRepo.domainRepo.findById(lang?.domain as string)
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    })
                    p = (domain?.sslType != "none" ? "https://" : "http://") + domain?.domain
                    contentId = content?._id
                }
                else {
                    let domain = await this.contentRepo.domainRepo.findOne({
                        isDefault: true
                    })
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    })
                    p = (domain?.sslType != "none" ? "https://" : "http://") + domain?.domain
                    contentId = content?._id
                }
            }
            if (contentId) {
                let link = await this.linktagRepo?.findOne({
                    link: contentId
                })
                if (link != null) {
                    let url = (p as string) + link.tag + `?comment=${comment._id}`
                    await SmsMessager.send({
                        receptor: phone as string,
                        template: "commentReply",
                        parameters: {
                            url
                        }
                    })
                }
            }


        } catch (error) {

        }
    }

    async sendNotification(comment: Comment) {
        try {
            let tokens
            if (comment.userReplied) {
                let user = await this.userRepository?.findById(comment.userReplied)
                if (user != null) {
                    tokens = user.notificationTokens

                }
            }
            else if (comment.userInfoReplied) {
                let commentform = await this.commentFormRepo.findOne({
                    "info.phone" : comment.userInfoReplied["phone"]
                })
                if(commentform != null ){
                    tokens = commentform.notificationTokens
                }

            }

            else {
                return
            }

            let p
            let contentId
            if (comment?.page != null) {
                let language = comment.language
                let lang = await this.contentRepo.languageRepo.findById(language)
                if (lang?.domain != undefined) {
                    let domain = await this.contentRepo.domainRepo.findById(lang?.domain as string)
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    })
                    p = (domain?.sslType != "none" ? "https://" : "http://") + domain?.domain
                    contentId = content?._id
                }
                else {
                    let domain = await this.contentRepo.domainRepo.findOne({
                        isDefault: true
                    })
                    let content = await this.contentRepo.findOne({
                        id: comment.page
                    })
                    p = (domain?.sslType != "none" ? "https://" : "http://") + domain?.domain
                    contentId = content?._id
                }
            }
            if (contentId) {
                let link = await this.linktagRepo?.findOne({
                    link: contentId
                })
                if (link != null) {
                    let url = (p as string) + link.tag + `?comment=${comment._id}&replyto=${comment.reply}`
                    await NotificationMessager.send({
                        receptor: tokens,
                        template: "commentReply",
                        parameters: {
                            url
                        },
                        language : comment.language,
                        url
                    })
                }
            }


        } catch (error) {

        }
    }


    @Post("/confirm")
    async confirmComment(
        @Body({
            destination: "comment",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            let comment = await this.repository.findById(id)
            let res = await this.editById(id, {
                $set: {
                    status: "confirmed"
                }
            })
            if (comment?.status != "confirmed" && comment?.reply) {
                try {
                    let replyDoc = await this.repository.findOneAndUpdate({
                        _id: comment.reply
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

                    if(comment != null && comment.manualId != undefined){
                        await this.fakeCommentRepo.updateOne({
                            _id : comment.manualId
                        },{
                            $set: {
                                status : "confirmed"
                            },
                        })
                    }

                    await this.repository.updateOne({
                        _id: id
                    }, {
                        $set: {
                            level: (replyDoc?.level || 1) + 1

                        }
                    })
                } catch (error) {

                }
            }
            return res
        } catch (error) {
            throw error
        }
    }

    @Post("/reject")
    async reject(
        @Body({
            destination: "comment",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            let comment = await this.repository.findById(id)
            let res = await this.editById(id, {
                $set: {
                    status: "rejected"
                }
            })
            if (comment?.status == "confirmed" && comment?.reply) {
                try {
                    await this.repository.updateOne({
                        _id: comment.reply
                    }, {
                        $inc: {
                            replies: -1
                        }
                    })
                    if(comment != null && comment.manualId != undefined){
                        await this.fakeCommentRepo.updateOne({
                            _id : comment.manualId
                        },{
                            $inc: {
                                replies: 1
                            },
                        })
                    }


                    if(comment != null && comment.manualId != undefined){
                        await this.fakeCommentRepo.updateOne({
                            _id : comment.manualId
                        },{
                            $set: {
                                status : "rejected"
                            },
                        })
                    }
                } catch (error) {

                }
            }
            return res
        } catch (error) {
            throw error
        }
    }


    async recurciveDeleteComment(commentId: string | Types.ObjectId) {
        try {
            let comments = await this.repository.findAll({
                reply: commentId
            })
            for (let i = 0; i < comments.length; i++) {
                // const element = array[i];
                await this.recurciveDeleteComment(comments[i]._id)
                await this.repository.deleteById(comments[i]._id)
            }
        } catch (error) {

        }
    }

    async delete(id: Types.ObjectId | string, ...params: [...any]): Promise<Response> {
        // console.log("delete",id)
        try {
            let comment = await this.repository.findById(id)
            let res = await this.repository.deleteById(id)
            if (comment?.status == "confirmed") {
                if (comment?.reply) {
                    const replyDoc = await this.repository.findByIdAndUpdate(comment.reply, {
                        $inc: {
                            replies: -1
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

                    if(comment.manualId != undefined){
                        await this.fakeCommentRepo.deleteById(comment.manualId as string)
                    }
                    
                }
            }
            this.recurciveDeleteComment(id)

            return {
                status: 200,
                data: res
            }
        } catch (error) {
            throw error
        }
    }


    @Get("/push")
    async getPush() : Promise<Response>{
        console.log("push")
        
        return new Promise((resolve,reject) => {
            ejs.renderFile("build/templates/push.ejs", { }, (err: any, data: any) => {
                if(err) {
                    reject(err)
                    return
                }
                resolve({
                    status : 200,
                    data,
                    html : true
                })
            })
        })
    }


    @Post("/push/subscribe")
    async subscribeWebPush(
        @Body({
            schema: z.any()
        }) body: any
    ): Promise<Response> {
        console.log("subscription" , body)
        const subscription = body;
        subscriptions.push(subscription);
        return {
            status: 200
        }
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


    @Get("/notes")
    async getNotes(
        @Query({
            destination: "phone",
            schema: z.string()
        }) phone: string
    ): Promise<Response> {
        try {
            let commentNote = await this.commentNoteRepo.findOne({
                user: phone
            }, {

            }, [{
                path: "notes.admin",
                select: ["name", "familyName", "phoneNumber", "email", "profile"]
            }])


            return {
                status: 200,
                data: commentNote?.notes || []
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/note/delete")
    async deleteNote(
        @Body({
            destination: "phone",
            schema: z.string()
        }) phone: string,
        @Body({
            destination: "noteID",
            schema: BaseController.id
        }) noteID: string
    ): Promise<Response> {

        try {
            await this.commentNoteRepo.findOneAndUpdate({
                user: phone
            }, {
                $pull: {
                    notes: {
                        _id: noteID
                    }
                }
            })
            return {
                status: 200
            }
        } catch (error) {
            throw error
        }

    }

    @Post("/note")
    async addNote(
        @Body({
            destination: "phone",
            schema: z.string()
        }) phone: string,
        @Body({
            destination: "text",
            schema: z.string()
        }) text: string,
        @Admin() adminInfo: AdminInfo
    ): Promise<Response> {
        try {
            try {
                let commentNote = await this.commentNoteRepo.findOne({
                    user: phone
                })
                if (commentNote == null) {
                    await this.commentNoteRepo.insert({
                        user: phone,
                        notes: [{
                            text,
                            admin: adminInfo._id
                        }]
                    } as any)
                    return {
                        status: 200,
                    }
                }
                else {
                    await this.commentNoteRepo.findByIdAndUpdate(commentNote._id, {
                        $push: {
                            notes: {
                                text,
                                admin: adminInfo._id
                            }
                        }
                    })
                }
                return {
                    status: 200
                }
            } catch (error) {
                throw error
            }
        } catch (error) {
            throw error
        }
    }

    @Put("")
    async update(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: z.object({
                status: z.enum(["confirmed", "rejected", "proccessing"]).optional(),
                text: z.string().optional(),
                type: z.enum(["question", "comment"]).optional()
            })
        }) data: any
    ): Promise<Response> {

        try {
            let extComment = await this.repository.findById(id)
            let r = await this.editById(id, {
                $set: data
            })
            let comment = await this.repository.findById(id)
            if (comment?.reply) {

                if (
                    extComment?.status == "confirmed"
                    && comment?.status != "confirmed"
                ) {

                }

                if (
                    extComment?.status != "confirmed"
                    && comment?.status == "confirmed"
                ) {

                }
            }

            return r
        } catch (error) {
            throw error
        }
    }



    @Get("/serach")
    async searchComments(): Promise<Response> {
        try {


            return {

            }
        } catch (error) {
            throw error
        }
    }



    @Post("/filter")
    async filter(
        @Body({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Body({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Body({
            destination: "sort",
            schema: z.enum(["oldest", "newest", "hotest"]).default("newest")
        }) sortKey: "oldest" | "newest" | "hotest",

        @Body({
            destination: "module",
            schema: z.string().default("article")
        }) moduleName?: string,
        @Body({
            destination: "moduleQuery",
            schema: BaseController.search.optional()
        }) moduleQuery?: any,
        @Body({
            destination: "filters",
            schema: BaseController.search.optional()
        }) filters?: any,

    ) {
        try {
            let sort = sortMap[sortKey]
            let query: any = {}
            let pageIDs
            if (Object.keys(moduleQuery).length != 0 && moduleName != undefined) {
                let selectedModule = this.modules.find((x, index) => {
                    if (x.name == moduleName) {
                        return x
                    }
                })
                if (selectedModule != undefined) {
                    pageIDs = []
                    let q = this.moduleSearchHelper(moduleQuery, selectedModule.filters)



                    let pages = await selectedModule.repo.findAll(q, {
                        projection: {
                            _id: 1
                        }
                    })

                    for (let i = 0; i < pages.length; i++) {
                        pageIDs.push(pages[i]._id)
                    }

                    query['page'] = {
                        $in: pageIDs
                    }
                }
            }

            let q = await this.searchHelper(filters)

            query = Object.assign(query, q)

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
            })


        } catch (error) {
            throw error
        }
    }

    @Get("/module/filters")
    getModuleFilters(
        @Query({
            destination: "module",
            schema: z.string()
        }) moduleName: string
    ): Response {
        let selectedModule = this.modules.find((x, index) => {
            if (x.name == moduleName) {
                return x
            }
        })

        return {
            data: selectedModule?.filters,
            status: 200
        }
    }


    async test() {
        let comments = await this.repository.findAll({
            reply: {
                $exists: true
            }
        })
        for (let i = 0; i < comments.length; i++) {
            let exists = await this.repository.isExists({
                reply: comments[i]._id
            })
            if (exists) {
                console.log(comments[i]._id)
            }
        }

    }

    @Get("/tree")
    async getCommentFullTree(
        @Query({
            destination: "comment",
            schema: BaseController.id
        }) commentId: string
    ): Promise<Response> {
        try {
            let commentTree = await this.getRootComment(commentId)
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
            ])


            let tree = await this.makeTree(commentTreeObject)
            let comment = await this.repository.findOne({
                _id: commentId
            }, {}, [{
                path: "page",
                select: ["content", "summary", "url", "language", "title", "commentImportant"]
            }])
            let parent
            if (comment?.reply) {
                parent = await this.repository.findOne({
                    _id: commentId
                })
            }


            let page

            let commentInfo = comment?.commentInfo
            if (comment?.page != null) {
                page = JSON.parse(JSON.stringify(comment.page))
                let language = comment.language
                let lang = await this.contentRepo.languageRepo.findById(language)
                if (lang?.domain != undefined) {
                    let domain = await this.contentRepo.domainRepo.findById(lang?.domain as string)
                    let content = await this.contentRepo.findOne({
                        id: page._id
                    })
                    let p = domain?.sslType != "none" ? "https://" : "http://"
                    page.url = p + content?.url
                }
                else {
                    let domain = await this.contentRepo.domainRepo.findOne({
                        isDefault: true
                    })
                    let content = await this.contentRepo.findOne({
                        id: page._id
                    })
                    let p = domain?.sslType != "none" ? "https://" : "http://"
                    page.url = p + domain?.domain + content?.url
                }
            }
            return {
                data: {
                    tree,
                    page,
                    commentInfo
                }
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    @Get("/user/search")
    async searchUser(
        @Query({
            destination: "type",
            schema: z.enum(["guest", "user"])
        }) type: "guest" | "user",
        @Query({
            destination: "term",
            schema: z.string()
        }) term: string
    ): Promise<Response> {
        let query: any = {}

        if (type == "guest") {
            let qs = term.split(" ")
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
                ]
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
                ]
            }


            let users = await this.commentFormRepo.paginate(query, 10, 1)
            return {
                data: users,
                status: 200
            }
        }

        else {
            let qs = term.split(" ")
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
                ]
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
                ]

            }

            let users = await this.userRepository?.paginate(query, 10, 1)
            return {
                data: users,
                status: 200
            }
        }
    }


    @Get("/admin/search")
    async searchAdmin(
        @Query({
            destination: "term",
            schema: z.string()
        }) term: string
    ): Promise<Response> {
        try {
            let query: any = {}
            let qs = term.split(" ")
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
                ]
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
                ]

            }



            let admins = await this.adminRepo?.paginate(query, 10, 1, {
                projection: {
                    name: 1,
                    familyName: 1,
                }
            })
            return {
                data: admins,
                status: 200
            }
        } catch (error) {
            throw error
        }
    }



    async getRootComment(commentId: string): Promise<any> {
        let comment = await this.repository.findById(commentId)
        if (comment?.reply) {
            return await this.getRootComment(comment.reply as string)
        }
        return commentId
    }


    async makeTree(comment: any) {
        comment = JSON.parse(JSON.stringify(comment))
        let children = []
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
        ]
        )
        for (let i = 0; i < replies.length; i++) {
            let r = await this.makeTree(replies[i])
            r.parent = comment._id
            children.push(r)
        }
        comment["children"] = children
        return comment
    }


    @Get("/search/list")
    public getSearchList(): Response {
        return super.getSearchList()
    }

    @Post("/counts")
    async getCommentCount(
        @Body({
            destination: "moduleQuery",
            schema: BaseController.search.optional()
        }) moduleQuery?: any,
        @Body({
            destination: "module",
            schema: z.string().optional()
        }) moduleName?: string,
        @Body({
            destination: "filters",
            schema: BaseController.search.optional()
        }) filters?: any,
    ): Promise<Response> {
        let query: any = {}
        let pageIDs

        if (moduleName != undefined) {
            let selectedModule = this.modules.find((x, index) => {
                if (x.name == moduleName) {
                    return x
                }
            })
            if (selectedModule != undefined) {
                pageIDs = []
                let q = this.moduleSearchHelper(moduleQuery, selectedModule.filters)


                let pages = await selectedModule.repo.findAll(q,
                    {
                        projection: {
                            _id: 1
                        }
                    })
                for (let i = 0; i < pages.length; i++) {
                    pageIDs.push(pages[i]._id)
                }

                query['page'] = {
                    $in: pageIDs
                }
            }
        }

        let q = await this.searchHelper(filters)
        query = Object.assign(query, q)

        let result = await this.repository.collection.aggregate(
            [
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
            ]
        )

        let statuses = ["confirmed", "rejected", "proccessing"]
        let comments = 0
        let questions = 0

        let all = 0

        let finalResult = []

        for (let i = 0; i < statuses.length; i++) {
            let count = 0
            for (let j = 0; j < result.length; j++) {
                if (statuses[i] == result[j]["_id"].status) {
                    all += result[j].count
                    count += result[j].count
                    if (result[j]["_id"].type == "comment") {
                        comments += result[j].count
                    }

                    else {
                        questions += result[j].count
                    }
                    // break
                }
            }
            finalResult.push({
                _id: statuses[i],
                count
            })


        }



        finalResult.push({
            _id: "all",
            count: all
        })



        finalResult.push({
            _id: "questions",
            count: questions
        })
        finalResult.push({
            _id: "comments",
            count: comments
        })

        return {
            status: 200,
            data: finalResult
        }
    }

    @Post("/like")
    async like() {

    }

    @Post("/dislike")
    async dislike() {

    }

    @Post("/block")
    async blockUser(
        @Body({
            destination: "phone",
            schema: z.string()
        }) phone: string,
        @Body({
            destination: "type",
            schema: z.enum(["temporary", "permanent"])
        }) blockType: "temporary" | "permanent",
        @Body({
            destination: "duration",
            schema: z.coerce.number().int().positive().optional()
        }) duration?: number,
        @Body({
            destination: "durationType",
            schema: z.enum(["hour", "day"]).optional()
        }) durationType?: "hour" | "day",
    ): Promise<Response> {
        try {
            let expire
            if (durationType != undefined) {
                if (durationType == "hour") {
                    expire = new Date(Date.now() + (3600000 * (duration || 1)))
                }
                else {
                    expire = new Date(Date.now() + (86400000 * (duration || 1)))
                }
            }
            let block = await this.commentBlockRepo.findOne({
                phone: {
                    $eq: phone
                }
            })
            if (block == null) {
                await this.commentBlockRepo.insert({
                    phone,
                    blockType,
                    duration,
                    durationType,
                    expire
                } as any)
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
                })
            }

            return {
                status: 200,
            }
        } catch (error) {
            throw error
        }

    }

    @Get("/block/check")
    async checkUserBlock(
        @Query({
            destination: "phone",
            schema: BaseController.phone
        }) phone: string
    ) {
        try {
            let block = await this.commentBlockRepo.findOne({
                phone
            })

            if (block == null || block.enabled == false) {
                return {
                    data: {
                        isBlock: false
                    }
                }
            }

            if (block.blockType == "permanent"
                || block.expire! > new Date()
            ) {
                return {
                    data: {
                        isBlock: true,
                        expire: block.expire
                    }
                }
            }

            return {
                data: {
                    isBlock: false
                }
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/unblock")
    async unBlock(
        @Body({
            destination: "phone",
            schema: z.string()
        }) phone: string,
    ): Promise<Response> {
        try {
            let data = await this.commentBlockRepo.updateOne({
                phone: {
                    $eq: phone
                }
            }, {
                $set: {
                    enabled: false
                }
            })

            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }


    async searchHelper(queryParam?: any): Promise<any> {
        // console.log(queryParam)

        let query: any = {}
        if (queryParam == undefined) {
            return query
        }
        if (queryParam["userType$eq"]) {
            if (queryParam["userType$eq"] == "user") {
                query["user"] = {
                    $exists: true
                }
            }
            else {
                query["userInfo"] = {
                    $exists: true
                }
            }
            delete queryParam["userType$eq"]
        }

        let q = await super.searchHelper(queryParam)
        return Object.assign(q, query)
    }

    moduleSearchHelper(queryParam: any, moduleFilters: any) {


        var query: any = {}
        for (const key in moduleFilters) {
            var ands = []
            for (let i = 0; i < moduleFilters[key].length; i++) {
                if (queryParam[key + "$" + moduleFilters[key][i]]) {
                    if (moduleFilters[key][i] == "lte") {
                        var condition: any = {}
                        condition[key] = {
                            "$lte": queryParam[key + "$" + moduleFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (moduleFilters[key][i] == "gte") {
                        var condition: any = {}
                        condition[key] = {
                            "$gte": queryParam[key + "$" + moduleFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (moduleFilters[key][i] == "eq") {
                        var condition: any = {}
                        condition[key] = {
                            "$eq": queryParam[key + "$" + moduleFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (moduleFilters[key][i] == "list") {
                        var condition: any = {}
                        condition[key] = {
                            "$in": queryParam[key + "$" + moduleFilters[key][i]]
                        }
                        ands.push(condition)
                    }
                    else if (moduleFilters[key][i] == "reg") {
                        var condition: any = {}
                        condition[key] = {
                            "$regex": new RegExp(queryParam[key + "$" + moduleFilters[key][i]] as string)
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


}



const comment = new CommentController("/comment", new CommentRepository(), {
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
        repo: new ArticleRepository({
            model: ArticleModel,
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
    insertSchema: z.object({
        text: z.string(),
        page: BaseController.id,
        module: z.string().default("article"),
        language: BaseController.id,
        reply: BaseController.id.optional(),
        userReplied: BaseController.id.optional(),
        adminReplied: BaseController.id.optional(),
        userInfoReplied: z.any().default({}).optional()
    })
})


export default comment