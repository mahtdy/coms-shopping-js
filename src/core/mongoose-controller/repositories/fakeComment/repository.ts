import ArticleContentProccessor from "../../../services/articleProccessing";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository"
import FakeComment, { FakeCommentModel } from "./model";
import schaduler from "../../../services/queue";
import { Types, UpdateQuery } from "mongoose";
import PublishCycleRepository from "../publishCycle/repository";
import ContentPublishQueueRepository from "../contentPublishQueue/repository";
import CommentRepository from "../comment/repository";


export default class FakeCommentRepository extends BaseRepositoryService<FakeComment>{
    publishCycleRepo: PublishCycleRepository
    contentPublishQueueRepo: ContentPublishQueueRepository
    commentRepo: CommentRepository

    constructor(options?: RepositoryConfigOptions) {
        super(FakeCommentModel, options)
        this.publishCycleRepo = new PublishCycleRepository()
        this.contentPublishQueueRepo = new ContentPublishQueueRepository()
        this.commentRepo = new CommentRepository()
    }

    async insert(document: FakeComment, options?: any): Promise<any> {
        try {
            let doc = (await super.insert(document, options) as FakeComment)
            if (doc != null) {
                let publishAt = doc.publishAt

                let cycle = null
                if (doc.cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(doc.cycle as Types.ObjectId)
                    if (cycle != null) {
                        let times = cycle.time.split(":")
                        try {
                            publishAt.setHours(parseInt(times[0]))
                            publishAt.setMinutes(parseInt(times[1]))
                        } catch (error) {

                        }

                    }
                }


                await schaduler.schedule(publishAt, `publishComment-${doc.pageType}`, {
                    commentId: doc._id
                })

                let content = `
                <div>
                    ${doc.text}
                </div>

                `
                await this.contentPublishQueueRepo.insert({
                    pageType: doc.pageType,
                    page: doc.page,
                    type: "comment",
                    subId: doc._id,
                    content: doc.text,
                    contentLength: ArticleContentProccessor.getWordCount(content),
                    date: publishAt,
                    cycle: doc.cycle
                } as any)

            }
            return doc
        } catch (error) {
            throw error
        }
    }

    async publish(id: string, language: string) {
        try {
            const fakeComment = await this.findById(id)
            if (fakeComment == null)
                return
            const comment = await this.commentRepo.findOne({
                manualId: fakeComment._id
            })
            if (comment == null) {
                await schaduler.cancel({
                    "data.commentId": fakeComment._id
                })
                await schaduler.cancel({
                    "data.commentId": fakeComment._id
                })

                let newCommnet = await this.commentRepo.insert({
                    text: fakeComment.text,
                    page: fakeComment.page,
                    module: fakeComment.pageType,
                    level: 1,
                    language,
                    userInfo: fakeComment.userInfo,
                    status: fakeComment.status == "waiting" ? "proccessing" : fakeComment.status,
                    type: "comment",
                    manual: true,
                    manualId: fakeComment._id
                } as any)

                await this.updateOne({
                    _id: fakeComment._id
                }, {
                    $set: {
                        isPublished: true,
                        publishAt: new Date()
                    }
                })



                if (fakeComment.replyText != undefined && fakeComment.replyAdmin != undefined) {
                    if (fakeComment.replyPublishAt) {
                        let publishAt = fakeComment.replyPublishAt
                        let cycle = null

                        if (fakeComment.replyCycle != undefined) {
                            cycle = await this.publishCycleRepo.findById(fakeComment.replyCycle as Types.ObjectId)
                            if (cycle != null) {
                                let times = cycle.time.split(":")
                                try {
                                    publishAt.setHours(parseInt(times[0]))
                                    publishAt.setMinutes(parseInt(times[1]))
                                } catch (error) {

                                }

                            }
                        }
                        schaduler.schedule(publishAt, `publishCommentReply-${fakeComment.pageType}`, {
                            replyId: newCommnet._id,
                            commentId: fakeComment._id
                        })

                        let content = `
                            <div>
                                ${fakeComment.replyText}
                            </div>
                        `
                        await this.contentPublishQueueRepo.insert({
                            pageType: fakeComment.pageType,
                            page: fakeComment.page,
                            type: "fakeComment",
                            subId: fakeComment._id,
                            content,
                            contentLength: ArticleContentProccessor.getWordCount(content),
                            date: publishAt,
                            cycle: fakeComment.cycle
                        } as any)
                    }

                    else {
                        let newReplyCommnet = await this.commentRepo.insert({
                            text: fakeComment.replyText,
                            page: fakeComment.page,
                            module: this.typeName,
                            level: 1,
                            language: language as any,
                            adminReplied: fakeComment.replyAdmin,
                            reply: newCommnet._id,
                            status: fakeComment.status == "waiting" ? "proccessing" : fakeComment.status,
                            type: "comment",
                            manual: true,
                            manualId: fakeComment._id
                        } as any)
                    }
                }

                await this.contentPublishQueueRepo.findOneAndDelete({
                    pageType: fakeComment.pageType,
                    page: fakeComment.page,
                    type: "comment",
                    subId: fakeComment._id,
                })


            }
        } catch (error) {
            console.log("error", error)
            throw error
        }
    }

    async publishAll(
        page: string,
        language: string
    ) {
        try {
            const fakeComments = await this.findAll({
                page
            })
            for (let i = 0; i < fakeComments.length; i++) {
                const comment = await this.commentRepo.findOne({
                    manualId: fakeComments[i]
                })
                if (comment == null) {
                    await schaduler.cancel({
                        "data.commentId": fakeComments[i]._id
                    })
                    await schaduler.cancel({
                        "data.commentId": fakeComments[i]._id
                    })

                    let newCommnet = await this.commentRepo.insert({
                        text: fakeComments[i].text,
                        page: fakeComments[i].page,
                        module: fakeComments[i].pageType,
                        level: 1,
                        language,
                        userInfo: fakeComments[i].userInfo,
                        status: fakeComments[i].status == "waiting" ? "proccessing" : fakeComments[i].status,
                        type: "comment",
                        manual: true,
                        manualId: fakeComments[i]._id
                    } as any)

                    await this.updateOne({
                        _id: fakeComments[i]._id
                    }, {
                        $set: {
                            isPublished: true,
                            publishAt: new Date()
                        }
                    })

                    if (fakeComments[i].replyText != undefined && fakeComments[i].replyAdmin != undefined) {
                        if (fakeComments[i].replyPublishAt != undefined) {
                            let publishAt = fakeComments[i].replyPublishAt || new Date()
                            let cycle = null

                            if (fakeComments[i].replyCycle != undefined) {
                                cycle = await this.publishCycleRepo.findById(fakeComments[i].replyCycle as Types.ObjectId)
                                if (cycle != null) {
                                    let times = cycle.time.split(":")
                                    try {
                                        publishAt.setHours(parseInt(times[0]))
                                        publishAt.setMinutes(parseInt(times[1]))
                                    } catch (error) {

                                    }

                                }
                                schaduler.schedule(publishAt, `publishCommentReply-${fakeComments[i].pageType}`, {
                                    replyId: newCommnet._id,
                                    commentId: fakeComments[i]._id
                                })

                                let content = `
                                    <div>
                                        ${fakeComments[i].replyText}
                                    </div>
                                `
                                await this.contentPublishQueueRepo.insert({
                                    pageType: fakeComments[i].pageType,
                                    page: fakeComments[i].page,
                                    type: "fakeComment",
                                    subId: fakeComments[i]._id,
                                    content,
                                    contentLength: ArticleContentProccessor.getWordCount(content),
                                    date: publishAt,
                                    cycle: fakeComments[i].cycle
                                } as any)
                            }


                        }

                        else {
                            let newReplyCommnet = await this.commentRepo.insert({
                                text: fakeComments[i].replyText,
                                page: fakeComments[i].page,
                                module: this.typeName,
                                level: 1,
                                language: language as any,
                                adminReplied: fakeComments[i].replyAdmin,
                                reply: newCommnet._id,
                                status: fakeComments[i].status == "waiting" ? "proccessing" : fakeComments[i].status,
                                type: "comment",
                                manual: true,
                                manualId: fakeComments[i]._id
                            } as any)
                        }
                    }

                    await this.contentPublishQueueRepo.findOneAndDelete({
                        pageType: fakeComments[i].pageType,
                        page: fakeComments[i].page,
                        type: "comment",
                        subId: fakeComments[i]._id,
                    })
                }
            }
        } catch (error) {
            throw error
        }
    }


    async findByIdAndUpdate(id: string | Types.ObjectId, query: UpdateQuery<FakeComment>): Promise<FakeComment | null> {
        try {

            const before = await super.findByIdAndUpdate(id, query)
            const after = await this.findById(id)
            if (after == null) {
                return after
            }

            if ( before?.isPublished != true && before?.publishAt != undefined && after.publishAt != before?.publishAt) {

                let publishAt = after.publishAt || new Date()

                let cycle = null
                if (after.cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(after.cycle as Types.ObjectId)
                    if (cycle != null) {
                        let times = cycle.time.split(":")
                        try {
                            publishAt.setHours(parseInt(times[0]))
                            publishAt.setMinutes(parseInt(times[1]))
                        } catch (error) {

                        }

                    }
                }

                await schaduler.cancel({
                    commentId: after._id
                })

                await schaduler.schedule(publishAt, `publishComment-${after.pageType}`, {
                    commentId: after._id
                })

                let content = `
            <div>
                ${after.text}
            </div>

            `
                await this.contentPublishQueueRepo.updateOne({
                    pageType: after.pageType,
                    page: after.page,
                    type: "comment",
                    subId: after._id,
                } , {
                    $set : {
                        content: after.text,
                        contentLength: ArticleContentProccessor.getWordCount(content),
                        date: publishAt,
                        cycle: after.cycle
                    }
                })
                await this.contentPublishQueueRepo.insert({
                    pageType: after.pageType,
                    page: after.page,
                    type: "comment",
                    subId: after._id,
                    content: after.text,
                    contentLength: ArticleContentProccessor.getWordCount(content),
                    date: publishAt,
                    cycle: after.cycle
                } as any)
            }

            else { 
                await this.commentRepo.findOneAndUpdate({
                    manualId: after?._id ,
                    reply : {
                        $exists : false
                    }
                } , {
                    $set : {
                        text: after.text,
                        status: after.status == "waiting" ? "proccessing" : after.status,
                        type: "comment",
                    }
                })

                await this.commentRepo.findOneAndUpdate({
                    manualId: after?._id ,
                    reply : {
                        $exists : true
                    }
                } , {
                    $set : {
                        text: after.replyText,
                        status: after?.status == "waiting" ? "proccessing" : after?.status,
                        type: "comment",
                    }
                })
            }
            return before
        } catch (error) {
            throw error
        }
    }


    async deleteById(id: string | Types.ObjectId): Promise<any> {
        try {
            let r = await super.deleteById(id)

            await schaduler.cancel({
                "data.commentId": id
            })

            if(r.isPublished){
                await this.commentRepo.deleteOne({
                    manualId: r?._id 
                })

                await this.commentRepo.deleteOne({
                    manualId: r?._id 
                })
            }

            return r
        } catch (error) {
            throw error
        }
    }


    async checkCommentUpdate(doc: FakeComment) {
        let comments: any[] = []
        let id = doc._id

        let now = new Date()


        await this.contentPublishQueueRepo.deleteMany({
            page: id,
            pageType: this.typeName,
            type: "comment",
            publishAt: {
                $gt: now
            }
        })


        await schaduler.cancel({
            name: `publishComment-${this.typeName}`,
            "data.id": doc._id.toString()
        })


        let start
        let end

        for (let i = 0; i < comments.length; i++) {
            let date = new Date()
            let publishAt = comments[i].publishAt

            if (publishAt != undefined && date < publishAt) {
                let cycle = null
                if (comments[i].cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(comments[i].cycle as Types.ObjectId)
                    if (cycle != null) {
                        let times = cycle.time.split(":")
                        try {
                            publishAt.setHours(parseInt(times[0]))
                            publishAt.setMinutes(parseInt(times[1]))
                        } catch (error) {

                        }

                    }
                }


                if (start == undefined || start > publishAt) {
                    start = publishAt
                }

                if (end == undefined || end < publishAt) {
                    end = publishAt
                }


                schaduler.schedule(publishAt, `publishComment-${this.typeName}`, {
                    id: doc._id,
                    commentId: comments[i]._id
                })

                let content = `
                <div>
                    ${comments[i].text}
                </div>

                `

                await this.contentPublishQueueRepo.insert({
                    pageType: this.typeName,
                    page: id,
                    type: "comment",
                    subId: comments[i]._id,

                    content: content,
                    contentLength: ArticleContentProccessor.getWordCount(
                        content
                    ),

                    date: publishAt,
                    cycle: comments[i].cycle,
                } as any)
            }


        }

        await this.updateOne({
            _id: id
        }, {
            $set: {
                commentUpdateStart: start,
                commentUpdateEnd: end
            }
        })
    }


    async confirm(id: string) {
        try {
            const fakeComment = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "confirmed"
                }
            })
            if (fakeComment != null) {
                const comment = this.commentRepo.updateOne({
                    manualId: id
                }, {
                    $set: {
                        status: "confirmed"
                    }
                })
            }
        } catch (error) {
            throw error
        }
    }

    async reject(id: string) {
        try {
            const fakeComment = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "rejected"
                }
            })
            if (fakeComment != null) {
                const comment = this.commentRepo.updateOne({
                    manualId: id
                }, {
                    $set: {
                        status: "rejected"
                    }
                })
            }
        } catch (error) {
            throw error
        }
    }




}


