"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class BaseRepositoryService {
    constructor(collection, options) {
        this.collection = collection;
        this.population = (options === null || options === void 0 ? void 0 : options.population) || [];
        if ((options === null || options === void 0 ? void 0 : options.cacheService) != undefined) {
            this.cacheService = options.cacheService;
        }
        if ((options === null || options === void 0 ? void 0 : options.joinedCollection) != undefined) {
            this.joinedCollection = options.joinedCollection;
        }
    }
    setPopulation(population) {
        this.population = population;
    }
    setJoinedCollection(joinedCollection) {
        this.joinedCollection = joinedCollection;
    }
    async populate(data, population) {
        var doc;
        if (typeof data == "string") {
            doc = JSON.parse(data);
        }
        else {
            var doc = JSON.parse(JSON.stringify(data));
        }
        for (let i = 0; i < population.length; i++) {
            var repo = this.getJoinedCollecttion(population[i].path);
            if (repo) {
                if ((0, lodash_1.isArray)(doc[population[i].path])) {
                    doc[population[i].path] = await repo.findAll({
                        _id: {
                            $in: doc[population[i].path]
                        }
                    }, {
                        projection: this.getProjection(population[i].select)
                    });
                }
                else
                    doc[population[i].path] = await repo.findById(doc[population[i].path], {
                        projection: this.getProjection(population[i].select)
                    });
            }
            else {
            }
        }
        return doc;
    }
    getProjection(projection) {
        if (projection == undefined) {
            return undefined;
        }
        var pr = {};
        for (let i = 0; i < projection.length; i++) {
            pr[projection[i]] = 1;
        }
        return pr;
    }
    project(data, projection) {
        if (data == null) {
            return data;
        }
        var doc;
        if (typeof data == "string") {
            doc = JSON.parse(data);
        }
        else {
            doc = JSON.parse(JSON.stringify(data));
        }
        if (projection == undefined) {
            return JSON.parse(JSON.stringify(data));
        }
        var projectionType;
        for (const key in projection) {
            if (projection[key] == 1) {
                projectionType = "1";
            }
            else {
                projectionType = "0";
            }
            break;
        }
        if (projectionType == "1") {
            var result = {};
            for (const key in projection) {
                result[key] = doc[key];
            }
            return result;
        }
        else {
            for (const key in projection) {
                delete doc[key];
            }
            return doc;
        }
    }
    projectMany(data, projection) {
        if (data.length == 0) {
            return [];
        }
        var doc = JSON.parse(JSON.stringify(data[0]));
        var projectionType;
        for (const key in projection) {
            if (projection[key] == 1) {
                projectionType = "1";
            }
            else {
                projectionType = "0";
            }
            break;
        }
        for (let i = 0; i < data.length; i++) {
            if (projectionType == "1") {
                var result = {};
                for (const key in projection) {
                    result[key] = doc[key];
                }
                return result;
            }
            else {
                for (const key in projection) {
                    delete doc[key];
                }
                return doc;
            }
        }
    }
    getJoinedCollecttion(path) {
        var _a, _b;
        return (_b = (_a = this.joinedCollection) === null || _a === void 0 ? void 0 : _a.find((element, key) => {
            return element.name == path;
        })) === null || _b === void 0 ? void 0 : _b.repo;
    }
    async refreshCache(query) {
        if (!this.cacheService) {
            return;
        }
        try {
            var execQuery = this.collection.findOne(query, {});
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.spopulation[i])
            }
            var doc = await execQuery.exec();
            if (doc == null) {
                return;
            }
            await this.cacheService.set(doc._id, doc);
        }
        catch (error) {
            return;
        }
    }
    async refreshCacheById(id) {
        if (!this.cacheService) {
            return;
        }
        try {
            var execQuery = this.collection.findById(id, {});
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.population[i])
            }
            var doc = await execQuery.exec();
            if (doc == null) {
                return;
            }
            await this.cacheService.set(id, doc);
        }
        catch (error) {
            return;
        }
    }
    async refreshMany(query) {
        if (!this.cacheService) {
            return;
        }
        try {
            var execQuery = this.collection.find(query, {});
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.population[i])
            }
            var docs = await execQuery.exec();
            for (let i = 0; i < docs.length; i++) {
                await this.cacheService.set(docs[i]._id, docs[i]);
            }
        }
        catch (error) {
            return;
        }
    }
    async deleteManyFromChache(query) {
        if (!this.cacheService) {
            return;
        }
        try {
            var execQuery = this.collection.find(query, {});
            for (let i = 0; i < this.population.length; i++) {
                // execQuery = execQuery.populate(this.population[i])
            }
            var docs = await execQuery.exec();
            for (let i = 0; i < docs.length; i++) {
                await this.cacheService.unset(docs[i]._id);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async removeFromChache(id) {
        var _a;
        (_a = this.cacheService) === null || _a === void 0 ? void 0 : _a.unset(id);
    }
    async paginate(query, limit, page, options) {
        if (options == undefined)
            options = {};
        var population = options.population || this.population || [];
        var execQuery = this.collection.find(query, options.projection)
            .sort(options.sort || {
            _id: -1
        })
            .skip(limit * (page - 1))
            .limit(limit);
        for (let i = 0; i < population.length; i++) {
            execQuery.populate(population[i]);
        }
        return {
            list: await execQuery
                .lean()
                .exec(),
            count: await this.collection.countDocuments(query)
        };
    }
    async findById(id, queryInfo, population = this.population) {
        // console.log("iddd" , id , queryInfo , population)
        if (id == undefined) {
            return null;
        }
        if (queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.fromDb) {
            var execQuery = this.collection.findById(id, queryInfo.projection);
            for (let i = 0; i < population.length; i++) {
                execQuery.populate(population[i]);
            }
            return await execQuery
                .lean()
                .exec();
        }
        if (typeof id != "string") {
            id = id.toHexString();
        }
        if (this.cacheService) {
            try {
                var data = await this.cacheService.get(id);
            }
            catch (error) {
                throw error;
            }
            if (data != null) {
                if (queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.projection) {
                    data = this.project(data, queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.projection);
                }
                if (population.length != 0) {
                    data = await this.populate(data, population);
                }
                else if (typeof data == "string") {
                    data = JSON.parse(data);
                }
                return data;
            }
        }
        var execQuery = this.collection.findById(id);
        // for (let i = 0; i < population.length; i++) {
        //     execQuery = execQuery.populate(population[i])
        // }
        // console.log(population)
        var doc = await execQuery
            .lean()
            .exec();
        if (doc != null) {
            if (this.cacheService) {
                await this.cacheService.set(id, doc);
            }
        }
        if (queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.projection) {
            doc = this.project(doc, queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.projection);
        }
        if (population.length != 0) {
            doc = await this.populate(doc, population);
        }
        return doc;
    }
    async findOne(query, queryInfo, population = this.population) {
        if (queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.fromDb) {
            return await this.collection.findOne(query, queryInfo.projection)
                // .lean<T>()
                .exec();
        }
        if (this.cacheService) {
            try {
                var data = await this.cacheService.get(JSON.stringify(query), "OneQuery");
                if (data != null) {
                    return await this.findById(data, queryInfo, population);
                }
            }
            catch (error) {
                throw error;
            }
        }
        var doc = await this.collection.findOne(query, queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.projection)
            .sort((queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.sort) || {
            _id: -1
        })
            .populate(population)
            .lean()
            .exec();
        if (doc != null) {
            if (this.cacheService) {
                await this.cacheService.set(JSON.stringify(query), doc._id.toHexString(), "OneQuery");
            }
        }
        return doc;
    }
    async getcount(query) {
        try {
            return await this.collection.countDocuments(query);
        }
        catch (error) {
            throw error;
        }
    }
    async findOneWithoutLead(query) {
        return this.collection.findOne(query)
            .exec();
    }
    async insert(document, options = {}) {
        return await this.collection.create(document);
    }
    async insertMany(documents) {
        return await this.collection.insertMany(documents);
    }
    async updateOne(query, data, options) {
        try {
            var result = await this.collection.updateOne(query, data, options);
            this.refreshCache(query);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async updateMany(query, data) {
        try {
            var result = await await this.collection.updateMany(query, data);
            this.refreshMany(query);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async findMany(query, options = {}, page = 1, limit = 100) {
        var result = this.collection.find(query, options.projection).populate(this.population || options.population).skip(limit * (page - 1))
            .limit(limit);
        if (options.sort) {
            result.sort(options.sort);
        }
        return await result.exec();
    }
    async findAll(query, options = {}, population = this.population) {
        var _a;
        if (options.sort) {
            var execQuery = this.collection.find(query)
                .sort(options.sort);
        }
        else {
            var execQuery = this.collection.find(query, options.projection);
        }
        if (this.cacheService) {
            let r = [];
            let d = await this.cacheService.get(JSON.stringify(query));
            if (d != null && d != undefined) {
                let ids = JSON.parse(d);
                let result = [];
                for (let i = 0; i < ids.length; i++) {
                    result.push(await this.findById(ids[i]));
                }
                return result;
            }
        }
        for (let i = 0; i < population.length; i++) {
            execQuery.populate(population[i]);
        }
        let r = await execQuery
            .exec();
        if (this.cacheService) {
            let ids = [];
            for (let i = 0; i < r.length; i++) {
                ids.push(r[i]._id.toHexString());
                await this.cacheService.set(r[i]._id.toHexString(), r[i]);
            }
            await ((_a = this.cacheService) === null || _a === void 0 ? void 0 : _a.set(JSON.stringify(query), JSON.stringify(ids)));
        }
        return r;
    }
    async findOneAndUpdate(query, queryData) {
        try {
            var doc = await this.collection.findOneAndUpdate(query, queryData, {
                runValidators: true
            }).sort({ _id: -1 });
            this.refreshCacheById(doc === null || doc === void 0 ? void 0 : doc._id);
            return doc;
        }
        catch (error) {
            throw error;
        }
    }
    async findOneAndDelete(query) {
        try {
            var result = await this.collection.findOneAndDelete(query, {
                runValidators: true,
            }).sort({ _id: -1 });
            if (result != null) {
                this.removeFromChache(result._id);
            }
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async findByIdAndUpdate(id, query, options) {
        if (options == undefined) {
            options = {};
        }
        options.runValidators = true;
        var result = await this.collection.findByIdAndUpdate(id, query, {
            runValidators: true,
        });
        this.refreshCacheById(result === null || result === void 0 ? void 0 : result._id);
        return result;
    }
    async deleteById(id) {
        try {
            var result = await this.collection.deleteOne({
                _id: id
            });
            this.removeFromChache(id.toString());
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async deleteMany(query) {
        try {
            await this.deleteManyFromChache(query);
            return await this.collection.deleteMany(query);
        }
        catch (error) {
            throw error;
        }
    }
    async isExists(query) {
        // try {
        var res = await this.collection.exists(query);
        // console.log(res)
        return res != null;
        // } catch (error) {
        //     console.log("error" ,error.mess)
        //     throw error
        // }
    }
    async distinct(field, query = {}) {
        return this.collection.distinct(field, query);
    }
    async replace(query, document) {
        var d = await this.findOneAndDelete(query);
        document._id = d === null || d === void 0 ? void 0 : d._id;
        var res = await this.insert(document);
        return await this.refreshCache(query);
    }
}
exports.default = BaseRepositoryService;
