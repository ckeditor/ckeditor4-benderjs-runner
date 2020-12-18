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
		//test is affected
		if( mode !== 'D' &&
			filePath.startsWith('tests/') &&
			!filePath.includes('/manual/')
			)
		{
			if( filePath.includes( '/_assets' ) ||
				filePath.includes( '/_helpers' )
			)
			{
				const pathRegExp = /(.*)(_assets|_helpers)(.*)/m;
				const pathParts = filePath.match(pathRegExp);

				if (pathParts){
					benderPaths.push(pathParts[ 1 ].slice( 0, -1 ) );
				}
			} else {
				benderPaths.push( path.dirname( filePath ) );
			}
		}
		//plugin is affected ->
		//core is affected
	});

	return benderPaths;
}

module.exports = {
	parseGitOutput,
	convertFilesIntoTestsPaths,
	convertTestPathIntoBenderPathFilter
};