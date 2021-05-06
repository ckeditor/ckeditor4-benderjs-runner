const { spawn } = require( 'child_process' );
const path = require( 'path' );
const { parseGitOutput, convertFilesStatusIntoBenderFilter } = require( './diffAnalyzer' );

const differ = function( repoRelativeDirectory, targetBranch = 'master', currentBranch = '' ) {
	let bufferedChanges = [];

	async function SpawnGitProcess() {
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
				const benderFilters = convertFilesStatusIntoBenderFilter( filesStatus );

				bufferedChanges = [...bufferedChanges, ...benderFilters];
			} );

			gitProcess.on( 'error', ( error ) => {
				reject( error );
			} );

			gitProcess.on( 'close', ( code, b ) => {
				const generatedFilters = bufferedChanges.join( ',' );
				resolve( generatedFilters );
			} );
		} );
	};

	return SpawnGitProcess();
};

module.exports = {
	differ: differ
};
