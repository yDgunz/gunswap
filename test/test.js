var eps = .0001; /* margin of error for tests that use Math trig functions */

/* 
	test that the siteswap object works for a variety of siteswaps. 
	just checks to make sure it doesn't throw an error 
*/
test( "Accepts siteswaps with valid format", function() {
	
	new Siteswap('4');
	new Siteswap('(4,4)');
	new Siteswap('(4x,4x)(4,4)');
	new Siteswap('<3|3><3p|3p>');
	new Siteswap('<3|(4x,4x)>');
  	
  	ok( true );

});

/* test that the siteswap object works for a variety of siteswaps */
test( "Rejects siteswaps with invalid format", function() {
  
  throws(
  		function() { new Siteswap('<df>');}
  		, /Invalid/
  		, "Invalid siteswap format"
  	);

});

/* test the max toss height */
test( "Calculates max toss height correctly", function() {
	
	var s = new Siteswap('7531');
  	ok( s.maxTossHeight == 7 , "7531 has max throw height of 7");
	s = new Siteswap('(6,4)');
  	ok( s.maxTossHeight == 3 , "(6,4) has max throw height of 3");
	s = new Siteswap('<3|(4,4)>');
  	ok( s.maxTossHeight == 3 , "<3|(4,4)> has max throw height of 3");

});

/* test the number of jugglers */
test( "Calculates the number of jugglers correctly", function() {
	
	var s = new Siteswap('7531');
  	ok( s.numJugglers == 1 , "7531 has 1 juggler");
	s = new Siteswap('<3|3>');
  	ok( s.numJugglers == 2 , "<3|3> has 2 jugglers");
  	s = new Siteswap('<3|3|3|3>');
  	ok( s.numJugglers == 4 , "<3|3|3|3> has 4 jugglers");

});

/* test the number of props */
test( "Calculates the number of props correctly", function() {
	
	var s = new Siteswap('7531');
  	ok( s.numProps == 4 , "7531 has 4 props");
	s = new Siteswap('(6,4)');
  	ok( s.numProps == 5 , "(6,4) has 5 props");
	s = new Siteswap('<3|(4x,4x)|[33]>');
  	ok( s.numProps == 13 , "<3|(4x,4x)|[33]> has 13 props");

});

/* test the states and print state function */
test( "Calculates the state array correctly", function() {
	
	var s = new Siteswap('3');
  	ok( printState(s.states[0]) == "J0 L 1X0 R X2X" , "State array correct");

});

/* test the juggler hand position function */
test("Calculates juggler hand positions correctly", function() {

	var j = new Juggler({
		position: {x:0,y:0,z:0}, 
		rotation: 0, 
		width:1,
		dwellPath: [
			/* left */
			{
				radius: .1,
				catchRotation: 2*Math.PI,
				tossRotation: Math.PI
			},
			/* right */
			{
				radius: .1,
				catchRotation: Math.PI,
				tossRotation: 2*Math.PI
			}
		]
	});
	ok ( j.handPosition(LEFT).x == -.5 && j.handPosition(LEFT).y == 0 && j.handPosition(LEFT).z == 0, "Left hand correct" )
	ok ( j.handPosition(RIGHT).x == .5 && j.handPosition(RIGHT).y == 0 && j.handPosition(RIGHT).z == 0, "Right hand correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,0).x - (-.4)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,0).x - (.4)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,.5).x - (-.5)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,.5).x - (.5)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,1).x - (-.6)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,1).x - (.6)) < eps, "Dwell path interpolation function correct" )

	ok ( Math.abs(j.interpolateDwellPath(LEFT,0).y - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,0).y - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,.5).y - (-.1)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,.5).y - (-.1)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,1).y - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,1).y - (0)) < eps, "Dwell path interpolation function correct" )

	ok ( Math.abs(j.interpolateDwellPath(LEFT,0).z - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,0).z - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,.5).z - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,.5).z - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(LEFT,1).z - (0)) < eps, "Dwell path interpolation function correct" )
	ok ( Math.abs(j.interpolateDwellPath(RIGHT,1).z - (0)) < eps, "Dwell path interpolation function correct" )

	var j = new Juggler({
		position: {x:0,y:0,z:0}, 
		rotation: Math.PI, 
		width:1,
		dwellPath: [
			/* left */
			{
				radius: .1,
				catchRotation: 2*Math.PI,
				tossRotation: Math.PI
			},
			/* right */
			{
				radius: .1,
				catchRotation: Math.PI,
				tossRotation: 2*Math.PI
			}
		]
	});
	ok ( j.handPosition(LEFT).x == .5 && j.handPosition(LEFT).y == 0 && Math.abs(j.handPosition(LEFT).z-0) < eps, "Left hand correct" )
	ok ( j.handPosition(RIGHT).x == -.5 && j.handPosition(RIGHT).y == 0 && Math.abs(j.handPosition(RIGHT).z-0) < eps, "Right hand correct" )

});