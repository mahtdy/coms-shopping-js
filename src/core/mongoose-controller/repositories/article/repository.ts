import { Types } from "mongoose"

import { QueryInfo, RepositoryConfigOptions } from "../../repository"
import Article, { ProccessName, ProccessStatus } from "./model"

import BasePageRepository, { BasePageOptions } from "../../basePage/repository"
import ArticleContentProccessor from "../../../services/articleProccessing"

import TemplateConfigRepository from "../templateConfig/repository"
import CDN_Manager, { DiskFileManager } from "../../../services/fileManager"
import SystemConfigRepository from "../system/repository"

import FileManagerConfigRepository from "../fileManagerConfig/repository"
import CategoryRepository from "../category/repository"
import LanguageRepository from "../language/repository"
import VideoQueueRepository from "../videoQueue/repository"
import WaterMarkRepository from "../waterMarkConfig/repository"


export function getUploadDestination(
    staticPath: string,
    dynamicPathStyle: "y" | "y-m" | "y-m-d" | "y-n" | "n" | "y-m-n",
    contentNumber?: number
) {
    let secondPart = "";
    let today = new Date();
    switch (dynamicPathStyle) {
        case "y":
            secondPart = today.getFullYear().toString() + "/";
            break;
        case "y-m":
            secondPart =
                today.getFullYear().toString() +
                "/" +
                today.getMonth().toString() +
                "/";
            break;
        case "y-m-d":
            secondPart =
                today.getFullYear().toString() +
                "/" +
                today.getMonth().toString() +
                "/" +
                today.getDate().toString() +
                "/";
            break;
        case "y-n":
            secondPart = today.getFullYear().toString() +
                "/" +
                contentNumber?.toString() +
                "/";
            break;
        case "n":
            secondPart = contentNumber?.toString() + "/";
            break;
        case "y-m-n":
            secondPart =
                today.getFullYear().toString() +
                "/" +
                today.getMonth().toString() +
                "/" +
                contentNumber?.toString() +
                "/";
            break;
        default:
            break;
    }
    return staticPath + secondPart;
}


export default class ArticleRepository extends BasePageRepository<Article> {
    templateConfigRepo: TemplateConfigRepository
    cdn: CDN_Manager
    confRepo: SystemConfigRepository
    cdnRepo: FileManagerConfigRepository
    watermarkConfigRepo: WaterMarkRepository
    constructor(options: RepositoryConfigOptions & BasePageOptions<Article>) {
        super(options)
        // this
        this.cdn = new CDN_Manager()
        this.cdnRepo = new FileManagerConfigRepository()
        this.templateConfigRepo = new TemplateConfigRepository()
        this.confRepo = new SystemConfigRepository()
        this.watermarkConfig = new WaterMarkRepository()
        this.joinedCollection = [{
            name: "category",
            repo: new CategoryRepository()
        }, {
            name: "language",
            repo: new LanguageRepository()
        }
            , {
            name: "video",
            repo: new VideoQueueRepository()
        }
            , {
            name: "videos",
            repo: new VideoQueueRepository()
        }

        ]
        
        this.watermarkConfigRepo = new WaterMarkRepository()
    }

    insert(document: Article): Promise<Article> {
        // document.type = "cost"
        // console.log("insert1" , document._id)
        return super.insert(document)
    }

    async addTestData() {
        for (let i = 20351; i < 100000; i++) {
            let data: any = {
                "isLandingPage": false,
                "type": "general",
                "suggestArticles": [],
                "contentType": "article",
                "title": "fffffffffffffff" + (i + 1),
                "mainImage": "http://shirazent.ir:9000/hassan/samplhdd.jpeg",
                "summary": "<p><a class=\"ck-link_selected\" href=\"/tag_ahtu7i\">fffffffffffffffffff</a></p>",
                "content": "<p>fffffffffffffffffffffffffffffffffffffff</p>",
                "files": [],
                "status": "",
                "istop": false,
                "needProccess": false,
                "language": "61079639ab97fc52395831bf",
                "category": "64d9e3bc48be97cc8d2b30e3",
                "categories": [
                    "64d9e3bc48be97cc8d2b30e3"
                ],
                "ancestors": [],
                "author": "60a209e04dd1fb466672b4da",
                "isPublished": true,
                "commentStatus": false,
                "commentShow" : false,
                "noIndex": false,
                "isDraft": false,
                "fileUses": [],
                "commonQuestions": [],
                "view": 0,
                "viewMode": "public",
                "seo": {
                    "url": "fffd" + (i + 1),
                    "mainKeyWord": "ggggggggggggggggggg" + (i + 1),
                    "keyWords": ["ggggggggggggggggggg" + (i + 1)],
                    "seoAnkertexts": [],
                    "canoncialAddress": "",
                    "oldAddress": "",
                    "isStatic": false,
                    "seoTitle": "fffffffffffffffffff" + (i + 1),
                    "metaDescription": "fffffffffffffffffffff" + (i + 1),
                    "redirectList": [],
                    "articleType": "blog",
                    "questionOppened": "yes"
                },
                "social": [
                    {
                        "socialName": "facebook",
                        "title": "",
                        "description": "",
                        "image": ""
                    },
                    {
                        "socialName": "twitter",
                        "title": "",
                        "description": "",
                        "image": ""
                    }
                ],
                "questionOppened": "yes",
                "imageProccessed": false,
                "videoProccessed": false,
                "videos": [],
                "proccesses": [
                    {
                        "status": 1,
                        "problems": [],
                        "_id": "66863fc07716a3983e2e0d86",
                        "name": "content",
                        "persianName": "پردازش محتوا"
                    },
                    {
                        "status": 1,
                        "problems": [],
                        "_id": "66863fc07716a3983e2e0d87",
                        "name": "videos",
                        "persianName": "پردازش ویدیو"
                    },
                    {
                        "status": 1,
                        "problems": [],
                        "_id": "66863fc07716a3983e2e0d88",
                        "name": "images",
                        "persianName": "پردازش عکس‌ها"
                    }
                ],
                "insertDate": "2024-07-04T10:52:56.238+04:30",
                "Refrences": [],

            }
            await this.insert(data)
            // console.log("i" , i)
        }
    }

    async syncData() {
        let as = await this.findAll({
            seoContent: {
                $exists: false
            },
            isPublished: true
        })
        for (let i = 0; i < as.length; i++) {
            let c = await this.contentRepo.findOne({
                id: as[i]._id.toHexString(),
                // language : 
            })
            await this.updateOne({
                _id: as[i]._id
            }, {
                $set: {
                    seoContent: c?._id
                }
            })

        }
    }

    async paginate(query: {}, limit: number, page: number, options?: QueryInfo): Promise<{ list: any[] | Document[]; count: number }> {
        try {
            let r = await super.paginate(query, limit, page, options)
            return r
        } catch (error) {
            throw error
        }
    }

    async publish(id: string | Types.ObjectId): Promise<string> {
        try {
            const doc = await this.findById(id)
            const url = await super.publish(id)

            if (doc?.type == "video") {
                // do for video

            }
            return url
        } catch (error) {
            throw error
        }

    }







    async getPath(contentType: "video" | "image" | "sound" | "document") {
        try {
            let staticPath = await this.confRepo.getConfigValue(`${contentType}-folder`)
            let dynamicPathStyle = await this.confRepo.getConfigValue(`${contentType}-folder-dynamic-style`)
            return this.getUploadDestination(staticPath, dynamicPathStyle)
        } catch (error) {
            throw error
        }
    }

    getUploadDestination(staticPath: string, dynamicPathStyle: "y" | "y-m" | "y-m-d") {
        let secondPart = ""
        let today = new Date()
        switch (dynamicPathStyle) {
            case "y":
                secondPart = today.getFullYear().toString() + "/"
                break;
            case "y-m":
                secondPart = today.getFullYear().toString() + "/" + today.getMonth().toString() + "/"
                break;
            case "y-m-d":
                secondPart = today.getFullYear().toString() + "/" + today.getMonth().toString() + "/" + today.getDate().toString() + "/"
                break;
            default:
                break;
        }
        return staticPath + secondPart
    }


    public async passVideoProccess(id: Types.ObjectId) {
        return await this.findOneAndUpdate({
            _id: id,
            "proccesses.name": ProccessName.videos
        }, {
            $set: {
                "proccesses.$.status": ProccessStatus.finished
            }

        })
    }






    public async doFindFiles(doc: Article): Promise<string[]> {
        var files = await super.doFindFiles(doc)
        doc.mainImage ? files.push(doc.mainImage) : true

        if (doc.files)
            files.push(...doc?.files)

        if (doc.videos != undefined) {

            for (let i = 0; i < doc.videos.length; i++) {
                if (typeof doc.videos[i] != "string") {
                    files.push((doc.videos[i] as any).src)
                    try {
                        for (let j = 0; j < (doc.videos[i] as any).result.length; j++) {

                            files.push((doc.videos[i] as any).result[j].path)

                        }

                        for (let j = 0; j < (doc.videos[i] as any).screenshots.length; j++) {

                            files.push((doc.videos[i] as any).screenshots[j].path)

                        }
                    } catch (error) {

                    }

                }

            }
        }
        if (doc.imageConfig) {
            for (let i = 0; i < doc.imageConfig.length; i++) {
                files.push(doc.imageConfig[i].path)
            }
        }


        let content = doc.content
        files.push(...ArticleContentProccessor.getContentFiles(content || ""))
        files.push(...ArticleContentProccessor.getContentFiles(doc.summary || ""))
        return files
    }



}