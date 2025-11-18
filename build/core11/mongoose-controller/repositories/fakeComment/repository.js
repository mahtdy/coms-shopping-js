"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const articleProccessing_1 = __importDefault(require("../../../services/articleProccessing"));
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
const queue_1 = __importDefault(require("../../../services/queue"));
const repository_2 = __importDefault(require("../publishCycle/repository"));
const repository_3 = __importDefault(require("../contentPublishQueue/repository"));
class FakeCommentRepository extends repository_1.default {
    constructor(options) {
        super(model_1.FakeCommentModel, options);
        this.publishCycleRepo = new repository_2.default();
        this.contentPublishQueueRepo = new repository_3.default();
    }
    async insert(document, options) {
        try {
            let doc = await super.insert(document, options);
            console.log("insert", doc);
            if (doc != null && doc.status == "confirmed") {
                let publishAt = doc.publishAt;
                let cycle = null;
                if (doc.cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(doc.cycle);
                    if (cycle != null) {
                        let times = cycle.time.split(":");
                        try {
                            publishAt.setHours(parseInt(times[0]));
                            publishAt.setMinutes(parseInt(times[1]));
                        }
                        catch (error) {
                        }
                    }
                }
                await queue_1.default.schedule(publishAt, `publishComment-${doc.pageType}`, {
                    commentId: doc._id
                });
                let content = `
                <div>
                    ${doc.text}
                </div>

                `;
                await this.contentPublishQueueRepo.insert({
                    pageType: doc.pageType,
                    page: doc.page,
                    type: "comment",
                    subId: doc._id,
                    content: doc.text,
                    contentLength: articleProccessing_1.default.getWordCount(content),
                    date: publishAt,
                    cycle: doc.cycle
                });
            }
            return doc;
        }
        catch (error) {
            throw error;
        }
    }
    async findByIdAndUpdate(id, query) {
        try {
            return super.findByIdAndUpdate(id, query);
        }
        catch (error) {
            throw error;
        }
    }
    async deleteById(id) {
        // console.log("delete")
        try {
            let r = await super.deleteById(id);
            await queue_1.default.cancel({
                "data.commentId": id
            });
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    async checkCommentUpdate(doc) {
        let comments = [];
        let id = doc._id;
        let now = new Date();
        await this.contentPublishQueueRepo.deleteMany({
            page: id,
            pageType: this.typeName,
            type: "comment",
            publishAt: {
                $gt: now
            }
        });
        await queue_1.default.cancel({
            name: `publishComment-${this.typeName}`,
            "data.id": doc._id.toString()
        });
        let start;
        let end;
        for (let i = 0; i < comments.length; i++) {
            let date = new Date();
            let publishAt = comments[i].publishAt;
            if (publishAt != undefined && date < publishAt) {
                let cycle = null;
                if (comments[i].cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(comments[i].cycle);
                    if (cycle != null) {
                        let times = cycle.time.split(":");
                        try {
                            publishAt.setHours(parseInt(times[0]));
                            publishAt.setMinutes(parseInt(times[1]));
                        }
                        catch (error) {
                        }
                    }
                }
                if (start == undefined || start > publishAt) {
                    start = publishAt;
                }
                if (end == undefined || end < publishAt) {
                    end = publishAt;
                }
                queue_1.default.schedule(publishAt, `publishComment-${this.typeName}`, {
                    id: doc._id,
                    commentId: comments[i]._id
                });
                let content = `
                <div>
                    ${comments[i].text}
                </div>

                `;
                await this.contentPublishQueueRepo.insert({
                    pageType: this.typeName,
                    page: id,
                    type: "comment",
                    subId: comments[i]._id,
                    content: content,
                    contentLength: articleProccessing_1.default.getWordCount(content),
                    date: publishAt,
                    cycle: comments[i].cycle,
                });
            }
        }
        await this.updateOne({
            _id: id
        }, {
            $set: {
                commentUpdateStart: start,
                commentUpdateEnd: end
            }
        });
    }
    async confirm() {
    }
    async reject() {
    }
}
exports.default = FakeCommentRepository;
