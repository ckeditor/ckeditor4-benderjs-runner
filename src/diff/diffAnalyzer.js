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
	filesStatus = filesStatus.map( element => {
		return [
			element[ 0 ],
			path.join(
				path.dirname(element[ 1 ]),
				path.basename(
					element[ 1 ],
					path.extname( element[ 1 ] )
				)
			)
		];
	} );

	// TODO Temporary path for tests. I guess it should be configurable.
	const pluginDependencies = dependencyMap || getDependencyMap( '../ckeditor4/plugins/' );

	const testChanges = filesStatus
		.filter( elem => elem[1].startsWith( 'tests/' ) )
		.map( elem => {
			const mode = elem[ 0 ];
			const filePath = elem[ 1 ];

			if( filePath.includes( '/manual/' ) ) {
				return;
			}

			const pathRegExp = /(.*)(_assets|_helpers)(.*)/m;
			const pathParts = filePath.match(pathRegExp);

			if( pathParts ) {
				// Add path to full test scope where additional assets was modified
				return testPathToBenderFilter( pathParts[ 1 ].slice( 0, -1 ) );
			} else if ( mode !== 'D' ) {
				// Add test for non deleted tests files
				return testPathToBenderFilter( path.dirname( filePath ) );
			}
		});

	// TODO if there are any core changes lets run tests for `dialog`, `widget` and `clipboard` plugins (with all the dependencies) too.
	const coreChanges = filesStatus
		.filter( elem => elem[1].startsWith( 'core/' ) )
		.map(elem => {
			return 'group:Core';
		});

	const adaptersChanges = filesStatus
		.filter( elem => elem[1].startsWith( 'adapters/' ) )
		.map(elem => {
			return 'group:Adapters';
		});

	const pluginChanges = filesStatus
		.filter( elem => elem[1].startsWith( 'plugins/' ) )
		.map(elem => {
			const paths = [];
			const filePath = elem[ 1 ];

			const pluginRegExp = /(plugins\/([a-z0-9_-]+))/i;
			const match = filePath.match(pluginRegExp);

			paths.push(testPathToBenderFilter( path.join( 'tests', match[ 0 ] ) ) );

			const pluginName = match[ 2 ];
			if ( pluginDependencies[ pluginName ] && pluginDependencies[ pluginName ].length ) {
				pluginDependencies[ pluginName ].forEach( pluginName => {
					paths.push( testPathToBenderFilter( path.join( 'tests', 'plugins', pluginName ) ) );
				} );
			}

			return paths;
		});

	const benderFilters = [...testChanges, ...coreChanges, ...pluginChanges, ...adaptersChanges ];

	return Array.from( new Set( benderFilters ) );
}

module.exports = {
	parseGitOutput,
	convertFilesStatusIntoBenderFilter
};
