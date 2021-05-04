const assert = require( 'assert' );
const { convertFilesStatusIntoBenderFilter } = require( '../src/diff/diffAnalyzer' );

const dependencyMapMock = { ajax: [ 'cloudservices', 'emoji' ] };

describe('bender paths extractor', function() {

	it('returns test path for file if ticket test file was added',
		assertPaths(
			[ [ 'A', 'tests/tickets/174/1.js' ] ],
			'path:/tests/tickets/174'
		)
	);

	it('returns test path for plugin if plugin tests file was modified',
		assertPaths(
			[ [ 'M', 'tests/plugins/ajax/ajax.js' ] ],
			'path:/tests/plugins/ajax'
		)
	);

	it('do not includes test if manual test was modified',
		assertPaths(
			[['M', 'tests/plugins/ajax/manual/optionalcallback.html']],
			'path:/tests/plugins/ajax/manual/optionalcallback',
			false
		)
	);

	it('include all non-manual plugin tests if helper or asset in plugin tests was modified',
		assertPaths(
			[['M', 'tests/plugins/dialog/_helpers/tools.js']],
			'path:/tests/plugins/dialog'
		)
	);

	it('do not includes path for deleted file',
		assertPaths(
			[ [ 'D', 'tests/tickets/174/1.js' ] ],
			'path:/tests/tickets/174',
			false
		)
	);

	it('include all core tests for changes in core',
		assertPaths(
			[ [ 'M', 'core/ckeditor.js' ] ],
			'group:Core'
		)
	);

	it('include all adapters tests for changes in adapters',
		assertPaths(
			[ [ 'M', 'adapters/jquery.js' ] ],
			'group:Adapters'
		)
	);

	it( 'include all test for plugin if plugin code changed',
		assertPaths(
			[ [ 'M', 'plugins/ajax/plugin.js' ] ],
			'path:/tests/plugins/ajax'
		)
	);


	it( 'do not include duplicates',
		assertPaths(
			[
				[ 'M', 'plugins/ajax/plugin.js' ],
				[ 'A', 'plugins/ajax/samples/image.png' ]
			],
			[ 'path:/tests/plugins/ajax' ]
		)
	);

	it( 'has no empty entries', function() {
		const files = [
			[ 'M', 'plugins/ajax/plugin.js' ],
			[ 'A', 'plugins/ajax/samples/image.png' ]
		];

		const filters = convertFilesStatusIntoBenderFilter( files, dependencyMapMock );

		assert(!filters.includes(''));
	} );

});

function assertPaths( changedFiles, expectedPath, shouldInclude = true ) {
	return function () {
		const benderPaths = convertFilesStatusIntoBenderFilter( changedFiles, dependencyMapMock );

		if( shouldInclude ) {
			assert.deepStrictEqual( benderPaths, [ expectedPath ] );
		} else {
			assert.notDeepStrictEqual( benderPaths, [ expectedPath ] );
		}
	};
}
