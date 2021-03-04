// const {VueLoaderPlugin} = require('vue-loader');

module.exports = {
	filenameHashing: false,
	lintOnSave: true,
	productionSourceMap: true,
	chainWebpack: config => {
		/* 移除 prefetch 插件（避免会预先加载模块/路由） */
		config.plugins.delete('prefetch');

		// Loader
		config.module
			.rule('svg')
			.test(/\.(swf|ttf|eot|svg|woff(2))(\?[a-z0-9]+)?$/)
			.use('file-loader')
			.loader('file-loader')
			.end();

		/* 开启图片压缩 */
		// config.module
		// 	.rule('images')
		// 	.test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
		// 	.use('image-webpack-loader')
		// 	.loader('image-webpack-loader')
		// 	.options({ bypassOnDebug: true });

		/* 添加分析工具 */
		if (process.env.NODE_ENV === 'production') {
			if (process.env.npm_config_report) {
				config
					.plugin('webpack-bundle-analyzer')
					// eslint-disable-next-line global-require
					.use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
					.end();
				config.plugins.delete('prefetch');
			}
		}
	},
	configureWebpack: {
		resolve: {
			alias: {
				src: '@',
				components: '@/components',
				views: '@/views',
			},
		}
	},
	pages: {
		index: {
			entry: "src/main.js",
			title: "[:Title:]"
		}
	}
};