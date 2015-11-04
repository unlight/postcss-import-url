var glob, babel, write, pipeline, mocha, process;

module.exports = function(pipelines) {
	pipelines.build = [
		glob({
			basePath: "src"
		}, "*.js"),
		babel({
			modules: "common"
		}),
		write("."),
		pipeline("eslint")
	];

	pipelines["eslint"] = [
		process("eslint.cmd src")
	];

	pipelines["tests"] = [
		pipeline("build"),
		pipeline({
			activate: true
		}, "mocha")
	];

	pipelines.explicit.mocha = [mocha({
		reporter: "spec",
		files: "test/*.js"
	})];
};