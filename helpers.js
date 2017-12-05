const readline = require('readline');
const fs = require('fs');
const _ = require('lodash');
const cache = require('./cache');

function getFileLines(file) {
    return new Promise((resolve, reject) => {
        const lines = [];

        const rl = readline.createInterface({
            input: fs.createReadStream(file),
            crlfDelay: Infinity,
        });

        rl.on('line', line => lines.push(line));
        rl.on('close', () => resolve(lines));
    });
}

async function UserData(files, options = {}) {
    const params = options.Params || {};
    let lines = [];
    let newLines;

    for(let file of files) {
        const cachedData = cache.get(file);

        if(cachedData) {
            newLines = cachedData;
        }
        else {
            newLines = await getFileLines(file);
            cache.set(file, newLines);
        }

        lines = [...lines, ...newLines];
    }

    lines = _.flatMap(lines, line => {
        let match;

        if(match = line.match(/=@RefParam\(([^()]+)\)/)) {
            let command = line.match(/^.+=@RefParam/);
            command = command[0].replace('@RefParam', "'");

            return [
                command,
                {
                    Ref: params[match[1]] || '',
                },
                "'\n",
            ];
        }
        else if(match = line.match(/=@Ref\(([^()]+)\)/)) {
            let command = line.match(/^.+=@Ref/);
            command = command[0].replace('@Ref', "'");

            return [
                command,
                {
                    Ref: match[1],
                },
                "'\n",
            ];
        }
        else if(match = line.match(/=@Param\(([^()]+)\)/)) {
            return line.replace(/@Param\(.+\)/, `'${params[match[1]]}'\n`);
        }

        return `${line} \n`;
    });

    return { 'Fn::Base64': { 'Fn::Join': ["", lines] } };
}

module.exports = {
    UserData,
};
