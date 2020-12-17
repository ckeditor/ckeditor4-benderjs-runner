var assert = require('assert');
const {getBenderAffectedPaths} = require('../src/diff/analyzeDiff');

describe('bender paths extractor', function() {
	it('returns test path for file if non plugin test file was added',
		MakePathTest(
			[ [ 'A', 'tests/tickets/174/1.js' ] ],
			'tests/tickets/174/1'
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
		const benderPath = getBenderAffectedPaths(changedFiles);

		assert.strictEqual(benderPath.includes(expectedPath), shouldInclude);
	}
}