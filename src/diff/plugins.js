// Each plugin which depends on other plugins has 'requires' value defined in its 'plugin.js' file.
// For example 'autoembed' plugin has 'requires' like:
//
//	plugin code...
//	requires: 'autolink,undo',
//	plugin code...
//
// This means 'autoembed' plugin depends on the required plugins. So any change in the required plugins may also break 'autoembed' plugin.
// The 'dependency map' is build by scanning all the plugins and extracting dependencies in the form of:
//
//	dependee: [ ...dependents ]
//
// So in the above case the resulting map will be:
//
// autolink: [ autoembed ],
// undo: [ autoembed ]

const { readdirSync, existsSync, readFileSync } = require( 'fs' );
const { normalize: normalizePath, join: joinPath, resolve: resolvePath } = require( 'path' );

// Builds plugins dependency map.
function buildDependencyMap( pluginsDir ) {
	const pluginsAbsoluteDir = resolvePath( normalizePath( pluginsDir ) );

	const allPluginAbsoluteDirs = readdirSync( pluginsAbsoluteDir, { withFileTypes: true } )
		.filter( resource => resource.isDirectory() )
		.map( directory => ( { path: joinPath( pluginsAbsoluteDir, '/', directory.name,'/' ), name: directory.name } ) )
		.filter( directory => existsSync( joinPath( directory.path, 'plugin.js' ) ) );

	const dependencies = allPluginAbsoluteDirs.reduce( ( previous, current ) => {
		const requiredPlugins = getPluginDependencies( current.path );

		requiredPlugins.forEach( requiredPlugin => {
			previous[ requiredPlugin ] = previous[ requiredPlugin ] || [];
			previous[ requiredPlugin ].push( current.name );
		} );

		return previous;
	}, {} );

	return dependencies;
}

// Extracts "requires: 'pluginName1,pluginName2'" phrase from the main plugin file from the specific directory (pluginDir/plugin.js).
function getPluginDependencies( pluginDir ) {
	const pluginContents = readFileSync( joinPath( pluginDir, 'plugin.js' ), 'utf8' );
	const dependencies = pluginContents.match( /requires\s?:\s*'([\w+,]*)'/i );

	return dependencies ? dependencies[ 1 ].split( ',' ) : [];
}

module.exports = {
	getDependencyMap: buildDependencyMap
};
