"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parser;
function parser(name) {
    return (req, res, next) => {
        try {
            req.body[name] = JSON.parse(req.body[name]);
        }
        catch (error) {
        }
        next();
    };
}
