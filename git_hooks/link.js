/*jshint node: true */

'use strict';

var fs = require('fs');
var path = require('path');

var hooks = [
    'applypatch-msg',
    'commit-msg',
    'post-commit',
    'post-receive',
    'post-update',
    'pre-applypatch',
    'pre-commit',
    'pre-rebase',
    'prepare-commit-msg',
    'update'
];

hooks.forEach(function (hook) {
    var hookInSourceControl = path.resolve(__dirname, hook);

    if (fs.existsSync(hookInSourceControl)) {
        var hookInHiddenDirectory = path.resolve(
            __dirname,
            '..',
            '.git',
            'hooks',
            hook
        );

        if (fs.existsSync(hookInHiddenDirectory)) {
            fs.unlinkSync(hookInHiddenDirectory);
        }

        fs.linkSync(hookInSourceControl, hookInHiddenDirectory);
    }
});
