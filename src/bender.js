const { spawn } = require( 'child_process' );
const args = process.argv.slice( 2 );

if ( !args[ 0 ] ) {
	console.error( 'Missing ckeditor4 folder path! Pass it by running: node bender.js ckeditor4_path' );
	process.exit( 1 );
}

if ( isNaN( args[ 1 ] ) ) {
	console.error( 'Missing port number! Pass it by running: node bender.js ckeditor4_path bender_port' );
	process.exit( 1 );
}

const bender = spawn( `cd ${ args[ 0 ] } && bender server run -p ${ args[ 1 ] } -H 0.0.0.0`, {
	shell: true
} );

bender.stdout.on( 'data', data => {
	console.log( data.toString() );
} );

bender.stderr.on( 'data', data => {
	console.error( data.toString() );
} );

bender.on( 'exit', code => {
	console.log( `Process exited with code ${ code }.`);
} );
