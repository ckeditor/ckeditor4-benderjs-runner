function parseGitOutput( gitOutput ) {
	const filesStatus = gitOutput.split('\n').filter( s => s !== '');

	const maped = filesStatus.map(fileStatus => {
	   return fileStatus.split('\t');
	});

	return maped;
}

function getBenderAffectedPaths(filesStatus) {
	console.log(filesStatus);
	const benderPaths = [];
	filesStatus.forEach(element => {
		const filePath = element[1].slice(0, -3);
		//test is affected
		if(filePath.startsWith('tests/') &&
			!filePath.includes('/manuals/')
			)
		{
			benderPaths.push(filePath);
		}
		//plugin is affected ->
		//core is affected

		//other non relevant
	});
}

module.exports = {
	parseGitOutput,
	getBenderAffectedPaths
};