var postcss = require("postcss");
var expect = require("chai").expect;
var fs = require("fs");
var plugin = require("../");

var test = function(input, output, opts, done) {
	postcss([plugin(opts)]).process(input).then(function(result) {
		expect(result.css).to.eql(output);
		expect(result.warnings()).to.be.empty;
		done();
	}).catch(function(error) {
		done(error);
	});
};

describe("import with media queries", function() {

	it("media query 1", function(done) {
		var input = "@import 'foo.css' (min-width: 25em);";
		var output = "@import 'foo.css' (min-width: 25em);";
		test(input, output, {}, done);
	});
		
});

describe("skip non remote files", function() {
	
	it("local", function(done) {
		test("@import 'a.css';", "@import 'a.css';", {}, done);
	});
	
	it("relative 1", function(done) {
		var input = "@import '../a.css'"; 
		test(input, input, {}, done);
	});
	
	it("relative 2", function(done) {
		var input = "@import './a.css'"; 
		test(input, input, {}, done);
	});
	
	// it("no protocol", function(done) {
	// 	var input = "@import url(//example.com/a.css)"; 
	// 	test(input, input, {}, done);
	// });
});

describe("import url tangerine", function() {
	
	var outputTangerine = fs.readFileSync(__dirname + "/tangerine.txt", {encoding: "utf8"});

	it("double quotes", function(done) {
		var input = "@import \"http://fonts.googleapis.com/css?family=Tangerine\";";
		test(input, outputTangerine, {}, done);
	});
	
	it("single quotes", function(done) {
		var input = "@import 'http://fonts.googleapis.com/css?family=Tangerine';";
		test(input, outputTangerine, {}, done);
	});
	
	it("url single quotes", function(done) {
		var input = "@import url('http://fonts.googleapis.com/css?family=Tangerine');";
		test(input, outputTangerine, {}, done);
	});
	
	it("url double quotes", function(done) {
		var input = "@import url(\"http://fonts.googleapis.com/css?family=Tangerine\");";
		test(input, outputTangerine, {}, done);
	});
	
	it("url no quotes", function(done) {
		var input = "@import url(http://fonts.googleapis.com/css?family=Tangerine);";
		test(input, outputTangerine, {}, done);
	});

});
