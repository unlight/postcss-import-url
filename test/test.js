var postcss = require("postcss");
var expect = require("chai").expect;
var fs = require("fs");
var plugin = require("../");
var tcpp = require('tcp-ping');

var outputTangerine = fs.readFileSync(__dirname + "/tangerine.txt", {
	encoding: "utf8"
});

var testEqual = function(input, output, opts, done) {
	postcss([plugin(opts)]).process(input).then(function(result) {
		expect(result.css).to.eql(output);
		expect(result.warnings()).to.be.empty;
		done();
	}).catch(function(error) {
		done(error);
	});
};

var testContains = function(input, value, opts, done) {
	postcss([plugin(opts)]).process(input).then(function(result) {
		expect(result.css).to.contain(value);
		expect(result.warnings()).to.be.empty;
		done();
	}).catch(function(error) {
		done(error);
	});
};

describe("import with media queries", function() {

	it("empty", function(done) {
		var input = "@import 'http://fonts.googleapis.com/css?family=Tangerine'            ;";
		testEqual(input, outputTangerine, {}, done);
	});

	it("only screen", function(done) {
		var input = "@import 'http://fonts.googleapis.com/css?family=Tangerine' only screen and (color)";
		testContains(input, "@media only screen and (color)", {}, done);
	});

	it("rule with and", function(done) {
		var input = "@import 'http://fonts.googleapis.com/css?family=Tangerine' screen and (orientation:landscape)";
		testContains(input, "@media screen and (orientation:landscape)", {}, done);
	});

	it("rule projection, tv", function(done) {
		var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine') projection, tv";
		testContains(input, "@media projection, tv", {}, done);
	});

	it("rule print", function(done) {
		var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine') print";
		testContains(input, "@media print", {}, done);
	});

	it("contains it", function(done) {
		var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine') (min-width: 25em);";
		testContains(input, "(min-width: 25em)", {}, done);
	});

	describe("media query", function() {

		it("contains font-family", function(done) {
			var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine') (min-width: 25em);";
			testContains(input, "font-family: 'Tangerine'", {}, done);
		});

		it("contains src local", function(done) {
			var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine') (min-width: 25em);";
			testContains(input, "src: local('Tangerine')", {}, done);
		});
	});

});

describe("skip non remote files", function() {

	it("local", function(done) {
		testEqual("@import 'a.css';", "@import 'a.css';", {}, done);
	});

	it("relative parent", function(done) {
		var input = "@import '../a.css'";
		testEqual(input, input, {}, done);
	});

	it("relative child", function(done) {
		var input = "@import './a/b.css'";
		testEqual(input, input, {}, done);
	});

	// it("no protocol", function(done) {
	// 	var input = "@import url(//example.com/a.css)"; 
	// 	test(input, input, {}, done);
	// });
});

describe("import url tangerine", function() {

	it("double quotes", function(done) {
		var input = "@import \"http://fonts.googleapis.com/css?family=Tangerine\";";
		testEqual(input, outputTangerine, {}, done);
	});

	it("single quotes", function(done) {
		var input = "@import 'http://fonts.googleapis.com/css?family=Tangerine';";
		testEqual(input, outputTangerine, {}, done);
	});

	it("url single quotes", function(done) {
		var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine');";
		testEqual(input, outputTangerine, {}, done);
	});

	it("url double quotes", function(done) {
		var input = "@import url(\"http://fonts.googleapis.com/css?family=Tangerine\");";
		testEqual(input, outputTangerine, {}, done);
	});

	it("url no quotes", function(done) {
		var input = "@import url(http://fonts.googleapis.com/css?family=Tangerine);";
		testEqual(input, outputTangerine, {}, done);
	});

});

describe("recursive import", function() {

	it('ping server', (done) => {
		tcpp.probe('localhost', 1234, function(err, available) {
			done(err);
		});
	});

	var opts = {
		recursive: true
	};

	describe("fixture-1", function() {

		it("fixture-1 contains class a1", function(done) {
			var input = '@import url(http://localhost:1234/fixture-1/style.css)';
			testContains(input, 'content: ".a1"', opts, done);
		});

		it("fixture-1 contains class a", function(done) {
			var input = '@import url(http://localhost:1234/fixture-1/style.css)';
			testContains(input, 'content: ".a"', opts, done);
		});

		it("fixture-1 contains class style content", function(done) {
			var input = '@import url(http://localhost:1234/fixture-1/style.css)';
			testContains(input, 'content: ".style"', opts, done);
		});
	});

	describe("fixture-2", function() {

		it("fixture-2 contains class a1", function(done) {
			var input = '@import url(http://localhost:1234/fixture-2/style.css)';
			testContains(input, 'content: ".a1"', opts, done);
		});

		it("fixture-2 contains class a", function(done) {
			var input = "@import url(http://localhost:1234/fixture-2/style.css)";
			testContains(input, 'content: ".a"', opts, done);
		});

		it("fixture-2 contains class b1", function(done) {
			var input = "@import url(http://localhost:1234/fixture-2/style.css)";
			testContains(input, 'content: ".b1"', opts, done);
		});

		it("fixture-2 contains class b", function(done) {
			var input = "@import url(http://localhost:1234/fixture-2/style.css)";
			testContains(input, 'content: ".b"', opts, done);
		});

		it("fixture-2 contains class style content", function(done) {
			var input = "@import url(http://localhost:1234/fixture-2/style.css)";
			testContains(input, 'content: ".style"', opts, done);
		});
	});

});