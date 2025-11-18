import { Model, Document, Types, model, UpdateQuery, FilterQuery, QueryOptions } from "mongoose"
import CacheService from "../cache"
import { isArray } from "lodash"
import { optional } from "zod"

export interface QueryInfo {
    fromDb?: boolean,
    projection?: any,
    sort?: any,
    population?: Object[]
}

interface JoinedCollection {
    repo: BaseRepositoryService<any>,
    name: string
}
export interface RepositoryConfigOptions {
    joinedCollection?: JoinedCollection[],
    cacheService?: CacheService,
    population?: any[]
}

export default class BaseRepositoryService<T extends Document> {
    [x: string]: any;

    public collection: Model<T>;
    public cacheService?: CacheService;
    public population: any[]
    public joinedCollection?: JoinedCollection[]

    constructor(collection: Model<T>, options?: RepositoryConfigOptions) {
        this.collection = collection
        this.population = options?.population || []
        if (options?.cacheService != undefined) {
            this.cacheService = options.cacheService
        }
        if (options?.joinedCollection != undefined) {
            this.joinedCollection = options.joinedCollection
        }

    }

    setPopulation(population: any[]) {
        this.population = population
    }

    setJoinedCollection(joinedCollection: JoinedCollection[]) {
        this.joinedCollection = joinedCollection
    }

    async populate(data: T | string, population: any[]) {
        var doc
        if (typeof data == "string") {
            doc = JSON.parse(data)
        }
        else {
            var doc = JSON.parse(JSON.stringify(data))
        }

        for (let i = 0; i < population.length; i++) {
            var repo = this.getJoinedCollecttion(population[i].path)

            if (repo) {
                if (isArray(doc[population[i].path])) {
                    doc[population[i].path] = await repo.findAll({
                        _id: {
                            $in: doc[population[i].path] as string
                        }
                    }, {
                        projection: this.getProjection(population[i].select)
                    })
                }
                else
                    doc[population[i].path] = await repo.findById(doc[population[i].path] as string, {
                        projection: this.getProjection(population[i].select)
                    })
            }
            else {

            }
        }
        return doc
    }

    getProjection(projection?: string[]) {
        if (projection == undefined) {
            return undefined
        }
        var pr: any = {}
        for (let i = 0; i < projection.length; i++) {
            pr[projection[i]] = 1
        }
        return pr
    }

    project(data: T, projection: any) {
        if (data == null) {
            return data
        }
        var doc
        if (typeof data == "string") {
            doc = JSON.parse(data)
        }
        else {
            doc = JSON.parse(JSON.stringify(data))
        }
        if (projection == undefined) {
            return JSON.parse(JSON.stringify(data))
        }

        var projectionType
        for (const key in projection) {
            if (projection[key] == 1) {
                projectionType = "1"
            }
            else {
                projectionType = "0"
            }
            break;
        }

        if (projectionType == "1") {
            var result: any = {}
            for (const key in projection) {
                result[key] = doc[key]
            }
            return result
        }

        else {
            for (const key in projection) {
                delete doc[key]
            }
            return doc
        }

    }

    projectMany(data: T[], projection: any) {
        if (data.length == 0) {
            return []
        }

        var doc = JSON.parse(JSON.stringify(data[0]))

        var projectionType
        for (const key in projection) {
            if (projection[key] == 1) {
                projectionType = "1"
            }
            else {
                projectionType = "0"
            }
            break;
        }
        for (let i = 0; i < data.length; i++) {


            if (projectionType == "1") {
                var result: any = {}
                for (const key in projection) {
                    result[key] = doc[key]
                }
                return result
            }

            else {
                for (const key in projection) {
                    delete doc[key]
                }
                return doc
            }
        }
    }

    getJoinedCollecttion(path: string): BaseRepositoryService<Document> | undefined {
        return this.joinedCollection?.find((element, key) => {
            return element.name == path
        })?.repo
    }

    async refreshCache(query: FilterQuery<T>) {
        if (!this.cacheService) {
            return
        }
        try {
            var execQuery = this.collection.findOne(query, {})
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.spopulation[i])
            }
            var doc = await execQuery.exec() as T
            if (doc == null) {
                return
            }
            await this.cacheService.set(doc._id, doc)
        } catch (error) {
            return
        }
    }

    async refreshCacheById(id: string) {
        if (!this.cacheService) {
            return
        }
        try {
            var execQuery = this.collection.findById(id, {})
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.population[i])
            }
            var doc = await execQuery.exec() as T
            if (doc == null) {
                return
            }
            await this.cacheService.set(id, doc)
        } catch (error) {
            return
        }
    }

    async refreshMany(query: FilterQuery<T>) {
        if (!this.cacheService) {
            return
        }
        try {
            var execQuery = this.collection.find(query, {})
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.population[i])
            }
            var docs = await execQuery.exec() as T[]
            for (let i = 0; i < docs.length; i++) {
                await this.cacheService.set(docs[i]._id, docs[i])
            }

        } catch (error) {
            return
        }
    }

    async deleteManyFromChache(query: FilterQuery<T>) {
        if (!this.cacheService) {
            return
        }
        try {
            var execQuery = this.collection.find(query, {})
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.population[i])
            }
            var docs = await execQuery.exec() as T[]
            for (let i = 0; i < docs.length; i++) {
                await this.cacheService.unset(docs[i]._id)
            }

        } catch (error) {
            throw error
        }
    }


    async removeFromChache(id: string) {
        this.cacheService?.unset(id)
    }

    async paginate(query: FilterQuery<T>, limit: number,
        page: number,
        options?: QueryInfo)
        : Promise<
            {
                list: Document[] | any[],
                count: number
            }> {
        if (options == undefined)
            options = {}


        var population: Object[] = options.population || this.population || []

        var execQuery = this.collection.find(query,
            options.projection)
            .sort(options.sort || {
                _id: -1
            })
            .skip(limit * (page - 1))
            .limit(limit)

        for (let i = 0; i < population.length; i++) {
            execQuery.populate(population[i] as any)
        }



        return {
            list: await execQuery
                .lean<Document[]>()

                .exec(),
            count: await this.collection.countDocuments(query)
        }

    }



    async findById(id: Types.ObjectId | string, queryInfo?: QueryInfo, population: any[] = this.population): Promise<T | null> {

        if (id == undefined) {
            return null
        }
        if (queryInfo?.fromDb) {
            var execQuery = this.collection.findById(id, queryInfo.projection)
            for (let i = 0; i < population.length; i++) {
                execQuery.populate(population[i])
            }
            return await execQuery.exec() as T

        }
        if (typeof id != "string") {
            id = id.toHexString()
        }
        if (this.cacheService) {

            try {
                var data = await this.cacheService.get(id)
            } catch (error) {
                throw error
            }
            if (data != null) {

                if (queryInfo?.projection) {
                    data = this.project(data, queryInfo?.projection)
                }
                if (population.length != 0) {

                    data = await this.populate(data, population)
                }
                else if (typeof data == "string") {
                    data = JSON.parse(data)
                }
                return data
            }
        }

        var execQuery = this.collection.findById(id,
            // queryInfo?.projection
        )
        // for (let i = 0; i < population.length; i++) {
        //     execQuery = execQuery.populate(population[i])
        // }
        // console.log(population)
        var doc = await execQuery
            .lean<T>()
            .exec() as T
        if (doc != null) {
            if (this.cacheService) {
                await this.cacheService.set(id, doc)
            }
        }
        if (queryInfo?.projection) {
            doc = this.project(doc, queryInfo?.projection)
        }
        if (population.length != 0) {
            doc = await this.populate(doc, population)
        }
        return doc as T
    }

    public async findOne(query: FilterQuery<T>, queryInfo?: QueryInfo, population: any = this.population): Promise<T | null> {


        if (queryInfo?.fromDb) {
            return await this.collection.findOne(query, queryInfo.projection)
                // .lean<T>()
                .exec() as T
        }


        if (this.cacheService) {
            try {
                var data = await this.cacheService.get(JSON.stringify(query), "OneQuery")
                if (data != null) {
                    return await this.findById(data, queryInfo, population)
                }
            } catch (error) {
                throw error
            }

        }


        var doc = await this.collection.findOne(query, queryInfo?.projection)
            .sort(queryInfo?.sort || {
                _id: -1
            })
            .populate(population)
            .lean<T>()
            .exec()


        if (doc != null) {
            if (this.cacheService) {
                await this.cacheService.set(JSON.stringify(query), doc._id.toHexString(), "OneQuery")
            }
        }


        return doc
    }

    public async getcount(query: FilterQuery<T>): Promise<number> {
        try {
            return await this.collection.countDocuments(query)
        } catch (error) {
            throw error
        }

    }

    async findOneWithoutLead(query: {}): Promise<T | null> {
        return this.collection.findOne(query)
            .exec()
    }

    async insert(document: T, options: any = {}): Promise<T | any> {
        return await this.collection.create(document)
    }

    async insertMany(documents: T[]): Promise<T[]> {
        return await this.collection.insertMany(documents)
    }

    async updateOne(query: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions<T>): Promise<any> {
        try {
            var result = await this.collection.updateOne(query, data, options)
            this.refreshCache(query)
            return result
        } catch (error) {
            throw error
        }

    }

    async updateMany(query: FilterQuery<T>, data: UpdateQuery<T>): Promise<any> {
        try {
            var result = await await this.collection.updateMany(query, data)
            this.refreshMany(query)
            return result
        } catch (error) {
            throw error
        }

    }

    async findMany(query: FilterQuery<T>, options: QueryInfo = {}, page: number = 1, limit: number = 100): Promise<T[]> {
        var result = this.collection.find(query, options.projection).populate(this.population || options.population).skip(limit * (page - 1))
            .limit(limit)
        if (options.sort) {
            result.sort(options.sort)
        }
        return await result.exec()
    }




    async findAll(query: FilterQuery<T>, options: QueryInfo = {}, population: any[] = this.population)
        : Promise<T[]> {
        if (options.sort) {
            var execQuery = this.collection.find(query)
                .sort(options.sort)
        }
        else {

            var execQuery = this.collection.find(query, options.projection)
        }


        if (this.cacheService) {
            let r = []

            let d = await this.cacheService.get(JSON.stringify(query))
            if (d != null && d != undefined) {
                let ids = JSON.parse(d)
                let result: any[] = []
                for (let i = 0; i < ids.length; i++) {
                    result.push(await this.findById(ids[i]))
                }
                return result
            }

        }

        for (let i = 0; i < population.length; i++) {
            execQuery.populate(population[i])
        }


        let r = await execQuery
            .exec()

        if (this.cacheService) {
            let ids = []
            for (let i = 0; i < r.length; i++) {
                ids.push(r[i]._id.toHexString())
                await this.cacheService.set(r[i]._id.toHexString(), r[i])
            }
            await this.cacheService?.set(JSON.stringify(query), JSON.stringify(ids))
        }
        return r
    }

    async findOneAndUpdate(query: FilterQuery<T>, queryData: UpdateQuery<T>): Promise<T | null> {
        try {
            var doc = await this.collection.findOneAndUpdate(query, queryData,
                {
                    runValidators: true
                }).sort({ _id: -1 })

            this.refreshCacheById(doc?._id)
            return doc
        } catch (error) {
            throw error
        }
    }

    async findOneAndDelete(query: FilterQuery<T>): Promise<T | null> {
        try {
            var result = await this.collection.findOneAndDelete(query,
                {
                    runValidators: true,
                }).sort({ _id: -1 })
            if (result != null) {
                this.removeFromChache(result._id)
            }

            return result
        } catch (error) {
            throw error
        }

    }

    async findByIdAndUpdate(id: Types.ObjectId | string, query: UpdateQuery<T>, options?: QueryOptions<T>): Promise<T | null> {
        if (options == undefined) {
            options = {}
        }
        options.runValidators = true
        var result = await this.collection.findByIdAndUpdate(id, query, {
            runValidators: true,

        })
        this.refreshCacheById(result?._id)
        return result
    }

    async deleteById(id: Types.ObjectId | string): Promise<any> {

        try {
            var result = await this.collection.deleteOne({
                _id: id
            })
            this.removeFromChache(id.toString())
            return result
        } catch (error) {
            throw error
        }

    }

    async deleteMany(query: FilterQuery<T>) {
        try {
            await this.deleteManyFromChache(query)
            return await this.collection.deleteMany(query)
        } catch (error) {
            throw error
        }
    }


    async isExists(query: FilterQuery<T>) {
        // try {

        var res = await this.collection.exists(query)
        // console.log(res)
        return res != null
        // } catch (error) {
        //     console.log("error" ,error.mess)
        //     throw error
        // }
    }

    async distinct(field: string, query: FilterQuery<T> = {}) {
        return this.collection.distinct(field, query)
    }

    async replace(query: FilterQuery<T>, document: T) {

        var d = await this.findOneAndDelete(query)
        document._id = d?._id
        var res = await this.insert(document)
        return await this.refreshCache(query)

    }




}