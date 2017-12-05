#!/usr/bin/env node

const Helpers = require('./helpers');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const cache = require('./cache');
global.Helpers = Helpers;
const options = {};
const args = process.argv;

for(let i = 0; i < args.length; i++) {
    let arg = args[i];

    if(arg === '--templateFile' || arg === '-f') {
        options.template = args[++i];
    }
    else if(arg === '--outputFile' || arg === '-o') {
        options.output = args[++i];
    }
    else if(arg === '--watch' || arg === '-w') {
        options.watch = true;
    }
}

if(!options.template) {
    console.error('Template is required: --templateFile file.json');
    process.exit(1);
}

if(!fs.existsSync(options.template)) {
    console.error('Template does not exist');
    process.exit(1);
}

if(options.watch && !options.output) {
    console.error('Watch option requires an output file: --watch --outputFile template.json');
    process.exit(1);
}

options.template = path.resolve(options.template);
if(options.output)
    options.output = path.resolve(options.output);

async function start() {
    // delete the cache
    cache.clear();
    delete require.cache[options.template];
    const template = require(options.template);
    const output = await template();
    const json = JSON.stringify(output, null, 4);

    if(options.output) {
        fs.writeFile(options.output, json, (error, data) => {
            if(error)
                console.error(error);
            else
                console.log(`Completed! ${new Date()}`);
        });
    }
    else {
        console.log(json);
    }
}

if(options.watch) {
    const startDebounced = _.debounce(start, 500);

    fs.watch(options.template, startDebounced);
    fs.watch('./scripts', { recursive: true }, startDebounced);

    console.log('Watching files for changes...');
}
else {
    console.log('Starting template transpilation...');
    start();
}
