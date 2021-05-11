const { spawn } = require( 'child_process' );
const path = require( 'path' );
const { parseGitOutput, convertFilesStatusIntoBenderFilter } = require( './diffAnalyzer' );
const { getDependencyMap } = require( './plugins' );

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
				{ cwd }
			);

			console.log( `git diff ${ targetBranch }..${ currentBranch } --name-status in ${ cwd }` );

			gitProcess.stdout.on( 'data', data => {
				const filesStatus = parseGitOutput( data.toString() );
				const dependencyMap = getDependencyMap( path.join( repoRelativeDirectory, 'plugins/' ) );

				const benderFilters = convertFilesStatusIntoBenderFilter( filesStatus, dependencyMap );

				bufferedChanges = [ ...bufferedChanges, ...benderFilters ];
			} );

			gitProcess.on( 'error', ( error ) => {
				reject( error );
			} );

			gitProcess.on( 'close', ( code, signal ) => {
				const generatedFilters = bufferedChanges.join( ',' );
				console.log( generatedFilters );
				resolve( generatedFilters );
			} );
		} );
	};

	return SpawnGitProcess();
};

module.exports = {
	differ: differ
};
