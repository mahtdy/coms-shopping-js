"use strict";
// export enum ParameterType {
//     REQUEST,
//     RESPONSE,
//     PARAMS,
//     QUERY,
//     BODY,
//     HEADERS,
//     COOKIES,
//     NEXT
// }
// function decoratorFactory(type: ParameterType) {
//     return function (name?: string): ParameterDecorator {
//         return function (target: object, methodName: string, index: number) {
//             const meta: any = {}
//             if (meta.params[methodName] === undefined) {
//                 meta.params[methodName] = [];
//             }
//             meta.params[methodName].push({ index, type, name });
//         };
//     };
// }
// export const Req = decoratorFactory(ParameterType.REQUEST);
// export const Res = decoratorFactory(ParameterType.RESPONSE);
// export const Next = decoratorFactory(ParameterType.NEXT);
// export const Params = decoratorFactory(ParameterType.PARAMS);
