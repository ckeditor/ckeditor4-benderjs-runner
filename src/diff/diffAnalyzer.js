const path = require( 'path' );
const { getDependencyMap } = require( './plugins' );

function parseGitOutput( gitOutput ) {
	const filesStatus = gitOutput.split('\n').filter( s => s !== '');

	return filesStatus.map(fileStatus => {
		return fileStatus.split('\t');
	});
}

function testPathToBenderFilter( testPath ) {
	return 'path:/' + testPath;
}

function convertFilesStatusIntoBenderFilter( filesStatus, dependencyMap = null ) {
	filesStatus = removeExtensionFromPaths( filesStatus );

	const testChanges = collectChangesInTests( filesStatus );

	// TODO if there are any core changes lets run tests for `dialog`, `widget` and `clipboard` plugins (with all the dependencies) too.
	const coreChanges = collectChangesInCore( filesStatus );

	const adaptersChanges = collectChangesInAdapters ( filesStatus );

	const pluginChanges = collectChangesInPlugins( filesStatus, dependencyMap );

	const benderFilters = [...testChanges, ...coreChanges, ...pluginChanges, ...adaptersChanges ];

	return Array.from( new Set( benderFilters ) );
}

function removeExtensionFromPaths( filesStatus ) {
	return filesStatus.map( ( [ status, filePath ] ) => {
		return [
			status,
			path.join(
				path.dirname( filePath ),
				path.basename(
					filePath,
					path.extname( filePath )
				)
			)
		];
	} );
}

function collectChangesInTests( filesStatus ) {
	return filesStatus.filter( elem => elem[ 1 ].startsWith( 'tests/' ) )
		.map( ( [ mode, filePath ] ) => {
			if( filePath.includes( '/manual/' ) ) {
				return;
			}

			const pathRegExp = /(.*)(_assets|_helpers)(.*)/m;
			const pathParts = filePath.match( pathRegExp );

			if( pathParts ) {
				// Add path to full test scope where additional assets was modified
				return testPathToBenderFilter( pathParts[ 1 ].slice( 0, -1 ) );
			} else if ( mode !== 'D' ) {
				// Add test for non deleted tests files
				return testPathToBenderFilter( path.dirname( filePath ) );
			}
		} );
}

function collectChangesInCore( filesStatus ) {
	const foundCoreChanges = filesStatus.find( elem => elem[ 1 ].startsWith( 'core/' ) );
	const coreFilters = [];

	if ( foundCoreChanges ) {
		coreFilters.push( 'group:Core' );
	}

	return coreFilters;
}

function collectChangesInAdapters( filesStatus ) {
	const foundAdapterChanges = filesStatus.find( elem => elem[ 1 ].startsWith( 'adapters/' ) );
	const adapterFilters = [];

	if ( foundAdapterChanges ) {
		adapterFilters.push( 'group:Adapters' );
	}

	return adapterFilters;
}

function collectChangesInPlugins( filesStatus, dependencyMap ) {
	// TODO Temporary path for tests. I guess it should be configurable.
	const pluginDependencies = dependencyMap || getDependencyMap( '../ckeditor4/plugins/' );
		
	const filters = filesStatus
		.filter( elem => elem[ 1 ].startsWith( 'plugins/' ) )
		.flatMap( elem => {
			const filePath = elem[ 1 ];

			const pluginRegExp = /(plugins\/([a-z0-9_-]+))/i;
			const [ deps, , pluginName ] = filePath.match( pluginRegExp );

			let fiters = getFiltersForPluginDeps( pluginDependencies, pluginName );

			fiters = [ testPathToBenderFilter( path.join( 'tests', deps ) ), ...fiters ];

			return fiters;
		} );

	return Array.from( new Set( filters ) );
}

function getFiltersForPluginDeps( pluginDependencies, pluginName ) {
	const filters = [];

	if ( pluginDependencies[ pluginName ] && pluginDependencies[ pluginName ].length ) {
		pluginDependencies[ pluginName ].forEach( pluginName => {
			filters.push( testPathToBenderFilter( path.join( 'tests', 'plugins', pluginName ) ) );
		} );
	}

	return filters;
}

module.exports = {
	parseGitOutput,
	convertFilesStatusIntoBenderFilter
};
