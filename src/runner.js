const launch = require( 'launchpad' );
const { copyFile } = require( 'fs' );
const { normalize } = require( 'path' );
const { spawn } = require( 'child_process' );
const { differ } = require( './diff/differ' );

const args = process.argv.slice( 2 );
const config = require( `./${ args[ 0 ] }` );
const targetBranch = args[ 1 ];
const currentBranch = args[ 2 ];
const fullRun = args[ 4 ] || false;

console.log( `Loaded config from ${ args[ 0 ] }` );

( async function() {

	let failedTests = { list: [] };
	let benderProcess, serverProcess, allTestsPassing = true;

	// Graceful shutdown.
	process.on( 'SIGINT', () => {
		console.log( '\nTerminating...' );

		terminate( 1, benderProcess, serverProcess );
	} );

	console.log( '\n--- Copying Bender runner...' );
	await copyRunner( config.paths );

	console.log( `\n--- Generating tests query. Diffing ${ targetBranch } and ${ currentBranch }...` );

	let testsQuery = '';
	try {
		testsQuery = await differ( config.paths.ckeditor4, targetBranch, currentBranch );
		console.log( `\n--- Tests query: ${ testsQuery }. Full run: ${ fullRun ? 'true' : 'false' }.` );
	} catch ( error ) {
		console.log( `GIT.ERROR: ${ error }` );
		terminate( 1 );
	}

	if ( testsQuery.length === 0 && !fullRun ) {
		console.log( '\n--- Tests query empty. Skipping test run.' );
		terminate( 1 );
	}

	console.log( '\n--- Launching bender...' );

	benderProcess = await launchBender();
	if ( !benderProcess ) {
		terminate( 1 );
	}

	console.log( '\n--- Launching server...' );

	const testRunLogger = getLogger( failedTests );

	serverProcess = await launchServer( config, testRunLogger );
	if ( !serverProcess ) {
		terminate( 1, benderProcess );
	}

	const os = getOS();
	const localInstance = await launchLocal( launch );

	let browsers = await getBrowsers( localInstance, os, config );
	// Use specific browser only.
	if ( args[ 3 ] && args[ 3 ].length ) {
		browsers = browsers.filter( browserData => browserData.name == args[ 3 ] );
	}

	console.log( `\n--- Testing on ${ os } with browsers:` );
	console.log( browsers );
	console.log( '\n--- Launching tests...' );

	const url = `http://localhost:${ config.bender.port }/runner.html#port:${config.server.port},is:unit,${ testsQuery }`;
	for ( const browser of browsers ) {
		await runTests( localInstance, browser, url, testRunLogger );
	}

	terminate( allTestsPassing ? 0 : 1, benderProcess, serverProcess );

	async function copyRunner( paths ) {
		return new Promise( ( res, rej ) => {
			copyFile( paths.runner, normalize( `${ paths.ckeditor4 }/node_modules/benderjs/static/runner.html` ), error => {
				if ( error ) {
					rej( error );
				} else {
					res();
				}
			} );
		} );
	}

	async function launchLocal( launchpad ) {
		return new Promise( ( res, rej ) => {
			launchpad.local( ( error, localInstance ) => {
				if ( error ) {
					rej( error );
				} else {
					res( localInstance );
				}
			} );
		} );
	}

	async function getBrowsers( launchpadInstance, os, config ) {
		return new Promise( ( res, rej ) => {
			launchpadInstance.browsers( ( error, browsers ) => {
				if ( error ) {
					rej( error );
				} else {
					res( filterBrowsers( browsers, config.browsers[ os ] ) );
				}
			} );
		} );
	}

	async function runTests( launchpadInstance, browser, url, logger ) {
		return new Promise( ( res, rej ) => {

			failedTests.list = [];

			launchpadInstance[ browser.name ]( url, ( error, browserInstance ) => {
				console.log( '\n--- Launched ', browser.name );

				if ( error ) {
					console.log( error );
					res();
				} else {
					browserInstance.on( 'stop', data => {
						console.log( 'Browser instance emitted stop event with data:' );
						console.log( data );
					} );

					logger.onDone = function( data ) {
						console.log( `\nTesting complete: ${ data.result }` );
						allTestsPassing = allTestsPassing && failedTests.list.length === 0;
						printFailedTests( failedTests.list );
						res();
					};
				}
			} );
		} );
	}

	async function launchBender() {
		return new Promise( ( res, rej ) => {
			console.log( 'Trying to launch bedner with:' );
			console.log( `npm run sub:bender ${ config.paths.ckeditor4 } ${ config.bender.port }` );

			const bender = spawnNPMProcess( [ 'run', 'sub:bender', config.paths.ckeditor4, config.bender.port ] );

			bender.stdout.on( 'data', data => {
				const msg = data.toString();

				// console.log( `BENDER: ${ msg.trim() }` );

				if ( msg.toLowerCase().includes( 'server started at' ) ) {
					res( bender );
				}
			} );

			bender.stderr.on( 'data', data => {
				const msg = data.toString();

				console.error( `BENDER.ERROR: ${ msg.trim() }` );

				rej();
			} );

			bender.on( 'close', code => {
				console.log( `BENDER: Process exited with code ${ code }.`);
			} );
		} );
	}

	async function launchServer( config, testRunLogger ) {
		return new Promise( ( res, rej ) => {
			const server = spawnNPMProcess( [ 'run', 'sub:server', config.server.port ] );

			server.stdout.on( 'data', data => {
				const msg = data.toString();

				// console.log( `SERVER: ${ msg.trim() }` );

				testRunLogger.passMsg( msg.trim() );

				if ( msg.toLowerCase().includes( 'server started at' ) ) {
					res( server );
				}
			} );

			server.stderr.on( 'data', data => {
				const msg = data.toString();

				console.error( `SERVER.ERROR: ${ msg.trim() }` );

				rej();
			} );

			server.on( 'close', code => {
				console.log( `SERVER: Process exited with code ${ code }.`);
			} );
		} );
	}
} )();

function getOS() {
	const os = process.platform.toLowerCase();

	if ( os === 'darwin' ) {
		return 'macos';
	}

	if ( os === 'win32' || os === 'win64' ) {
		return 'windows';
	}

	return 'linux';
}

function filterBrowsers( availableBrowsers, useBrowsers ) {
	return availableBrowsers.filter( browser => {
		return useBrowsers.includes( browser.name );
	} );
}

function getLogger( failedTests ) {
	return {
		onUpdate: function( data ) {
			// console.log( 'Not implemented.' );
			// process.stdout.write("hello: ");
			process.stdout.write( data.failed === 0 ? '+' : '-' );

			if ( data.failed ) {
				// console.log( 'TEST FAILED', data );
				failedTests.list.push( data );
			}
		},

		onDone: function( data ) {
			console.log( 'Not implemented.' );
		},

		passMsg: function( msg ) {
			const parts = msg.split( '\n' );

			parts.forEach( part => {
				let data = '';

				if ( part[ 0 ] !== '>' ) {
					try {
						data = JSON.parse( part.trim() );
					} catch ( err ) {
						console.log( 'Error parsing JSON', err, part );
					}

					if ( data && data.type === 'update' && data.state === 'done' ) {
						this.onUpdate( data );
					} else if ( data && data.type === 'complete' ) {
						this.onDone( data );
					}
				}
			} );
		}
	};
}

function terminate( exitCode, benderProcess, serverProcess ) {
	benderProcess && process.kill( -benderProcess.pid, 'SIGINT' );
	serverProcess && process.kill( -serverProcess.pid, 'SIGINT' );

	setTimeout( () => {
		process.exit( exitCode );
	}, 500 );
}

function printFailedTests( failedTestsData ) {
	failedTestsData.forEach( failedTestData => {
		console.log( failedTestData.id );

		let count = 1;
		Object.values( failedTestData.results ).forEach( failedTest => {
			console.log( `${ count }) ${ failedTest.name } - ${ failedTest.error }` );
			count++;
		} );
	} );
}

function spawnNPMProcess( params ) {
	// https://stackoverflow.com/a/43285131/646871
	return spawn( /^win/.test( process.platform ) ? 'npm.cmd' : 'npm', params, { detached: true } );
}
