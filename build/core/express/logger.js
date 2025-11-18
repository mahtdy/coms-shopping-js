"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
function logAction(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        try {
            var res = args[1];
            // var { send } = res;
            // res.send =  (data)=> {
            //     console.log(data, new Date())
            //     // res.resp = data
            //      return this
            // };
            res = await originalMethod.apply(this, args);
            return res;
        }
        catch (err) {
            throw err;
        }
    };
    return propertyDescriptor;
}
