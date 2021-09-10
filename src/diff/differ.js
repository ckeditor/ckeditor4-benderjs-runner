const { spawn } = require( 'child_process' );
const path = require( 'path' );
const { parseGitOutput, convertFilesStatusIntoBenderFilter } = require( './diffAnalyzer' );
const { getDependencyMap } = require( './plugins' );

const differ = function( repoRelativeDirectory, targetBranch = 'master', currentBranch = '' ) {
	let bufferedGitOutput = [];

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
				{ cwd }
			);

			gitProcess.stdout.on( 'data', data => {
				bufferedGitOutput.push( data.toString() );
			} );

			gitProcess.on( 'error', ( error ) => {
				reject( error );
			} );

			gitProcess.on( 'close', ( code, signal ) => {
				const data = bufferedGitOutput.join( '' );

				const filesStatus = parseGitOutput( data.toString() );
				const dependencyMap = getDependencyMap( path.join( repoRelativeDirectory, 'plugins/' ) );

				const benderFilters = convertFilesStatusIntoBenderFilter( filesStatus, dependencyMap );	

				resolve( benderFilters );
			} );
		} );
	};

	return SpawnGitProcess();
};

module.exports = {
	differ: differ
};
