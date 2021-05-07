const path = require( 'path' );

function parseGitOutput( gitOutput ) {
	const filesStatus = gitOutput.split( '\n' ).filter( s => s !== '' );

	return filesStatus.map( fileStatus => {
		return fileStatus.split( '\t' );
	} );
}

function pathToBenderFilterPath( testPath ) {
	return 'path:/' + testPath;
}

function convertFilesStatusIntoBenderFilter( filesStatus, dependencyMap = null ) {
	filesStatus = removeExtensionFromPaths( filesStatus );

	const testChanges = collectChangesInTests( filesStatus );

	const coreChanges = collectChangesInCore( filesStatus, dependencyMap );

	const adaptersChanges = collectChangesInAdapters ( filesStatus );

	const pluginChanges = collectChangesInPlugins( filesStatus, dependencyMap );

	const benderFilters = [ ...testChanges, ...coreChanges, ...pluginChanges, ...adaptersChanges ];

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
	const filters = filesStatus
		.filter( elem => elem[ 1 ].startsWith( 'tests/' ) && !elem[ 1 ].includes( '/manual/' ) )
		.map( ( [ mode, filePath ] ) => {
			const pathRegExp = /(.*)(_assets|_helpers)(.*)/m;
			const pathParts = filePath.match( pathRegExp );

			if( pathParts ) {
				// Add path to full test scope where additional assets was modified
				return pathToBenderFilterPath( pathParts[ 1 ].slice( 0, -1 ) );
			} else if ( mode !== 'D' ) {
				// Add test for non deleted tests files
				return pathToBenderFilterPath( path.dirname( filePath ) );
			}
		} );

	return filters;
}

function collectChangesInCore( filesStatus, dependencyMap ) {
	const foundCoreChanges = filesStatus.find( elem => elem[ 1 ].startsWith( 'core/' ) );
	let coreFilters = [];

	if ( foundCoreChanges ) {
		coreFilters.push( 'group:Core' );

		const additionalPluginDeps = [ 'dialog', 'widget', 'clipboard' ];

		const collectedDeps = additionalPluginDeps.reduce( ( acc, plugin ) => {
			const deps = getFiltersForPlugin( dependencyMap, plugin );

			return [ ...acc, ...deps ];
		}, [] );

		coreFilters = [ ...coreFilters, ...collectedDeps ];
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

function collectChangesInPlugins( filesStatus, pluginDependencies ) {
		
	let filters = filesStatus.filter( elem => elem[ 1 ].startsWith( 'plugins/' ) );

	filters = filters.reduce( ( acc, elem ) => {
		const filePath = elem[ 1 ];

		const pluginRegExp = /(plugins\/([a-z0-9_-]+))/i;
		const [ deps, , pluginName ] = filePath.match( pluginRegExp );

		const pluginFilters = getFiltersForPlugin( pluginDependencies, pluginName );

		return pluginFilters;
	}, [] );

	return Array.from( new Set( filters ) );
}

function getFiltersForPlugin( pluginDependencies, pluginName ) {
	const filters = [ pathToBenderFilterPath( path.join( 'tests', 'plugins', pluginName ) ) ];

	if ( pluginDependencies && pluginDependencies[ pluginName ] && pluginDependencies[ pluginName ].length ) {
		pluginDependencies[ pluginName ].forEach( pluginName => {
			filters.push( pathToBenderFilterPath( path.join( 'tests', 'plugins', pluginName ) ) );
		} );
	}

	return filters;
}

module.exports = {
	parseGitOutput,
	convertFilesStatusIntoBenderFilter
};
