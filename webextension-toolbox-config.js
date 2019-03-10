const { resolve } = require('path');
const GlobEntriesPlugin = require('webpack-watched-glob-entries-plugin');
const WebextensionPlugin = require('webpack-webextension-plugin');
const sourceList = require('./app/scripts/handlers/sourceList');

module.exports = {
    webpack: (config, { dev, vendor }) => {
        // Add typescript loader. supports .ts and .tsx files as entry points
        config.resolve.extensions.push('.ts');
        config.resolve.extensions.push('.tsx');
        config.entry = GlobEntriesPlugin.getEntries(
            [
                resolve('app', '*.{js,mjs,jsx,ts,tsx}'),
                resolve('app', '?(scripts)/*.{js,mjs,jsx,ts,tsx}')
            ]
        );

        config.module.rules.push({
            test: /\.tsx?$/,
            loader: 'ts-loader'
        });

        config.module.rules.push({
            test: /\.js.map$/,
            loader: 'ignore-loader'
        });

        // Inject the URL's for our individual page handlers
        const domainList = Object.keys(sourceList).map(domain => `*://${domain}/*`);
        config.plugins.forEach(plugin => {
            if (plugin instanceof WebextensionPlugin) {
                plugin.manifestDefaults = {
                    ...plugin.manifestDefaults,
                    content_scripts: [
                        {
                            matches: domainList,
                            css: [
                                'styles/contentscript.css'
                            ],
                            js: [
                                'scripts/contentscript.js'
                            ],
                            run_at: 'document_idle',
                            all_frames: false
                        }
                    ],
                    permissions: [
                        'storage',
                        'activeTab',
                        'https://api.openraadsinformatie.nl/*'
                    ].concat(domainList)
                };
            }
        });

        return config;
    },
    copyIgnore: [ '**/*.js', '**/*.json', '**/*.ts', '**/*.tsx' ]
};