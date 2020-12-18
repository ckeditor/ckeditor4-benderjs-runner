var assert = require('assert');
const { convertFilesIntoTestsPaths } = require('../src/diff/diffAnalyzer');

describe('bender paths extractor', function() {
	it('returns test path for file if ticket test file was added',
		MakePathTest(
			[ [ 'A', 'tests/tickets/174/1.js' ] ],
			'tests/tickets/174'
		)
	);

	it('returns test path for plugin if plugin tests file was modified',
		MakePathTest(
			[ [ 'M', 'tests/plugins/ajax/ajax.js' ] ],
			'tests/plugins/ajax'
		)
	);

	it('do not includes test if manual test was modified',
		MakePathTest(
			[['M', 'tests/plugins/ajax/manual/optionalcallback.html']],
			'tests/plugins/ajax/manual/optionalcallback',
			false
		)
	);

	it('include all non-manual plugin tests if helper or asset in plugin tests was modified',
		MakePathTest(
			[['M', 'tests/plugins/dialog/_helpers/tools.js']],
			'tests/plugins/dialog'
		)
	);

	it('do not includes path for deleted file',
		MakePathTest(
			[ [ 'D', 'tests/tickets/174/1.js' ] ],
			'tests/tickets/174',
			false
		)
	);

});

const config = require('../bender-runner.config.json');


function MakePathTest(changedFiles, expectedPath, exists) {
	const shouldInclude = exists === undefined ? true : exists;

	return function () {
		const benderPaths = convertFilesIntoTestsPaths(changedFiles, config);
		if(shouldInclude) {
			assert.strictEqual(benderPaths[0], expectedPath );
		} else {
			assert.notStrictEqual(benderPaths[0], expectedPath );
		}
	};
}

function MakeMultipleResultsTest(changedFiles, expectedPaths) {

	return function () {
		const benderPaths = convertFilesIntoTestsPaths(changedFiles, config);
		assert.deepStrictEqual(benderPaths, expectedPaths );
	};
}