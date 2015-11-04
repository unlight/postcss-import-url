var glob, babel, write, pipeline, mocha, process;

module.exports = function(pipelines) {
	pipelines["build"] = [
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

	pipelines["eslint"] = [
		process("eslint.cmd src")
	];

	pipelines.explicit.mocha = [mocha({
		reporter: "spec",
		files: "test/*.js"
	})];
};