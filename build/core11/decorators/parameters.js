"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.setMeta = setMeta;
exports.Body = Body;
exports.Files = Files;
exports.Query = Query;
exports.Param = Param;
exports.Res = Res;
exports.Req = Req;
exports.Next = Next;
exports.Session = Session;
exports.IP = IP;
exports.Header = Header;
exports.Admin = Admin;
exports.User = User;
exports.FromReq = FromReq;
require("reflect-metadata");
function POST(str) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            try {
                var result = await originalMethod.apply(this, args);
                return result;
            }
            catch (err) {
                throw err;
            }
        };
        return propertyDescriptor;
    };
}
function setMeta(meta, confs) {
    if (!confs["params"]) {
        confs.params = {};
    }
    if (meta.source == "files") {
        if (!confs.files) {
            confs.files = [];
        }
        confs.files.push(meta.config);
    }
    confs['params'][meta.index + 1] = {
        "source": meta.source,
        "destination": meta.destination,
        "schema": meta.schema,
        "config": meta.config,
        "parseJson": meta.parseJson,
        "isArray": meta.isArray,
        "required": meta.required
    };
    return confs;
}
function Body(options) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        // console.log(options.parseJson)
        confs = setMeta({
            index: parameterIndex,
            source: "body",
            destination: options.destination,
            schema: options.schema,
            exclude: options.exclude,
            parseJson: options.parseJson,
            isArray: options.isArray
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Files(options) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "files",
            "config": Object.assign(options.config || {}, { "mapToBody": options.mapToBody, "moveFilesToCDN": options.moveFilesToCDN, "isOptional": options.isOptional, "skip": options.skip }),
            destination: options.destination,
            schema: options.schema
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Query(options) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "query",
            destination: options.destination,
            schema: options.schema
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Param(options) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "param",
            destination: options.destination,
            schema: options.schema
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Res() {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "res"
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Req() {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "req"
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Next() {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "next"
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Session() {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "session"
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function IP() {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "ip"
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Header(destination) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "header",
            destination
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function Admin() {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        // if (propertyKey == "getPaginationConfig")
        //     console.log("c", propertyKey, target.constructor.name)
        confs = setMeta({
            index: parameterIndex,
            source: "admin"
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function User(options) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "user",
            required: options === null || options === void 0 ? void 0 : options.required
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function FromReq(destination) {
    return (target, propertyKey, parameterIndex) => {
        var confs = getMeta(propertyKey, target);
        confs = setMeta({
            index: parameterIndex,
            source: "fromReq",
            destination
        }, confs);
        defineMeta(propertyKey, confs, target);
    };
}
function getMeta(propertyKey, target) {
    var confs = Reflect.getMetadata(propertyKey + target.constructor.name, target) || {};
    return confs;
}
function defineMeta(propertyKey, confs, target) {
    Reflect.defineMetadata(propertyKey + target.constructor.name, confs, target);
}
