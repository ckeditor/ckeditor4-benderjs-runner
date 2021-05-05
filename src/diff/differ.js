const { spawn } = require( 'child_process' );
const path = require( 'path' );
const { parseGitOutput, convertFilesStatusIntoBenderFilter } = require( './diffAnalyzer' );

const differ = function( repoRelativeDirectory, targetBranch = 'master', currentBranch = '' ) {
	let bufferedChanges = [];
	
	( async function() {
		return new Promise( ( resolve, reject ) => {
			const cwd = path.normalize( path.join( process.cwd(), repoRelativeDirectory ) );
			const gitProcess = spawn(
				'git',
				[
					'diff',
					`${ targetBranch }..${ currentBranch }`,
					'--name-status'
				],
				{ cwd: cwd }
			);

			gitProcess.stdout.on( 'data', data => {
				const filesStatus = parseGitOutput( data.toString() );
				//console.log('asd', filesStatus);
				const benderFilters = convertFilesStatusIntoBenderFilter( filesStatus );
//console.log(benderFilters);
				bufferedChanges = [...bufferedChanges, benderFilters];
			} );

			gitProcess.on( 'error', ( error ) => {
				reject( error );
			} );

			gitProcess.on( 'close', ( code, b ) => {
				const generatedFilters = bufferedChanges.join( ',' );
				//console.log('generated filters:', generatedFilters.length);
				resolve( generatedFilters );
			} );
		} );
	} )();
};

module.exports = {
	differ: differ
};
