"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
class Terminal {
    static async execute(command) {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    console.error(`Error executing command: ${error.message}`, error);
                    console.log(stdout, stderr);
                }
                else {
                    resolve({});
                }
            });
        });
    }
}
exports.default = Terminal;
