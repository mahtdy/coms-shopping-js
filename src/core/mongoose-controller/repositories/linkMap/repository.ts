import { Types } from "mongoose";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import LinkMap, { LinkData, LinkMapModel } from "./model";
import KeywordRepository from "../keyword/repository";



export default class LinkMapRepository extends BaseRepositoryService<LinkMap> {
    keywordRepo : KeywordRepository
    constructor(keywordRepo : KeywordRepository,options?: RepositoryConfigOptions) {
        super(LinkMapModel, options);
        this.keywordRepo = keywordRepo
    }

    async insert(document: LinkMap, options?: any): Promise<any> {
        const newLinkMap = await super.insert(document)
        
        return newLinkMap
    }

    async updateLinkIfNotExists(linkMap: LinkMap,
        part: "contentLinks" | "summaryLinks" | "faqLinks" | "commentLinks",
        linkData: LinkData) {
        let c = linkMap[part]
        let finded = false
        for (let i = 0; i < c.length; i++) {
            if (c[i].subPartId == linkData.subPartId) {
                linkData.isRejected = c[i].isRejected
                c[i] == linkData
                finded = true
                break
            }
        }
        if (!finded) {
            c.push(linkData)
        }

        let upQuery: any = {}
        upQuery[part] = c

        await this.updateOne({
            _id: linkMap._id
        }, {
            $set: upQuery
        })
    }

    async deleteLinkFromMap(
        id: string,
        part: "contentLinks" | "summaryLinks" | "faqLinks" | "commentLinks",
        subPartId?: string | Types.ObjectId) {

        try {
            let upQuery: any = {}
            upQuery[part] =
            {
                subPartId
            }
            await this.updateOne({
                _id: id
            }, {
                $pull: upQuery
            })
        } catch (error) {
            throw error
        }
    }
}