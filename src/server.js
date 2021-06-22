const { resolve: resolvePath } = require( 'path' );
const pino = require( 'pino' );
const app = require( 'fastify' )( { logger: createLogger() } );
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
		logAndDisplay( error, 'error' );
		process.exit( 1 );
	}

	logAndDisplay( `Server started at ${ address }.` );
} );

function createLogger() {
	const logPath = resolvePath( __dirname, '..', '.fastify.log' );
	const destination = pino.destination( logPath );

	return pino( destination );
}

function logAndDisplay( msg, type = 'info' ) {
	const consoleMethod = type === 'error' ? 'error' : 'log';

	app.log[ type ]( msg );
	console[ consoleMethod ]( JSON.stringify( msg ) );
}
