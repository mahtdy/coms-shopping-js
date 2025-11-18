"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
// import Admin, { AdminModel } from "../../database/models/admin"
const bcrypt_1 = __importDefault(require("bcrypt"));
const repository_2 = __importDefault(require("../../repositories/system/repository"));
const repository_3 = __importDefault(require("../role/repository"));
const repository_4 = __importDefault(require("../adminPermission/repository"));
const repository_5 = __importDefault(require("../action/repository"));
const repository_6 = __importDefault(require("../dbSchema/repository"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const repository_7 = __importDefault(require("../language/repository"));
var SALT_LENGTH = 15;
// import { adminSalt } from "../../config"
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
class AdminRepository extends repository_1.default {
    constructor(options) {
        super(options.model, {
            cacheService: options.cache
        });
        this.salt = options.salt;
        this.permissionRepo = new repository_4.default();
        this.actionRepo = new repository_5.default();
        this.schemaRepo = new repository_6.default();
        this.roleRepo = new repository_3.default({
            actions: {}
        });
        this.langRepo = new repository_7.default();
    }
    async translateLanguage(fields, tableLabel, language) {
        if (language) {
            var langMap = {};
            try {
                let lang = await this.langRepo.findById(language);
                if (lang === null || lang === void 0 ? void 0 : lang.filePath) {
                    var langJSON = JSON.parse((await readFile(lang.filePath)).toString("utf-8"));
                    langMap = langJSON.paginations;
                }
                for (const key in langMap) {
                    if (key == tableLabel) {
                        for (const k in fields) {
                            fields[k].fa_title = langMap[key][k] || fields[k].fa_title;
                        }
                    }
                }
                return fields;
            }
            catch (error) {
                console.log(error);
            }
        }
        return fields;
    }
    async hashPassword(password) {
        try {
            var conf = await new repository_2.default().getConf("password-minimum-length");
            if (conf != null && password.length < conf.value) {
                throw new Error(`minimum password length is ${conf === null || conf === void 0 ? void 0 : conf.value}`);
            }
        }
        catch (error) {
            throw error;
        }
        try {
            return await bcrypt_1.default.hash(password, this.salt || await bcrypt_1.default.genSalt(SALT_LENGTH));
        }
        catch (error) {
            throw error;
        }
    }
    async insert(admin) {
        try {
            admin.password = await this.hashPassword(admin.password);
        }
        catch (error) {
            throw error;
        }
        return await super.insert(admin);
    }
    async editAdmin(_id, data) {
        // if(data.phoneNumber){
        let exists = await this.isExists({
            _id: {
                $ne: _id
            },
            $or: [
                {
                    phoneNumber: data.phoneNumber
                },
                {
                    email: data.email
                },
                {
                    userName: data.userName
                }
            ]
        });
        if (exists) {
            throw new Error("دیتای تکراری وارد شده است");
        }
        return this.updateOne({
            _id
        }, {
            $set: data
        });
        // }
    }
    async comparePassword(admin, password) {
        try {
            return await bcrypt_1.default.compare(password, admin.password);
        }
        catch (error) {
            throw error;
        }
    }
    async checkLogin(userName, ip) {
        return this.findOne({
            $and: [
                {
                    $or: [{ userName: userName }, { email: userName }, { phoneNumber: userName }]
                },
                {
                    $or: [{ validIPList: { $in: [ip] } }, { validIPList: { $size: 0 } }, { validIPList: { $exists: false } }]
                }
            ]
        });
    }
    async logIn(id) {
        return await this.updateOne({
            _id: id
        }, {
            $set: {
                lastLogIn: new Date(Date.now())
            }
        });
    }
    async getAdminAndLogIn(id) {
        return await this.findByIdAndUpdate(id, {
            $set: {
                lastLogIn: new Date(Date.now())
            }
        });
    }
    async changePassword(id, password) {
        try {
            password = await this.hashPassword(password);
        }
        catch (error) {
            throw error;
        }
        try {
            if (await new repository_2.default().isExists({
                key: "allow-repetitious-password",
                value: false
            })) {
                if (await this.isExists({
                    _id: id,
                    $or: [
                        {
                            passwords: password
                        }, {
                            password: password
                        }
                    ]
                })) {
                    throw new Error("این رمز قبلا استفاده شده است. لطفا رمز جدید وارد کنید");
                }
            }
            var admin = await this.findById(id, {
                fromDb: true,
                projection: {
                    password: 1
                }
            });
            if (admin == null) {
                throw new Error("این ادمین یافت نشد");
            }
            var currentPassword = admin === null || admin === void 0 ? void 0 : admin.password;
        }
        catch (error) {
            throw error;
        }
        try {
            return await this.findByIdAndUpdate(id, {
                $set: {
                    password: password,
                    passwordLastChange: new Date(Date.now()),
                    changePassword: false
                },
                $push: {
                    passwords: currentPassword
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getProfile(id) {
        try {
            return await this.findById(id, {
                projection: {
                    _id: 1,
                    name: 1,
                    familyName: 1,
                    url: 1
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getSubPartActions(subPart) {
        try {
            return JSON.parse(JSON.stringify(await this.actionRepo.findAll({
                subPartName: subPart
            })));
        }
        catch (error) {
            throw error;
        }
    }
    async getSubPartSchemas(subPart) {
        try {
            return JSON.parse(JSON.stringify(await this.schemaRepo.findAll({
                subPart
            })));
        }
        catch (error) {
            throw error;
        }
    }
    async getAdminLists(id, data = []) {
        try {
            var admin = await this.findById(id);
            if (admin === null || admin === void 0 ? void 0 : admin.admins) {
                for (let i = 0; i < admin.admins.length; i++) {
                    var newAdmin = admin.admins[i].toHexString();
                    if (!data.includes(newAdmin)) {
                        data.push(newAdmin);
                        data = await this.getAdminLists(newAdmin, data);
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        return data;
    }
    async getActions(subPart, admin) {
        var _a;
        try {
            var adminInfo = await this.findById(admin);
            var role = adminInfo === null || adminInfo === void 0 ? void 0 : adminInfo.role;
            var actions = await this.getSubPartActions(subPart);
            var p = JSON.parse(JSON.stringify(await this.permissionRepo.findOneWithoutLead({
                admin
            }) || {}));
            var result = await this.roleRepo.getActions(subPart, role);
            for (let i = 0; i < actions.length; i++) {
                if ((_a = p === null || p === void 0 ? void 0 : p.allowedActions) === null || _a === void 0 ? void 0 : _a.includes(actions[i]._id)) {
                    let index = result.findIndex((value) => {
                        if (value.action._id == actions[i]._id)
                            return true;
                    });
                    result[index]['actionEnabled'] = true;
                }
            }
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async checkbeforeUpdateActions(admin, subPart, actions) {
        try {
            var adminInfo = await this.findById(admin);
            var role = adminInfo === null || adminInfo === void 0 ? void 0 : adminInfo.role;
            var rolePermisions = JSON.parse(JSON.stringify(await this.roleRepo.permissionRepo.findOne({ role })));
            var allowedActions = (rolePermisions === null || rolePermisions === void 0 ? void 0 : rolePermisions.allowedActions) || [];
            var finalActions = [];
            for (let i = 0; i < actions.length; i++) {
                if (!allowedActions.includes(actions[i])) {
                    finalActions.push(actions[i]);
                }
            }
        }
        catch (error) {
            throw error;
        }
        return finalActions;
    }
    async updateActions(subPart, admin, actions) {
        try {
            actions = await this.checkbeforeUpdateActions(admin, subPart, actions);
            var actionIds = (await this.getSubPartActions(subPart)).map((action, i) => {
                return action._id;
            });
            var toDeleteActions = actionIds.filter((value, index) => {
                return !actions.includes(value);
            });
            if (!await this.permissionRepo.isExists({ admin })) {
                await this.permissionRepo.insert({
                    admin,
                    allowedActions: actions
                });
            }
            else {
                await this.permissionRepo.updateOne({
                    admin
                }, {
                    $addToSet: {
                        allowedActions: actions
                    },
                });
                await this.permissionRepo.updateOne({
                    admin
                }, {
                    $pull: {
                        allowedActions: {
                            $in: toDeleteActions
                        }
                    }
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getAdminSchema(admin, schema, role) {
        try {
            let result = [];
            var roleSchema = await this.roleRepo.permissionRepo.findOne({
                role,
                "schemaFilter.dbSchema": schema
            }, {
                projection: {
                    "schemaFilter.$": 1
                }
            });
            result = (roleSchema === null || roleSchema === void 0 ? void 0 : roleSchema.schemaFilter[0].allowed) || [];
            var adminPermission = await this.permissionRepo.findOne({
                admin,
                "schemaFilter.dbSchema": schema
            }, {
                projection: {
                    "schemaFilter.$": 1
                }
            });
            result.push(...((adminPermission === null || adminPermission === void 0 ? void 0 : adminPermission.schemaFilter[0].allowed) || []));
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async getSchemas(subPart, admin) {
        var schemas = await this.getSubPartSchemas(subPart);
        var results = [];
        var adminInfo = await this.findById(admin);
        var role = (adminInfo === null || adminInfo === void 0 ? void 0 : adminInfo.role) || "";
        for (let i = 0; i < schemas.length; i++) {
            // if(role != undefined ){
            //     var rolePermission = await this.roleRepo.
            // }
            var schema = await this.roleRepo.permissionRepo.findOne({
                role,
                "schemaFilter.dbSchema": schemas[i]._id
            }, {
                projection: {
                    "schemaFilter.$": 1
                }
            });
            var fields = await this.getAdminSchema(admin, schemas[i]._id, role);
            if (schema != null) {
                schemas[i]['collectionSchema'] = this.getSchemaPermission(schemas[i]['collectionSchema'], fields);
            }
            else {
                results.push(schemas[i]);
            }
        }
        return schemas;
    }
    async isSchemaExists(collectionName) {
        var schema = await this.schemaRepo.findOne({
            collectionName
        });
        return schema != null;
    }
    async getSchemasByCollection(collectionName, admin, role) {
        var schema = await this.schemaRepo.findOne({
            collectionName
        });
        // console.log("schema" , schema)
        return this.getAdminSchema(admin, schema === null || schema === void 0 ? void 0 : schema._id.toHexString(), role);
    }
    preSetSchema(schema) {
        var _a;
        for (let key in schema) {
            if (((_a = schema[key]) === null || _a === void 0 ? void 0 : _a.canEdit) == true) {
                schema[key]["visible"] = "0";
                if (schema[key].sub) {
                    schema[key].sub = this.preSetSchema(schema[key].sub);
                }
            }
        }
        return schema;
    }
    makeAllVisible(schema) {
        var _a;
        for (let key in schema) {
            if (((_a = schema[key]) === null || _a === void 0 ? void 0 : _a.canEdit) == true) {
                schema[key]["visible"] = "1";
                if (schema[key].sub) {
                    schema[key].sub = this.makeAllVisible(schema[key].sub);
                }
            }
        }
        return schema;
    }
    getSchemaPermission(schema, fields) {
        var _a, _b;
        for (let key in schema) {
            if (((_a = schema[key]) === null || _a === void 0 ? void 0 : _a.canEdit) == true) {
                schema[key]["visible"] = "0";
                if (schema[key].sub) {
                    schema[key].sub = this.preSetSchema(schema[key].sub);
                }
            }
        }
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].includes(".")) {
                var key = fields[i].split(".")[0];
                var toCheckfields = fields.filter((field) => field.startsWith(key + ".")).map((val) => val.replace(key + ".", ""));
                schema[key].sub = this.getSchemaPermission(schema[key].sub, toCheckfields);
                schema[key].visible = "2";
                fields = fields.filter((field) => !field.startsWith(key + "."));
            }
        }
        for (let i = 0; i < fields.length; i++) {
            if (((_b = schema[fields[i]]) === null || _b === void 0 ? void 0 : _b.canEdit) == true) {
                schema[fields[i]]["visible"] = "1";
                if (schema[fields[i]].sub) {
                    schema[fields[i]].sub = this.makeAllVisible(schema[fields[i]].sub);
                }
            }
        }
        return schema;
    }
    async getDiffrenceSchema(admin, role, schema, fields) {
        var roleSchema = await this.roleRepo.permissionRepo.findOne({
            role,
            "schemaFilter.dbSchema": schema
        }, {
            projection: {
                "schemaFilter.$": 1
            }
        });
        var roleResult = (roleSchema === null || roleSchema === void 0 ? void 0 : roleSchema.schemaFilter[0].allowed) || [];
        fields = fields.filter((value) => !roleResult.includes(value));
        return fields;
    }
    async updateSchema(subPart, admin, schema, fields) {
        try {
            var adminInfo = await this.findById(admin);
            var role = (adminInfo === null || adminInfo === void 0 ? void 0 : adminInfo.role) || "";
            var fields = await this.getDiffrenceSchema(admin, role, schema, fields);
            if (!await this.permissionRepo.isExists({ admin })) {
                await this.permissionRepo.insert({
                    admin
                });
            }
            var isExists = await this.permissionRepo.isExists({
                admin,
                "schemaFilter.dbSchema": schema
            });
            if (isExists)
                return this.permissionRepo.updateOne({
                    admin,
                    "schemaFilter.dbSchema": schema
                }, {
                    $set: {
                        "schemaFilter.$.allowed": fields
                    }
                });
            return this.permissionRepo.updateOne({
                admin
            }, {
                $push: {
                    schemaFilter: {
                        dbSchema: schema,
                        allowed: fields
                    }
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getPermissionModuleAction(subPart, admin) {
        var _a;
        try {
            var isAdminPermissionExists = await this.permissionRepo.isExists({
                admin
            });
            if (!isAdminPermissionExists) {
                await this.permissionRepo.insert({
                    admin
                });
            }
            var adminInfo = await this.findById(admin);
            var role = (adminInfo === null || adminInfo === void 0 ? void 0 : adminInfo.role) || "";
            var moduleAction = await this.permissionRepo.findOne({
                admin,
                "moduleAction.subPart": subPart
            }, {
                projection: {
                    "moduleAction.$": 1
                }
            });
            let adminConfig = (moduleAction === null || moduleAction === void 0 ? void 0 : moduleAction.moduleAction[0]) || {
                config: {},
                subPart
            };
            let roleConfig = await this.roleRepo.getPermissionModuleAction(subPart, role);
            var result = {};
            for (const key in roleConfig.config) {
                result[key] = {};
                result[key].value = roleConfig.config[key];
                switch (typeof roleConfig.config[key]) {
                    case "boolean":
                        if (adminConfig.config[key])
                            result[key].value = true;
                        if (roleConfig.config[key]) {
                            result[key].fixedData = roleConfig.config[key];
                        }
                        break;
                    case "string":
                        if (adminConfig.config[key])
                            result[key].value = adminConfig.config[key];
                        result[key].fixedData = roleConfig.config[key];
                        break;
                    case "object":
                        if ((_a = adminConfig.config[key]) === null || _a === void 0 ? void 0 : _a.length) {
                            let adminlst = adminConfig.config[key];
                            let rolelst = roleConfig.config[key];
                            let newList = adminlst.filter((value) => {
                                return !rolelst.includes(value);
                            });
                            result[key].value.push(...newList);
                        }
                        result[key].fixedData = roleConfig.config[key];
                        break;
                    default:
                        break;
                }
            }
            return {
                subPart,
                config: result
            };
        }
        catch (error) {
            throw error;
        }
    }
    async setPermissionModuleAction(subPart, admin, config) {
        var _a;
        try {
            var isExists = await this.permissionRepo.isExists({
                admin,
                "moduleAction.subPart": subPart
            });
            var adminInfo = await this.findById(admin);
            var role = (adminInfo === null || adminInfo === void 0 ? void 0 : adminInfo.role) || "";
            let roleConfig = await this.roleRepo.getPermissionModuleAction(subPart, role);
            if ((0, isEqual_1.default)(roleConfig.config, {})) {
                let defaultConfig = this.roleRepo.actions[subPart];
                for (let i = 0; i < (defaultConfig === null || defaultConfig === void 0 ? void 0 : defaultConfig.length); i++) {
                    roleConfig.config[defaultConfig[i].name] = defaultConfig[i].value;
                }
                await this.roleRepo.setPermissionModuleAction(subPart, role, roleConfig.config);
            }
            var result = {};
            for (const key in roleConfig.config) {
                switch (typeof roleConfig.config[key]) {
                    case "boolean":
                        if (config[key])
                            result[key] = true;
                        break;
                    case "string":
                        if (config[key] && config[key] != roleConfig.config[key])
                            result[key] = config[key];
                        break;
                    case "object":
                        if ((_a = config[key]) === null || _a === void 0 ? void 0 : _a.length) {
                            let adminlst = config[key];
                            let rolelst = roleConfig.config[key];
                            let newList = adminlst.filter((value) => {
                                return !rolelst.includes(value);
                            });
                            result[key] = newList;
                        }
                        break;
                    default:
                        console.log("default", key);
                        break;
                }
            }
            if (!isExists) {
                return this.permissionRepo.updateOne({
                    admin
                }, {
                    $push: {
                        moduleAction: {
                            subPart,
                            config: result
                        }
                    }
                });
            }
            console.log("result", result);
            return this.permissionRepo.updateOne({
                admin,
                "moduleAction.subPart": subPart
            }, {
                $set: {
                    "moduleAction.$.config": result
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = AdminRepository;
