var assert = require('assert');
const { convertFilesStatusIntoBenderFilter } = require('../src/diff/diffAnalyzer');

describe('bender paths extractor', function() {
	it('returns test path for file if ticket test file was added',
		MakePathTest(
			[ [ 'A', 'tests/tickets/174/1.js' ] ],
			'path:/tests/tickets/174'
		)
	);

	it('returns test path for plugin if plugin tests file was modified',
		MakePathTest(
			[ [ 'M', 'tests/plugins/ajax/ajax.js' ] ],
			'path:/tests/plugins/ajax'
		)
	);

	it('do not includes test if manual test was modified',
		MakePathTest(
			[['M', 'tests/plugins/ajax/manual/optionalcallback.html']],
			'path:/tests/plugins/ajax/manual/optionalcallback',
			false
		)
	);

	it('include all non-manual plugin tests if helper or asset in plugin tests was modified',
		MakePathTest(
			[['M', 'tests/plugins/dialog/_helpers/tools.js']],
			'path:/tests/plugins/dialog'
		)
	);

	it('do not includes path for deleted file',
		MakePathTest(
			[ [ 'D', 'tests/tickets/174/1.js' ] ],
			'path:/tests/tickets/174',
			false
		)
	);

	it('include all core tests for changes in core',
		MakePathTest(
			[ [ 'M', 'core/ckeditor.js' ] ],
			'group:Core'
		)
	);

	it( 'include all test for plugin if plugin code changed',
		MakePathTest(
			[ [ 'M', 'plugins/ajax/plugin.js' ] ],
			'path:/tests/plugins/ajax'
		)
	);

	it( 'do not include duplicates', 
		MakeMultipleResultsTest(
			[
				[ 'M', 'plugins/ajax/plugin.js' ],
				[ 'A', 'plugins/ajax/samples/image.png']
			],
			['path:/tests/plugins/ajax']
		)
	);

});

function MakePathTest(changedFiles, expectedPath, exists) {
	const shouldInclude = exists === undefined ? true : exists;

	return function () {
		const benderPaths = convertFilesStatusIntoBenderFilter( changedFiles );
		if(shouldInclude) {
			assert.strictEqual(benderPaths[0], expectedPath );
		} else {
			assert.notStrictEqual(benderPaths[0], expectedPath );
		}
	};
}

function MakeMultipleResultsTest(changedFiles, expectedPaths) {

	return function () {
		const benderPaths = convertFilesStatusIntoBenderFilter( changedFiles );
		assert.deepStrictEqual(benderPaths, expectedPaths );
	};
}