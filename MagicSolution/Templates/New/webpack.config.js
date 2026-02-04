
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function extend(applicationInstanceId, config) {
    return Object.assign({
        output: {
            path: path.resolve(__dirname, `./Views/${applicationInstanceId}/Js/react/build`),
            chunkFilename: '[chunkhash].js',
            filename: '[name].js',
            publicPath: `/Views/${applicationInstanceId}/Js/react/build/`
        },
        devtool: 'eval-source-map',
        module: {
            rules: [ 
                { 
                    loader: 'babel-loader', 
                    test: /\.jsx$/, 
                    exclude: /node_modules/,
                    query: {
                        presets: [
                            'env',
                            'react'
                        ],
                        plugins: [
                            require('babel-plugin-syntax-dynamic-import'),
                            require('babel-plugin-transform-object-rest-spread')
                        ]
                    }
                } 
            ] 
        }
    }, config);
}

const globalReactFolder = extend(0, {
    entry: {
        'react': 'react',
        'react-dom': 'react-dom',
        'babel-polyfill': 'babel-polyfill',
        'BOReader': './Magic/Views/Js/react/components/BOReader.jsx',
        'DocumentRepository': './Magic/Views/Js/react/DocumentRepository.jsx',
    },
    output: {
        path: path.resolve(__dirname, `./Magic/Views/Js/react/build`),
        chunkFilename: '[chunkhash].js',
        filename: '[name].js',
        publicPath: `Magic/Views/Js/react/build/`
    }
});

module.exports = [
    globalReactFolder,
];