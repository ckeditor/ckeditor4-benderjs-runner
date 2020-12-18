function parseGitOutput( gitOutput ) {
	const filesStatus = gitOutput.split('\n').filter( s => s !== '');

	return filesStatus.map(fileStatus => {
		return fileStatus.split('\t');
	});
}
const path = require('path');
const fs = require('fs');

function convertFilesIntoTestsPaths(filesStatus, config) {
	const benderPaths = [];

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

					const testFolder = path.normalize( path.join(__dirname, '../../', config.paths.ckeditor4, pathParts[1] ) );
					
					fs.readdirSync(testFolder, { withFileTypes: true } )
					.forEach(fDescriptor => {
						if(fDescriptor.isFile()){
							const baseName = path.basename(fDescriptor.name, path.extname(fDescriptor.name));
							const testPath = path.join( pathParts[1], baseName );
							benderPaths.push(testPath);
						}
					});
				}
			} else {
				benderPaths.push(filePath);
			}
		}
		//plugin is affected ->
		//core is affected
	});
	
	return benderPaths;
}

module.exports = {
	parseGitOutput,
	convertFilesIntoTestsPaths
};