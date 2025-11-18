"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("./mongoose-controller/repositories/apiKey/repository"));
var apiKeyRepo = new repository_1.default();
class Permission {
    static CheckPermit(checkList) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                try {
                    for (let i = 0; i < checkList.length; i++) {
                        var funcArgs = [];
                        var argss = checkList[i].args;
                        for (let j = 0; j < argss.length; j++) {
                            if (argss[j].index) {
                                funcArgs.push(args[argss[j].index]);
                            }
                            if (argss[j].value) {
                                funcArgs.push(argss[j].value);
                            }
                        }
                        if (await checkList[i].func.apply(this, funcArgs) == false) {
                            return {
                                status: 401,
                                message: "not access"
                            };
                        }
                    }
                    var result = await originalMethod.apply(this, args);
                    return result;
                }
                catch (err) {
                    throw err;
                }
            };
            Object.defineProperty(descriptor.value, 'name', {
                writable: true,
                value: propertyKey
            });
            return descriptor;
        };
    }
    static APIKeyResover(index, partition, operatin, ipIndex) {
        return {
            func: Permission.checkExistsAPIKey,
            args: [
                {
                    index
                },
                {
                    value: partition
                },
                {
                    value: operatin
                },
                {
                    index: ipIndex
                }
            ]
        };
    }
    static checkExists(arg) {
        return arg != undefined;
    }
    static async checkExistsRepo(repo, query) {
        return await repo.isExists(query);
    }
    static async checkExistsAPIKey(apiKey, partition, operatin, ip) {
        return await apiKeyRepo.isExists({
            token: {
                $eq: apiKey
            },
            $and: [
                {
                    $or: [
                        {
                            "permission.partition": partition,
                            "permission.type": "any"
                        },
                        {
                            permission: {
                                $elemMatch: {
                                    partition,
                                    "permissionData.actions": operatin
                                }
                            }
                        }
                    ],
                },
                {
                    $or: [
                        {
                            permission: {
                                $elemMatch: {
                                    partition,
                                    ips: {
                                        $size: 0
                                    }
                                }
                            }
                        },
                        {
                            permission: {
                                $elemMatch: {
                                    partition,
                                    ips: ip
                                }
                            }
                        }
                    ],
                }
            ]
        });
    }
    static async queryMaker(query, values) {
        for (let i = 0; i < values.length; i++) {
            var map = values[i].map;
            var maps = map.split(".");
            var value = values[i].value;
            query = this.setData(query, maps, value);
        }
        return query;
    }
    static setData(query, maps, value) {
        if (maps.length == 0)
            return value;
        var map = maps.shift();
        query[map] = this.setData(query[map], maps, value);
        return query;
    }
}
exports.default = Permission;
