var assert = require('assert');
const {getBenderAffectedPaths} = require('../src/diff/analyzeDiff');

describe('bender paths extractor', function() {
	it('returns test path for file if ticket test file was added',
		MakePathTest(
			[ [ 'A', 'tests/tickets/174/1.js' ] ],
			'tests/tickets/174/1'
		)
	);

	it('returns test path for plugin if plugin tests file was modified',
		MakePathTest(
			[ [ 'M', 'tests/plugins/ajax/ajax.js' ] ],
			'tests/plugins/ajax/ajax'
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
		MakeMultipleResultsTest(
			[['M', 'tests/plugins/dialog/_helpers/tools.js']],
			[
				'tests/plugins/dialog/beforeunload',
				'tests/plugins/dialog/confirm',
				'tests/plugins/dialog/focus',
				'tests/plugins/dialog/plugin',
				'tests/plugins/dialog/positioning',
			]
		)
	);

	it('do not includes path for deleted file',
		MakePathTest(
			[ [ 'D', 'tests/tickets/174/1.js' ] ],
			'tests/tickets/174/1',
			false
		)
	);

});



function MakePathTest(changedFiles, expectedPath, exists) {
	const shouldInclude = exists === undefined ? true : exists;

	return function () {
		const benderPaths = getBenderAffectedPaths(changedFiles);
		console.log('***' , benderPaths);
		assert.strictEqual(benderPaths.includes(expectedPath), shouldInclude );
	};
}

function MakeMultipleResultsTest(changedFiles, expectedPaths) {

	return function () {
		const benderPaths = getBenderAffectedPaths(changedFiles);
		console.log('***' , benderPaths);
		assert.strictEqual(benderPaths, expectedPaths );
	};
}