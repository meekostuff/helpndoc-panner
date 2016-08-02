HyperFrameset
=============

> HyperFramesets are the way HTMLFramesets were meant to work -
> super-stylesheets with seamless frames, document transforms and configurable routing. And history.pushState.

HyperFrameset is a light-weight Javascript [transclusion](http://en.wikipedia.org/wiki/Transclusion)
and layout engine which runs in the browser.
Whilst the implementation relies on AJAX and `history.pushState`,
conceptually the design is an evolution of HTMLFramesets.

The primary advance is that the landing page initiates loading of
the frameset document, not the other way round.
HyperFrameset is consistent with the principles of
[Progressive Enhancement](http://en.wikipedia.org/wiki/Progressive_enhancement) and
[Resource Oriented Client Architecture](http://roca-style.org/ "ROCA").

**WARNING:** THIS PROJECT IS ALPHA SOFTWARE. ONLY USE IT FOR EXPERIMENTATION.

### Browser support

HyperFrameset requires features only available in recent versions of popular browsers, 
but sites that adapt well to HyperFrameset will (probably)
have full functionality when HyperFrameset doesn't run.

HyperFrameset can run on browsers which support `history.pushState` and `MutationObserver`.
These are available on most browsers in significant use today.
Since `MutationObserver` is NOT supported on IE10, HyperFrameset uses `MutationEvents` on that platform. 

### License

HyperFrameset is available under 
[MPL 2.0](http://www.mozilla.org/MPL/2.0/ "Mozilla Public License version 2.0").
See the [MPL 2.0 FAQ](http://www.mozilla.org/MPL/2.0/FAQ.html "Frequently Asked Questions")
for your obligations if you intend to modify or distribute HyperFrameset or part thereof. 

### Contact

If you have any questions or comments, don't hesitate to contact the author via
[web](http://meekostuff.net/), [email](mailto:shogun70@gmail.com) or [twitter](http://twitter.com/meekostuff). 

**WARNING:** THIS DOCUMENTATION IS A WORK-IN-PROGRESS.
SOME OF IT MAY BE OUT-OF-DATE. MOSTLY IT IS JUST TOO LONG AND DISORGANISED. 
A BETTER UNDERSTANDING WILL BE GAINED THROUGH EXPLORING A DEMO - VIEW SOURCE IS YOUR FRIEND.


## Installation

1. Copy or clone the HyperFrameset project files to a directory on your server, say 
	
		/path/to/HyperFrameset/

2. Open a **modern** browser and navigate to the following page
	
		http://your.domain.com/path/to/HyperFrameset/test/normal.html
	
	Visually inspect the displayed page for the following possible failures:
	
	- boxes with **red** background or borders. 
	- boxes that claim to be styled with colored borders but just have the default border. 
	
3. Source the HyperFrameset boot-script into your pages with this line in the `<head>` of each page 
	
		<script src="/path/to/HyperFrameset/boot.js"></script>
		
	The boot-script 
	- MUST be in the `<head>` of the page
	- MUST NOT have `@async` or `@defer`
	- SHOULD be before any stylesheets - `<link rel="stylesheet" />` or `<style>`


## Quick Start

**TODO:** A better quick start would be copying a demo site.

Create some HTML pages with some page specific content (page.html). 
Any page specific scripts, styles or meta-data should go in `<head>`. 
The `<body>` may also contain fallback content, which is
only displayed if HyperFrameset is NOT enabled.

    <!DOCTYPE html>
	<html>
	<head>
		<!-- source the HyperFrameset boot-script -->
		<script src="/path/to/HyperFrameset/boot.js"></script>
		<title>Content</title>
		<!-- create a link to the frameset document. All attributes are needed -->
		<link rel="frameset" type="text/html" href="/frameset.html" />
		<!-- include fallback stylesheets for when HyperFrameset doesn't run. -->
		<style>
		.styled-from-page { background-color: red; color: white; }
		</style>
	</head>
	<body>
		<header>
		This fallback header will be removed from the page
		</header>
		
		<main><!-- Primary content -->
			<h1>Page One<h1>
			<div class="styled-from-frameset">
			This content is styled by the frameset stylesheet
			</div>	
			<div class="styled-from-page">
			This content is styled by the page stylesheet which will not apply in the frameset view. 
			</div>	
		</main>
		
		<footer>
		This fallback footer will be removed from the page
		</footer>
	</body>
	</html>
	
Create an index page (index.html).

	<!DOCTYPE html>
	<html>
	<body>
		<h1>Index page</h1>
		<nav>
			<a href="/page.html">Page One</a><br />
			<a href="/page2.html">Page Two</a>
		</nav>
	</body>
	</html>

Create the frameset document (frameset.html).
This is a normal page of HTML that, when viewed in the browser,
will appear as the final page without the page specific content. 

	<!DOCTYPE html>
	<html>
	<head>
		<style>
		.styled-from-frameset { border: 2px solid blue; }
		</style>
		<script for="hf-frameset">
		({
			lookup: function(url) { return 'hf_main'; } // the target for all same-scope hyperlinks
		})
		</script>
	</head>
	<body>
		<header>
		#header in frameset
		</header>
		
		<nav>
			<label>Navigation</label>
			<hf-frame targetname="hf_nav" type="html" src="scope:./index.html" main="nav">
				<hf-body></hf-body>
			</hf-frame>
		</nav>
		
		<main>
			<label>Primary Content</label>
			<hf-frame targetname="hf_main" type="html" main="main">
				<hf-body"></hf-body>
			</hf-frame>
		</main>
		
		<footer>
		#footer in frameset
		</footer>
	</body>
	</html>

When page.html is loaded into the browser, HyperFrameset will load frameset.html and apply it to the view,
inserting the `<main>` content from page.html into the `hf_main` frame,
and inserting the `<nav>` content from index.html into the `hf_nav` frame.

This process results in a DOM tree something like this:

	<!DOCTYPE html>
	<html>
	<head>
		<!-- source the HyperFrameset boot-script -->
		<script src="/path/to/HyperFrameset/boot.js"></script>
		<!-- create a link to the frameset document. All attributes are needed -->
		<link rel="frameset" type="text/html" href="/frameset.html" />
		<title>Content</title>
		<style>
		.styled-from-frameset { border: 2px solid blue; }
		</style>
		<!-- NOTE: no page specific style -->
	</head>
	<body>
		<header>
		#header in frameset
		</header>
		
		<nav>
			<label>Navigation</label>
			<hf-frame targetname="hf_nav" type="html" src="/index.html" main="nav">
				<hf-body>
					<a href="/page.html">Page One</a><br />
					<a href="/page2.html">Page Two</a>
				</hf-body>
			</hf-frame>
		</nav>
		
		<main>
			<label>Primary Content</label>
			<hf-frame targetname="hf_main" type="html" main="main">
				<hf-body>
					<h1>Page One<h1>
					<div class="styled-from-frameset">
					This content is styled by the frameset stylesheet
					</div>	
					<div class="styled-from-page">
					This content is styled by the page stylesheet which will not apply in the frameset view. 
					</div>	
				</hf-body>
			</hf-frame>
		</main>
		
		<footer>
		#footer in frameset
		</footer>
	</body>
	</html>


## Documentation

[For more details read the documentation](doc/)

