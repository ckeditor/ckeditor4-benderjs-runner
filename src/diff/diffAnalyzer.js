function parseGitOutput( gitOutput ) {
	const filesStatus = gitOutput.split('\n').filter( s => s !== '');

	return filesStatus.map(fileStatus => {
		return fileStatus.split('\t');
	});
}
const path = require( 'path' );

function testPathToBenderFilter( testPath ) {
	return 'path:/' + testPath;
}

function convertFilesStatusIntoBenderFilter( filesStatus ) {
	let benderPaths = new Set();

	filesStatus.forEach(element => {
		const mode = element[0];

		const filePath = path.join( 
			path.dirname(element[ 1 ]),
			path.basename(
				element[ 1 ],
				path.extname( element[ 1 ] )
			)
		);

		if(filePath.startsWith( 'tests/' ) )
		{
			if( filePath.includes( '/manual/' ) ) {
				return;
			}

			const pathRegExp = /(.*)(_assets|_helpers)(.*)/m;
			const pathParts = filePath.match(pathRegExp);

			if( pathParts ) {
				// Add path to full test scope where additional assets was modified
				benderPaths.add(
					testPathToBenderFilter( pathParts[ 1 ].slice( 0, -1 ) )
				);
			} else if ( mode !== 'D' ) {
				// Add test for non deleted tests files
				benderPaths.add(
					testPathToBenderFilter( path.dirname( filePath ) )
				);
			}
		} else if ( filePath.startsWith( 'core/' ) ) {
			benderPaths.add( 'group:Core' );
		} else if ( filePath.startsWith( 'plugins/' ) ) {
			const pluginRegExp = /(plugins\/[a-z0-9_-]+)/g;
			const match = filePath.match(pluginRegExp);
			
			benderPaths.add(
				testPathToBenderFilter( path.join( 'tests', match[ 0 ] ) )
			);

		}
	});

	return Array.from(benderPaths);
}

module.exports = {
	parseGitOutput,
	convertFilesStatusIntoBenderFilter
};