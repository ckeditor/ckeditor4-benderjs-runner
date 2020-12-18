function parseGitOutput( gitOutput ) {
	const filesStatus = gitOutput.split('\n').filter( s => s !== '');

	return filesStatus.map(fileStatus => {
		return fileStatus.split('\t');
	});
}
const path = require( 'path' );
const fs = require( 'fs' );

function convertTestPathIntoBenderPathFilter( testPaths ) {
	const prefixedPaths = testPaths.map( path => 'path:/' + path );
	return prefixedPaths;
}

function convertFilesIntoTestsPaths( filesStatus, config ) {
	let benderPaths = [];

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
				benderPaths.push(pathParts[ 1 ].slice( 0, -1 ) );
			} else if ( mode !== 'D' ) {
				// Add test for non deleted tests files
				benderPaths.push( path.dirname( filePath ) );
			}

		} else if ( filePath.startsWith( 'core/' ) ) {
			
		} else if ( filePath.startsWith( 'plugins/' ) ) {

		}
	});

	return benderPaths;
}

module.exports = {
	parseGitOutput,
	convertFilesIntoTestsPaths,
	convertTestPathIntoBenderPathFilter
};