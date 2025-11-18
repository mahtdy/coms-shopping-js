"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../action/repository"));
const repository_3 = __importDefault(require("../dbSchema/repository"));
const repository_4 = __importDefault(require("../rolePermission/repository"));
const model_1 = require("./model");
class RoleRepository extends repository_1.default {
    constructor(options) {
        super(model_1.RoleModel, options);
        this.actions = options.actions;
        this.permissionRepo = new repository_4.default();
        this.actionRepo = new repository_2.default();
        this.schemaRepo = new repository_3.default();
        this.setPopulation([{
                path: "parent"
            }]);
    }
    async insert(document) {
        var role = await super.insert(document);
        try {
            this.permissionRepo.insert({
                role,
            });
        }
        catch (error) {
        }
        return role;
    }
    async merge(roles, role) {
        try {
            var r = await this.insert(role);
            var actions = [];
            var schemas = [];
            var rolePermisions = await this.permissionRepo.findAll({
                role: {
                    $in: roles
                }
            });
            for (let i = 0; i < rolePermisions.length; i++) {
                var thisactions = rolePermisions[i].allowedActions;
                var thisschemas = rolePermisions[i].schemaFilter;
                for (let j = 0; j < thisactions.length; j++) {
                    if (!actions.includes(thisactions[j].toHexString())) {
                        actions.push(thisactions[j].toHexString());
                    }
                }
                for (let j = 0; j < thisschemas.length; j++) {
                    let index = schemas.findIndex((value, ind) => {
                        if (value.dbSchema == thisschemas[j].dbSchema.toHexString())
                            return true;
                    });
                    if (index == -1) {
                        schemas.push({
                            dbSchema: thisschemas[j].dbSchema.toHexString(),
                            allowed: thisschemas[j].allowed
                        });
                    }
                    else {
                        var thisalowed = schemas[index].allowed;
                        for (let z = 0; z < thisschemas[j].allowed.length; z++) {
                            if (!thisalowed.includes(thisschemas[j].allowed[z])) {
                                thisalowed.push(thisschemas[j].allowed[z]);
                            }
                        }
                        schemas[index].allowed = thisalowed;
                    }
                }
            }
            await this.permissionRepo.updateOne({
                role: r._id
            }, {
                $set: {
                    allowedActions: actions,
                    schemaFilter: schemas
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
    async getActions(subPart, role) {
        var _a;
        try {
            var actions = await this.getSubPartActions(subPart);
            var p = JSON.parse(JSON.stringify(await this.permissionRepo.findOneWithoutLead({
                role
            }) || {}));
            var result = [];
            for (let i = 0; i < actions.length; i++) {
                if ((_a = p === null || p === void 0 ? void 0 : p.allowedActions) === null || _a === void 0 ? void 0 : _a.includes(actions[i]._id)) {
                    result.push({
                        actionEnabled: true,
                        action: actions[i]
                    });
                }
                else {
                    result.push({
                        actionEnabled: false,
                        action: actions[i]
                    });
                }
            }
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async updateActions(subPart, role, actions) {
        try {
            var actionIds = (await this.getSubPartActions(subPart)).map((action, i) => {
                return action._id;
            });
            var toDeleteActions = actionIds.filter((value, index) => {
                return !actions.includes(value);
            });
            if (!await this.permissionRepo.isExists({ role })) {
                await this.permissionRepo.insert({
                    role,
                    allowedActions: actions
                });
            }
            else {
                await this.permissionRepo.updateOne({
                    role
                }, {
                    $addToSet: {
                        allowedActions: actions
                    },
                });
                await this.permissionRepo.updateOne({
                    role
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
    async getSchemas(subPart, role) {
        var schemas = await this.getSubPartSchemas(subPart);
        var results = [];
        for (let i = 0; i < schemas.length; i++) {
            var schema = await this.permissionRepo.findOne({
                role,
                "schemaFilter.dbSchema": schemas[i]._id
            }, {
                projection: {
                    "schemaFilter.$": 1
                }
            });
            if (schema != null) {
                schemas[i]['collectionSchema'] = this.getSchemaPermission(schemas[i]['collectionSchema'], schema === null || schema === void 0 ? void 0 : schema.schemaFilter[0].allowed);
            }
            else {
                results.push(schemas[i]);
            }
            // return  schema
            schemas[i];
        }
        return schemas;
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
            }
            if (schema[key].sub) {
                schema[key].sub = this.preSetSchema(schema[key].sub);
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
    async updateSchema(subPart, role, schema, fields) {
        try {
            var isExists = await this.permissionRepo.isExists({
                role,
                "schemaFilter.dbSchema": schema
            });
            if (isExists)
                return this.permissionRepo.updateOne({
                    role,
                    "schemaFilter.dbSchema": schema
                }, {
                    $set: {
                        "schemaFilter.$.allowed": fields
                    }
                });
            return this.permissionRepo.updateOne({
                role
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
    async getPermissionModuleAction(subPart, role) {
        try {
            var moduleAction = await this.permissionRepo.findOne({
                role,
                "moduleAction.subPart": subPart
            }, {
                projection: {
                    "moduleAction.$": 1
                }
            });
            return (moduleAction === null || moduleAction === void 0 ? void 0 : moduleAction.moduleAction[0]) || {
                config: {},
                subPart
            };
        }
        catch (error) {
            throw error;
        }
    }
    async setPermissionModuleAction(subPart, role, config) {
        try {
            var isExists = await this.permissionRepo.isExists({
                role,
                "moduleAction.subPart": subPart
            });
            if (!isExists) {
                return this.permissionRepo.updateOne({
                    role
                }, {
                    $push: {
                        moduleAction: {
                            subPart,
                            config
                        }
                    }
                });
            }
            return this.permissionRepo.updateOne({
                role,
                "moduleAction.subPart": subPart
            }, {
                $set: {
                    "moduleAction.$.config": config
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getRoles(id) {
        var data = [];
        try {
            var childes = await this.findAll({
                parent: id
            });
            for (let i = 0; i < childes.length; i++) {
                data.push(childes[i]._id.toHexString());
                data.push(...await this.getRoles(childes[i]._id.toHexString()));
            }
        }
        catch (error) {
            throw error;
        }
        return data;
    }
}
exports.default = RoleRepository;
