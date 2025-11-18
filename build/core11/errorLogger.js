"use strict";
// import SystemErrorLogRepository from "../services/repository/systemErrorLog"
// import SystemErrorLog from "../database/models/systemErrorLog"
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = logSystemError;
function logSystemError(helper) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        // const originalMethod = propertyDescriptor.value;
        // propertyDescriptor.value = async function (...args: any[]) {
        //     try {
        //         var result = await originalMethod.apply(this, args);
        //         return result;
        //     } catch (err) {
        //         await new SystemErrorLogRepository().insert(helper(err))
        //         throw err;
        //     }
        // };
        return propertyDescriptor;
    };
}
