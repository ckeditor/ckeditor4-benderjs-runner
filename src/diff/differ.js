const { spawn } = require("child_process");
const { parseGitOutput, convertFilesIntoTestsPaths, convertTestPathIntoBenderPathFilter } = require('./diffAnalyzer');

const config = require('../../bender-runner.config.json');


const targetBranch = process.argv[2] || 'master';
const currentBranch = process.argv[3] || '';

const ls = spawn( 'git',['diff', `${targetBranch}..${currentBranch}`,'--name-status']);

ls.stdout.on("data", data => {
	const filesStatus = parseGitOutput(data.toString());
	const testPaths = convertFilesIntoTestsPaths(filesStatus, config);
	const benderTestPaths = convertTestPathIntoBenderPathFilter(testPaths);

	const benderFilter = benderTestPaths.join(',');

	console.log(benderFilter);
});

ls.on('error', (error) => {
	console.log(`error: ${error.message}`, error);
});

ls.on("close", (code, b) => {
	// console.log(`child process exited with code ${code}`, b);
});