/* START HyperFrameset boot options */

/*
This code MUST run before the boot-script.
  EITHER
Prepend this code to the boot-script (for performance)
  OR 
Source this file into the page before sourcing the boot-script (to simplify reconfiguration)
*/

var Meeko = window.Meeko || {};
Meeko.options = { // these are the default values
	"no_boot": false, // a debugging option. Abandon boot immediately. 
	"no_frameset": false, // use feature / browser detection to set this true. Also disables capturing. 
	"no_style": false, // a demo option. `no_frameset` plus remove all stylesheets. 
	"file_access_from_files": false, // whether to support file: URLs when possible
	"capturing": true, // false, "auto", true, "strict"
	"log_level": "warn", // debug, info, warn, error, none
	"hidden_timeout": 3000,
	"startup_timeout": 10000, // abort if startup takes longer than this
	"polling_interval": 50,
	"html5_block_elements": 'article aside figcaption figure footer header hgroup main nav section',
	"html5_inline_elements": 'abbr mark output time audio video picture',
	"main_script": '{bootscriptdir}HyperFrameset.js', // use an abs-path or abs-url
	"config_script": '{bootscriptdir}config.js' // can be a script-url OR a function
};

/* END HyperFrameset boot options */
