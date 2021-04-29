const { spawn } = require( 'child_process' );
const { parseGitOutput, convertFilesStatusIntoBenderFilter } = require( './diffAnalyzer' );

const targetBranch = process.argv[ 2 ] || 'master';
const currentBranch = process.argv[ 3 ] || '';

const ls = spawn( 'git',[ 'diff', `${ targetBranch }..${ currentBranch }`, '--name-status' ] );

ls.stdout.on( 'data', data => {
	const filesStatus = parseGitOutput( data.toString() );
	const benderFilters = convertFilesStatusIntoBenderFilter( filesStatus );

	const benderFilter = benderFilters.join( ',' );

	console.log( benderFilter );
} );

ls.on( 'error', ( error ) => {
	console.log( `error: ${error.message}`, error );
} );

ls.on( 'close', ( code, b ) => {
	// console.log(`child process exited with code ${code}`, b);
} );
