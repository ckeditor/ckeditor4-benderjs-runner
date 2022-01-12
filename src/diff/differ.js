const { spawn } = require( 'child_process' );
const path = require( 'path' );
const { parseGitOutput, convertFilesStatusIntoBenderFilter } = require( './diffAnalyzer' );
const { getDependencyMap } = require( './plugins' );

const differ = async function( repoRelativeDirectory, targetBranch = 'master', currentBranch = '', repoSlug = '' ) {
	let bufferedGitOutput = [];
	const cwd = path.normalize( path.join( process.cwd(), repoRelativeDirectory ) );

	async function addOrigin( repoSlug ) {
		return new Promise( ( resolve, reject ) => {
			const originName = 'pullRequestOrigin';

			const gitAddOrigin = spawn(
				'git',
				[
					'remote',
					'add',
					originName,
					'https://github.com/' + repoSlug + '.git'
				],
				{ cwd }
			);

			gitAddOrigin.stderr.on( 'data', data => {
				console.log( data.toString() );
			} );

			gitAddOrigin.on( 'error', ( error ) => {
				reject( error );
			} );

			gitAddOrigin.on( 'close', ( code ) => {
				console.log( `Add origin exited with code ${code}` );
				resolve( originName );
			} );
		} );
	}

	async function fetchOrigin( origin ) {
		return new Promise( ( resolve, reject ) => {
			const fetchOrigin = spawn(
				'git',
				[
					'fetch',
					origin,
				],
				{ cwd }
			);

			fetchOrigin.stderr.on( 'data', data => {
				console.log( data.toString() );
			} );

			fetchOrigin.on( 'error', ( error ) => {
				reject( error );
			} );

			fetchOrigin.on( 'close', ( code ) => {
				console.log( `Fetch additional origin exited with code ${code} `);
				resolve();
			} );
		} );
	}

	async function SpawnGitProcess( currentBranchOrigin ) {
		return new Promise( ( resolve, reject ) => {
			const gitProcess = spawn(
				'git',
				[
					'diff',
					`origin/${ targetBranch }..${currentBranchOrigin}/${ currentBranch }`,
					'--name-status'
				],
				{ cwd }
			);

			gitProcess.stdout.on( 'data', data => {
				bufferedGitOutput.push( data.toString() );
			} );

			gitProcess.stderr.on( 'data', data => {
				console.log( data.toString() );
			} );

			gitProcess.on( 'error', ( error ) => {
				reject( error );
			} );

			gitProcess.on( 'close', ( code ) => {
				console.log( `Git diff process exited with code ${code}` );
				const data = bufferedGitOutput.join( '' );

				const filesStatus = parseGitOutput( data );
				const dependencyMap = getDependencyMap( path.join( repoRelativeDirectory, 'plugins/' ) );

				const benderFilters = convertFilesStatusIntoBenderFilter( filesStatus, dependencyMap );

				resolve( benderFilters );
			} );
		} );
	};
	let origin = 'origin';

	if( repoSlug && repoSlug != 'ckeditor/ckeditor4' ) {
		origin = await addOrigin( repoSlug );
		await fetchOrigin( origin );
	}

	return SpawnGitProcess( origin );
};

module.exports = {
	differ: differ
};
