var fs = require('fs'),
    Q = require('q'),
    bemUtil = require('bem/lib/util'),
    Template = require('bem/lib/template');

exports.techMixin = {

    getBuildResultChunk: function (relPath, path) {
        return fs.readFileSync(path) + '\n\n';
    },

    getCreateResult: function (path, suffix, vars) {

        vars.Selector = vars.BlockName +
            (vars.ElemName ? '__' + vars.ElemName : '') +
            (vars.ModVal ? '_' + vars.ModName + '_' + vars.ModVal : '');

        return Template.process([
            "$blocks['{{bemSelector}}'] = function ($data, $view, $blocks) {",
            '};'],
            vars);
    },

    getSuffixes: function () {
        return ['html.php'];
    },

    storeBuildResult: function (path, suffix, res) {

        var blockName;
        try {
            blockName = fs.readFileSync(path.replace(suffix, 'bemjson.js')).match(/block:.*?'(.*?)',/)[1];
        } catch (e) {
        }
        blockName = blockName || 'b-page';
        res = [
            '<?php',
            'function data_to_html($data, $view, $path, $block){',
            '   $blocks = [];',
            res.join('').replace(/<\?php/g, ''),
            '   $bemjson = $blocks[$block]($data, $view, $blocks);',
            "   $vjs = new V8js();",
            '   return $vjs->executeString( file_get_contents($path) . "BEMHTML.apply(" . json_encode($bemjson) . ");");',
            '}',
            'echo data_to_html($data, $view, "' + path.replace(suffix, 'bemhtml.js') + '", "' + blockName + '");'
        ].join('\n');

        return bemUtil.writeFile(path, res);
    }
};
