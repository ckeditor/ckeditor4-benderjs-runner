const { spawn } = require("child_process");
const { parseGitOutput, getBenderAffectedPaths } = require('./diff/analyzeDiff');


const targetBranch = process.argv[2] || 'master';
const currentBranch = process.argv[3] || '';

console.log(targetBranch, currentBranch);
const ls = spawn( 'git',['diff', `${targetBranch}..${currentBranch}`,'--name-status']);

ls.stdout.on("data", data => {
	// console.log(data.toString());
	const filesStatus = parseGitOutput(data.toString());
	getBenderAffectedPaths(filesStatus);
// console.log(`stdout: ${data}`);
});

ls.on('error', (error) => {
	console.log(`error: ${error.message}`, error);
});

ls.on("close", (code, b) => {
	console.log(`child process exited with code ${code}`, b);
});