var Siteswap = require('./build/Siteswap.js');
var assert = require("assert");

describe('Syntax', function(){

	describe('Invalid syntax', function(){
		it('should return false for valid syntax', function(){
			var s = Siteswap.CreateSiteswap('BadTest',{validationOnly: true});
			assert.equal(s.validSyntax, false);
		});
	});

	describe('Vanilla', function(){
		it('should return true for valid syntax', function(){
			var s = Siteswap.CreateSiteswap('97531',{validationOnly: true});
			assert.equal(s.validSyntax, true);
		});
	});

	describe('Vanilla with hand override', function(){
		it('should return true for valid syntax', function(){
			var s = Siteswap.CreateSiteswap('R3L3',{validationOnly: true});
			assert.equal(s.validSyntax, true);
		});
	});	

	describe('Multiplex', function(){
		it('should return true for multiplex', function(){
			var s = Siteswap.CreateSiteswap('33[33]',{validationOnly: true});
			assert.equal(s.multiplex, true);
		});
	});

	/* this tests a current bug */
	/*
	describe('Bad Multiplex', function(){
		it('should return false for multiplex with only one toss in it', function(){
			var s = Siteswap.CreateSiteswap('33[3]');
			assert.equal(s.multiplex, false);
		});
	});
	*/

	describe('Sync', function(){
		it('should return true for sync', function(){
			var s = Siteswap.CreateSiteswap('(4,4)',{validationOnly: true});
			assert.equal(s.sync, true);
		});
	});

	describe('Pass', function(){
		it('should return true for pass', function(){
			var s = Siteswap.CreateSiteswap('<5P|5P>',{validationOnly: true});
			assert.equal(s.pass, true);
		});
	});

	describe('Max toss', function(){
		it('should return true for max toss', function(){
			var s = Siteswap.CreateSiteswap('o',{validationOnly: true});
			assert.equal(s.validSyntax, true);
		});
	});

	describe('Multiple multiplex sync', function(){
		it('should return true for max toss', function(){
			var s = Siteswap.CreateSiteswap('([44],[44])',{validationOnly: true});
			assert.equal(s.validSyntax, true);
			assert.equal(s.sync, true);
			assert.equal(s.multiplex, true);
		});
	});	

});

describe('Pattern properties', function(){

	describe('Number of jugglers', function(){
		it('"5" should return 1 for number of jugglers', function(){    	
			var s = Siteswap.CreateSiteswap('5',{validationOnly: true});
			assert.equal(s.numJugglers, 1);
		});

		it('"<5P|5P>" should return 2 for number of jugglers', function(){    	
			var s = Siteswap.CreateSiteswap('<5P|5P>',{validationOnly: true});
			assert.equal(s.numJugglers, 2);
		});

		it('"<5P2|5P3|5P1>" should return 3 for number of jugglers', function(){    	
			var s = Siteswap.CreateSiteswap('<5P2|5P3|5P1>',{validationOnly: true});
			assert.equal(s.numJugglers, 3);
		});
	});

	describe('Number of props', function(){
		it('"5" should return 5', function(){    	
			var s = Siteswap.CreateSiteswap('5',{validationOnly: true});
			assert.equal(s.numProps, 5);
		});

		it('"b97531" should return 6', function(){    	
			var s = Siteswap.CreateSiteswap('b97531',{validationOnly: true});
			assert.equal(s.numProps, 6);
		});

		it('"33[33]" should return 4', function(){    	
			var s = Siteswap.CreateSiteswap('33[33]',{validationOnly: true});
			assert.equal(s.numProps, 4);
		});

		it('"(4,4)(4x,4x)" should return 4', function(){    	
			var s = Siteswap.CreateSiteswap('(4,4)(4x,4x)',{validationOnly: true});
			assert.equal(s.numProps, 4);
		});

		/* this is currently a bug */
		// it('"<(4,4)|a>" should return 14', function(){    	
		// 	var s = Siteswap.CreateSiteswap('<(4,4)|a>');
		// 	assert.equal(s.numProps, 14);
		// });
	});	

	describe('Max height', function(){
		it('"5" should return 5', function(){    	
			var s = Siteswap.CreateSiteswap('5',{validationOnly: true});
			assert.equal(s.maxHeight, 5);
		});

		it('"a" should return 10', function(){    	
			var s = Siteswap.CreateSiteswap('a',{validationOnly: true});
			assert.equal(s.maxHeight, 10);
		});		
	});

});

describe('Valid pattern check', function(){

	describe('Valid vanilla pattern', function(){
		it('"531" should be valid', function(){    	
			var s = Siteswap.CreateSiteswap('531',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});

	describe('Valid synchronous pattern', function(){
		it('"(4,2x)(2x,4)" should be valid', function(){    	
			var s = Siteswap.CreateSiteswap('(4,2x)(2x,4)',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});	

	describe('Valid multiplex pattern', function(){
		it('"24[54]" should be valid', function(){    	
			var s = Siteswap.CreateSiteswap('24[54]',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});

	describe('Valid passing pattern', function(){
		it('"<5|5><5P|5P>" should be valid', function(){    	
			var s = Siteswap.CreateSiteswap('<5|5><5P|5P>',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});

	describe('Sync with alpha', function(){
		it('should return true for sync', function(){
			var s = Siteswap.CreateSiteswap('(a,2)',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});

	describe('Max toss', function(){
		it('should return true for max toss', function(){
			var s = Siteswap.CreateSiteswap('o',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});

	describe('Multiple multiplex sync', function(){
		it('should return true for max toss', function(){
			var s = Siteswap.CreateSiteswap('([44],[44])',{validationOnly: true});
			assert.equal(s.validPattern, true);
		});
	});	

});

describe('Invalid pattern check', function(){

	describe('Invalid vanilla pattern', function(){
		it('"543" should be invalid', function(){    	
			var s = Siteswap.CreateSiteswap('543',{validationOnly: true});
			assert.equal(s.validPattern, false);
		});
	});

	describe('Invalid synchronous pattern', function(){
		it('"(4,2x)(4,2x)" should be invalid', function(){    	
			var s = Siteswap.CreateSiteswap('(4,2x)(4,2x)',{validationOnly: true});
			assert.equal(s.validPattern, false);
		});
	});	

	describe('Invalid multiplex pattern', function(){
		it('"43[33]2" should be invalid', function(){    	
			var s = Siteswap.CreateSiteswap('43[33]2',{validationOnly: true});
			assert.equal(s.validPattern, false);
		});
	});

	describe('Invalid passing pattern', function(){
		it('"<5P|5><5P|5P>" should be invalid', function(){    	
			var s = Siteswap.CreateSiteswap('<5P|5><5P|5P>',{validationOnly: true});
			assert.equal(s.validPattern, false);
		});
	});

});

describe('Spin modifiers', function() {

	describe('Default spins', function() {
		it('"531" should spin 2, 1 and 0 times', function() {
			var s = Siteswap.CreateSiteswap('531',{validationOnly: true, props:[{type: 'club', radius: .05, C: .95}]});
			assert.equal(Math.floor(s.tosses[0][0].numSpins),2);
			assert.equal(Math.floor(s.tosses[1][0].numSpins),1);
			assert.equal(Math.floor(s.tosses[2][0].numSpins),0);
		});
	});

	describe('User defined spins', function () {
		it('"5S03S11S2" should spin 0, 1 and 2 times', function() {
			var s = Siteswap.CreateSiteswap('5S{0}3S{1}1S{2}',{validationOnly: true});
			assert.equal(s.tosses[0][0].numSpins,0);
			assert.equal(s.tosses[1][0].numSpins,1);
			assert.equal(s.tosses[2][0].numSpins,2);
		});

	});

});

describe('Bounce modifiers', function() {

	describe('Default bouncing', function() {
		it('"5B" should bounce once', function() {
			var s = Siteswap.CreateSiteswap('5B',{validationOnly: true});
			assert.equal(s.tosses[0][0].numBounces,1);
		});
	});

	describe('Num bounces', function() {
		it('"5B{1}" should bounce once', function() {
			var s = Siteswap.CreateSiteswap('5B{1}',{validationOnly: true});
			assert.equal(s.tosses[0][0].numBounces,1);
		});
	});

	describe('Bounce order', function() {
		it('"5B{10}" should bounce once', function() {
			var s = Siteswap.CreateSiteswap('5B{1}',{validationOnly: true});
			assert.equal(s.tosses[0][0].numBounces,1);
			assert.equal(s.tosses[0][0].bounceOrder[0],0);
		});
	});

});