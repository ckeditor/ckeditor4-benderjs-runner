const assert = require( 'assert' );
const { convertFilesStatusIntoBenderFilter } = require( '../src/diff/diffAnalyzer' );

const dependencyMapMock = { ajax: [ 'cloudservices', 'emoji' ] };

describe( 'bender paths extractor', function() {

	it( 'returns test path for file if ticket test file was added',
		assertPaths(
			[ [ 'A', 'tests/tickets/174/1.js' ] ],
			[ 'path:/tests/tickets/174' ]
		)
	);

	it( 'returns test path for plugin if plugin tests file was modified',
		assertPaths(
			[ [ 'M', 'tests/plugins/ajax/ajax.js' ] ],
			[ 'path:/tests/plugins/ajax' ]
		)
	);

	it( 'do not includes test if manual test was modified',
		assertPaths(
			[ [ 'M', 'tests/plugins/ajax/manual/optionalcallback.html' ] ],
			[ 'path:/tests/plugins/ajax/manual/optionalcallback' ],
			false
		)
	);

	it( 'include all non-manual plugin tests if helper or asset in plugin tests was modified',
		assertPaths(
			[ [ 'M', 'tests/plugins/dialog/_helpers/tools.js' ] ],
			[ 'path:/tests/plugins/dialog' ]
		)
	);

	it( 'do not includes path for deleted file',
		assertPaths(
			[ [ 'D', 'tests/tickets/174/1.js' ] ],
			[ 'path:/tests/tickets/174' ],
			false
		)
	);

	it( 'include all core tests for changes in core', function() {
		const dependencyMapMock = {
			'dialog': [ 'fakeDialogDep' ],
			'widget': [ 'fakeWidgetDep' ],
			'clipboard': [ 'fakeClipboardDep' ]
		};
		assertPaths(
			[ [ 'M', 'core/ckeditor.js' ] ],
			[
				'group:Core',
				'path:/tests/plugins/dialog',
				'path:/tests/plugins/fakeDialogDep',
				'path:/tests/plugins/widget',
				'path:/tests/plugins/fakeWidgetDep',
				'path:/tests/plugins/clipboard',
				'path:/tests/plugins/fakeClipboardDep',
			],
			true,
			dependencyMapMock
		)();
	} );

	it( 'include all adapters tests for changes in adapters',
		assertPaths(
			[ [ 'M', 'adapters/jquery.js' ] ],
			[ 'group:Adapters' ]
		)
	);

	it( 'include all test for plugin if plugin code changed',
		assertPaths(
			[ [ 'M', 'plugins/ajax/plugin.js' ] ],
			[
				'path:/tests/plugins/ajax',
				'path:/tests/plugins/cloudservices',
				'path:/tests/plugins/emoji'
			]
		)
	);


	it( 'do not include duplicates',
		assertPaths(
			[
				[ 'M', 'plugins/ajax/plugin.js' ],
				[ 'A', 'plugins/ajax/samples/image.png' ]
			],
			[
				'path:/tests/plugins/ajax',
				'path:/tests/plugins/cloudservices',
				'path:/tests/plugins/emoji'
			]
		)
	);

	it( 'has no empty entries', function() {
		const files = [
			[ 'M', 'plugins/ajax/plugin.js' ],
			[ 'A', 'plugins/ajax/samples/image.png' ]
		];

		const filters = convertFilesStatusIntoBenderFilter( files, dependencyMapMock );

		assert( !filters.includes( '' ) );
	} );

});

function assertPaths( changedFiles, expectedPaths, shouldInclude = true , dependencyMap = dependencyMapMock  ) {
	return function () {
		const benderPaths = convertFilesStatusIntoBenderFilter( changedFiles, dependencyMap );

		if ( shouldInclude ) {
			assert( containsSameElements( benderPaths, expectedPaths ),
				`Expected:\n ${ expectedPaths } \n but got:\n ${ benderPaths }`
			);
		} else {
			assert( !includesAny( benderPaths, expectedPaths ),
				`Generated paths:\n ${ benderPaths } shoud NOT cointains any of\n ${ expectedPaths }`
			);
		}
	};
}

function containsSameElements( actual, expected ) {
	// Two arrays have the same length.
	// They contains the same elements, but not necessary in the same order.
	// There are no duplicates in actual array
	if ( actual.length !== expected.length ) {
		return false;
	}

	const hasDuplicates = new Set( actual ).size !== actual.length;
	if ( hasDuplicates ) {
		return false;
	}

	return includesAny( actual, expected );
}

function includesAny( actual, expected ) {
	for ( let expectedFilter of expected ) {
		if ( !actual.includes( expectedFilter ) ) {
			return false;
		}
	}

	return true;
}
