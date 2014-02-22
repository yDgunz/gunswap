/* test that the siteswap object works for a variety of siteswaps. 
just checks to make sure it doesn't throw an error */
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
  		, "Error message says invalid"
  	);

});