var glob, babel, write, pipeline, mocha;

module.exports = function(pipelines) {
	pipelines.build = [
		glob({
			basePath: "src"
		}, "*.js"),
		babel({
			modules: "common"
		}),
		write(".")
	];

	pipelines["tests"] = [
		pipeline("build"),
		pipeline({
			activate: true
		}, "mocha")
	];

	pipelines.explicit.mocha = [mocha({
		reporter: "min",
		files: "test/*.js"
	})];
};