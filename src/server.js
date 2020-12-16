const app = require( 'fastify' )( { logger: true } );
const args = process.argv.slice( 2 );

if ( isNaN( args[ 0 ] ) ) {
	console.error( 'Missing port number! Pass it by running: node server.js port_number' );
	process.exit( 1 );
}

app.post( '/', ( request, reply ) => {
	// Use regular console.log instead of app.log.* to have plain text output instead of JSON logs.
	console.log( request.body );

	reply.send( 200 );
} );

app.listen( Number( args[ 0 ] ), ( error , address ) => {
	if ( error ) {
		app.log.error( error );
		process.exit( 1 );
	}

	app.log.info( `Server started at ${ address }.` );
} );
