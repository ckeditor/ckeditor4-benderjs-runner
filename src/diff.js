const { spawn } = require("child_process");



const ls = spawn('git diff', ['--name-only']);

ls.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
});