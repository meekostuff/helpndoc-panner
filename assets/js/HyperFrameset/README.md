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


Installation
------------

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


Quick Start
-----------

**Although this is not the preferred way of specifying the hyperframeset, it is still the default and is conceptually easiest to understand.**  
**TODO:** A better quick start would be copying a demo site.

Create a HTML document (page.html) with some page specific content. 
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
inserting the `<main>` content from page.html into the `hf_main` frame.

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


### How it works (approximately)

When the browser first visits a page in a HyperFrameset enabled site, the following startup sequence is applied:

1. a small boot-script is loaded
2. if the browser can't support HyperFrameset then startup is abandoned (leaving the page unframed)
3. the HyperFrameset script and config-script are loaded
4. the frameset document for the site is detected and loaded
5. the unframed landing-page in the browser view is replaced by the frameset document
6. the main content of the unframed page (and that of any other pages referenced by frames in the frameset document) is inserted into the view

When a hyperlink in the view is activated the following navigation sequence is applied:

1. If the hyperlink is to an external site then abandon scripted navigation and allow normal browser navigation
2. Examine the hyperlink URL and event-source to find the appropriate target frame and whether the address-bar URL needs updating.
3. Load the hyperlinked page and insert into the appropriate target frame.
4. If the address-bar URL needs updating then call `history.pushState`


Overview
--------

The HTMLFrameset model is the starting point for the design of HyperFrameset. 
This model has been evolved in the following important ways. 

### The frameset document is like a super-stylesheet

With HTMLFramesets the browser must first open the frameset document which in turn loads primary and auxiliary content in frames.
This has the undesirable consequence that the URL in the address-bar doesn't match the URL of the primary content.

<small>**This will also be the case with more flexible HTMLFrameset-like sites that rely on `<iframe>` instead of `<frame>`.**</small>

With HyperFrameset, when the browser visits a landing-page the appropriate frameset document is loaded and *applied* via AJAX,
with the landing-page content inserted into its appropriate frame 
and auxiliary content loaded into frames as defined by the frameset. 
Hyperlink navigation within the same site is managed by AJAX and history.pushState,
so the URL in the address-bar automatically matches the URL of the primary content.

**NOTE:**

- A frameset document is similar to an external stylesheet in that it can be shared between several pages.
	It may even be referenced with a resource link in the content page, just like stylesheets:
	
		<link rel="frameset" type="text/html" href="frameset.html" />
	
	<small>**(This referencing method depends on the configuration. Scripted frameset lookup is preferred.)**</small>

- The frameset document is still HTML.

### Framed documents are **content-only**

HTMLFramesets fostered a site and page design where the content of individual pages
was the primary content that matched the page URL **and no other content**.
But because HTMLFrameset frames create a new browsing context 
they did allow each page to be scripted and styled in isolation from the containing frameset. 

The HyperFrameset model does not provide this scripting and styling isolation and 
more-over it considers that the primary content of a page is the only aspect of relevance to the frameset view. 
For this reason, scripts and stylesheets are stripped from content pages before they are inserted into the frameset view.

### Frames are seamless

HyperFrameset frames don't create a new browsing context with `<frame>` or `<iframe>`,
so their content automatically inherits styles from their including context.
This means that styling for all framed content is provided by the frameset document,
as you would expect from a super-stylesheet. 

HyperFrameset frames are declared with markup like

    <hf-frame src="..."></hf-frame>

so they look like HTMLIFrames, but don't imply a new browsing context. 

### CSS is used for layout

With HTMLFramesets, `<frameset>` elements provide layout, splitting a region into either rows or columns of `<frame>`s or `<frameset>`s.

With HyperFrameset there is no equivalent to `<frameset>` elements, frames can be placed anywhere in the frameset document and layout is done with CSS.
In this regard HyperFrameset frames are more like `<iframe>`s.

### Frames can have different presentations for different states.

Since HyperFrameset is implemented with AJAX it has complete control of frame presentation,
whether the frame is `blank`, `loading` or `loaded`.
The frameset can define appropriate presentation with conditional frame bodies, such as

    <hf-frame>
	    <hf-body condition="loaded">
		...
		</hf-body>
	    <hf-body condition="loading">
		...
		</hf-body>
	    <hf-body condition="blank">
		...
		</hf-body>
	</hf-frame>

Control over frame presentation can also be extended to effects for page transitions,
when a frame unloads content from one URL and loads content from the next URL.
(Transition effects have not been implemented yet)

### Framed documents can be transformed

A page that is being viewed standalone - perhaps because JS is disabled or failed, or the browser is out-of-date -
will benefit from a basic stylesheet and some basic site navigation and auxiliary content.
HyperFrameset will strip the stylesheet and has some basic ability to crop the primary content of the page,
but what if the structure of the content when displayed in the frameset 
needs to be significantly different to that in the standalone case?

HyperFrameset provides the capability of HTML-to-HTML transformation of content pages through script or templating.
The defining markup for transformation might look like

    <hf-frame>
		<hf-body>
			<hf-transform type="script">
			({
				transform: function(content) {
				...
				}
			})
			</hf-transform>
		</hf-body>
	</hf-frame>

NOTE: Transformations facilitate dynamic declaration of `<hf-frame>`s.

### Targets for hyperlinks are scriptable

With HTMLFramesets the target frame for a hyperlink in any particular frame is (by default)
obtained from the `target` attribute on the hyperlink itself.
This requires the framed document to have an understanding of the structure of the frameset in which it is placed.

With HyperFrameset the target frame is obtained from a callback function defined in *the frameset document*. 

### Frameset documents are definitions

With HTMLFramesets the frameset document is a *declaration* of browser presentation,
and there will be a one-to-one mapping of HTMLFrames in the view and `<frame>` declarations in the frameset document.

With HyperFrameset the frameset document is a *definition* of browser presentation,
and any `<hf-frame>` in the frameset document could be *both* a declaration of a frame instance in the view *and*
a definition for other frame instances.

For the purpose of illustration:
A frame *definition* would have both a frame-body (without which it doesn't define anything)
and a definition ID (so it can be referenced). For example

    <hf-frame defid="hf_frame1">
		<hf-body>
		...
		</hf-body>
	</hf-frame>

A frame *declaration* (which isn't also a definition) would have no body and would reference a frame definition by definition ID.
For example

	<hf-frame def="hf_frame1"></hf-frame>

### Nested frames

With HTMLFramesets, `<frameset>` elements are nestable as long as they are a child of a `<frameset>`.

With HyperFrameset, a `<hf-frame>` is arbitrarily nestable inside another `<hf-frame>`.
When this is combined with document transformation it makes dynamically loaded hierarchical-menus and directory-trees trivial, for example

- the frameset document has a `<hf-frame>` that sources a master page which contains hyperlinks to sections of the site.
    The `<hf-frame>` defines a transform which processes some of those hyperlinks
	into `<hf-frame>`s which are in turn loaded into the view.
	
- a directory tree is split into several files, each containg one sub-directory. 
    A navigation section in the frameset has a `<hf-frame>` that sources the top level file of the directory tree.
	The `<hf-frame>` also defines a transform which converts sub-directory hyperlinks 
	into `<hf-frame>`s that source the sub-directory and apply the *same transform* as for the root directory. 


Developing a Site
-----------------

> Perfection is achieved not when there is nothing left to add, but when there is nothing left to take away.
> -- <cite>Antoine de Saint-Exupery</cite>

<small>HyperFrameset can be used for a whole site, or for a section within a site (say a documentation set).
In the following, "site" can also refer to a section within a site.</small>

A general reminder when developing a site is to stop adding stuff to individual pages:

- don't add site navigation or contact forms to pages - they need their own page
- don't add placeholder tags to pages
- don't add presentation classes to elements
- don't add inline styles to elements


### Site Design

**HINT:** Think [API first](http://thinkbda.com/journal/the-long-web/), HTML payload.

- Site navigation (or a Table-of-Contents) is a resource. It should have its own page.
- Anything requiring a form submission is a resource. It should have its own page.
- You should be able to (eventually) navigate to any resource by starting at the home page (or Table-of-Contents page).
- If every page has a link to the home page then you can navigate (eventually) from any entry point to any other resource.
- Don't forget Search Engine Optimization. (**TODO:** expand on this)

A reasonable illustration of a simple site is the [GNU make manual](http://www.gnu.org/software/make/manual/html_node/).
- The table-of-contents has its own URL
- Each page contains only primary content and some minimal contextual links - Contents / Index / Up / Previous / Next
- There is (nearly) no inline styling
- If you remove all styling it is still readable


### Page Design

To work with HyperFrameset, an individual page only needs to contain the primary content for its URL.

However, sometimes HyperFrameset will not be able to apply the frameset document to the page.
This can occur because

- Javascript is disabled
- HyperFrameset does not support the browser
- the HyperFrameset script failed to download
- HyperFrameset is configured to NOT start
- the frameset document failed to download

In this scenario you would like the content-page to have some auxiliary content and basic styling -
something that can be dispensed with if HyperFrameset takes over. 


#### Auxiliary content

Any landing-page content that isn't referenced by the frameset document
will be removed from the page when the frameset is applied. 

**RECOMMENDATION:** Wrap the *primary content* of content pages in a `<main>` or `<div role="main">` element.
The default processing of content pages (a `<hf-frame>` with no `<hf-transform>`) is to crop to this "main" element
(or the `<body>` if this isn't found). 

(**TODO:** point to some demo markup. Mention appropriate hyperlinks and how they can be used in scoping)

#### Stylesheets

All `<link rel="stylesheet">` or `<style>` elements in the content page 
will be removed when the frameset document is applied,
so you can use them for fallback presentation
without worrying about clashes with styling provided by the frameset document.

**WARNING:** Inline styles are not removed by HyperFrameset and SHOULD NOT be used in content pages.

#### Scripts

Scripts in content pages are NEVER run by HyperFrameset 
so they COULD be used for fallback actions.
If HyperFrameset does apply **and** `capturing` of the landing-page is enabled,
then scripts in the landing page are disabled anyway.
However, if HyperFrameset does apply but `capturing` is not enabled,
then there is a potential clash between the actions of the landing page scripts and HyperFrameset processing.

**RECOMMENDATION:** Content-pages do not need and SHOULD NOT have scripts, even for fallback.


Startup Configuration
---------------------

### Preparation

Assuming the default [installation](#installation) was successful,
use these steps to prepare for site specific configuration.

1. Copy `options.js` **and** `config.js` from the HyperFrameset directory to the root directory of your domain.
	
	If you have unix shell access to the domain's server 
	
			cd /directory/of/your/domain
			cp path/to/HyperFrameset/options.js path/to/HyperFrameset/config.js .

2. Edit your copy of `options.js` to change the following lines
	
			"main_script": '{bootscriptdir}HyperFrameset.js',
			"config_script": '{bootscriptdir}config.js'
	
	to be
	
			"main_script": '/path/to/HyperFrameset/HyperFrameset.js',
			"config_script": '/config.js'

3. Concatenate your modified `options.js` with `boot.js` from the HyperFrameset directory
and store in `boot.js` of the root directory.
	
			cat options.js path/to/HyperFrameset/boot.js > boot.js

4. Source the modified HyperFrameset boot-script into your pages -
preferably before any stylesheets - 
with this line in the `<head>` of each page 
	
			<script src="/boot.js"></script>

5. Make sure to test the modifications.  
	You could symlink to the test directory from the root directory
	
			ln -s path/to/HyperFrameset/test
	
	then navigate in the browser to
	
			http://your.domain.com/test/normal.html


Now you have a simple setup allowing you to:

- modify your options without affecting the HyperFrameset installation, and
- update HyperFrameset without overwriting your options.

When you want to:

+ modify options
	- edit your copy of `options.js`
	- repeat step 3 to rebuild your boot-script

+ update HyperFrameset
	- overwrite the HyperFrameset directory with the latest version
	- repeat step 3

+ minify HyperFrameset.js
	- minify HyperFrameset.js to HyperFrameset.min.js in the /path/to/HyperFrameset directory
	- change `main_script` to `/path/to/HyperFrameset/HyperFrameset.min.js` in your copy of the `options.js` file
	- repeat step 3

+ minify boot.js
	- minify boot.js to boot.min.js in the /path/to/HyperFrameset directory
	- repeat step 3 with `path/to/HyperFrameset/boot.min.js`


<a id="boot-options"></a>
### Boot options

These options aren't specifically related to the operation of HyperFrameset. 
The boot-script has the following options (default values in **bold**).

- log_level: "none", "error", **"warn"**, "info", "debug"
- polling_interval: **50** (milliseconds)
- no_style: **false**, true
- no_frameset: **false**, true
- capturing: false, "auto", **true**, "strict"
- hidden_timeout: **3000** (milliseconds)
- startup_timeout: **10000** (milliseconds)
- html5\_block\_elements: **"article aside figcaption figure footer header hgroup main nav section"**
- html5\_inline\_elements: **"abbr mark output time audio video picture"**
- config_script: **"{bootscriptdir}config.js"**
- main_script: **"{bootscriptdir}HyperFrameset.js"**

Sources for options are detailed below. 


#### From `Meeko.options`

**NOTE** this is how options are set in `options.js`.  
Options can be **preset** by script, like this:

    <script>
	var Meeko = window.Meeko || (window.Meeko = {});
	Meeko.options = {
		log_level: "info",
		hidden_timeout: 1000
	};
	</script>

This tells HyperFrameset to
- log 'info', 'warn' and 'error' messages
- hide the page until all frameset-resources are loaded *or*
	1000 milliseconds (1 second) have elapsed, whichever comes *first*.

#### From localStorage and sessionStorage
When debugging a page you probably don't want to modify the page source to change HyperFrameset options,
especially as you may have to change them back after you've found the problem.
For this reason HyperFrameset reads `sessionStorage` and `localStorage` at startup, looking for config options.
`sessionStorage` options override those found in `localStorage`, which in turn override those in data-attributes.

Config options are read from JSON stored in the `Meeko.options` key. Thus the following would disable hiding of the landing-page and turn on `debug` logging.

	sessionStorage.setItem(
		'Meeko.options', 
		JSON.stringify({ 
			hidden_timeout: 0, 
			log_level: "debug" 
		}) 
	);

_Note_ that the page would require a refresh after these settings were made.


### Capturing the Landing Page

The **capturing** [boot option](#boot-options) prevents normal browser parsing of the *landing page*.  
This allows HyperFrameset to manage parsing in the same way that AJAXed pages are handled.
The main benefits of this would be:

- other `<script>`s in the landing-page are disabled

- because `<link>` and `<img>` resources aren't automatically downloaded they can be changed (or removed) with no penalty.

The drawbacks are:

- parsing and displaying of content doesn't begin until the landing-page has fully down-loaded.
  On long pages over slow networks this will have quite a noticeable delay before any content is viewable. 

The article "[Capturing - Improving Performance of the Adaptive Web](https://hacks.mozilla.org/2013/03/capturing-improving-performance-of-the-adaptive-web/)"
provides a short description and discussion of this approach.

#### Restrictions

1. The boot-script must be within - or before - `<head>`.
2. The boot-script should be the first `<script>` in the page.
3. If within `<head>` the boot-script should only be preceded by `<meta http-equiv>` elements.

Capturing should be enabled by setting the **capturing** boot option to "strict". This enforces all the preceding restrictions.

Setting the option to true only enforces the first restriction, with warnings given about the other two.


The Frameset Overseer
---------------------

Before a frameset document can be loaded, 
HyperFrameset must discover which frameset document is right for the landing-page.

Before responding to a hyperlink activation, 
HyperFrameset must determine whether the hyperlinked page can share the currently applied frameset document.

The entity which oversees the frameset and frames is called the `framer`, and it has a JS reference object `Meeko.framer`.
This object is available once the HyperFrameset script has loaded.

### Configuration

`framer` options are stored in `Meeko.framer.options`,
which can be accessed directly or preferably by calling 

	Meeko.framer.config(options);
	
where `options` is an object containing key / value pairs
that will overwrite current values.

Configuration should be done before HyperFrameset starts. 
This can be achieved by editing the site-specific `config.js` created during [Preparation](#preparation).

Usually you only want to configure how HyperFrameset determines the appropriate frameset-document for a page. 
Do this by providing one of the following options: 

- **`detect(doc)`** 
	MUST return the frameset-URL by inspecting the current page when HyperFrameset starts (this doesn't allow panning)

- **`lookup(url)`**
	MUST return the frameset-URL for any URL in the site, either the current `document.URL`,
	or the URL of a different page that is to be panned in.

`lookup(url)` is the recommended option.
`detect(doc)` is mainly provided for backwards compatibility,
as can be seen in the default `config.js` script. 

**TODO:**

- Explain `scope` and how it is implied


Frameset Document
-----------------

When the frameset document has loaded, the `<body>` is separated and used to create the frameset definition.
The remainder of the document - the `<html>`, `<head>` and children - replaces the landing-page in the browser view.
After this replacement the window state should be as though the frameset document was the landing-page. 

**TODO:**

- xml and custom namespaces on `<html>`
- changing the namespace for HyperFrameset


<a id="script-handling"></a>
### `<script>` handling

- Scripts in the `<head>` of the frameset document 
	are executed via dynamic script insertion, 
	but behave **like** scripts that are part of a landing page. 
	So earlier scripts block later scripts 
	unless the earlier script has the `src` **and** `async` attributes. 

	    <script src="..." async></script>
    

	These scripts are **enabled** AFTER all the content in the `<head>` of the frameset 
	is INSERTED INTO the page.

- Scripts in the `<body>` of the frameset document MUST NOT have a `src` attribute. 
	They are ignored if they do.
- Scripts containing an empty `for` attribute are options scripts attached to 
	the previous non-`<script>`, non-`<style>` element 
	(either a previous sibling or the parent of the script). 
	The script MUST NOT have a `src` attribute, and is evaluated with  
 
        (Function('return (' + script.text + ');'))()


	For example:
    
	    <script for>
	    ({
	        lookup: function(url) { }
	    })
	    </script>
	
	This is a valid yet inert script when not handled by HyperFrameset.

- Scripts containing a non-empty `for` attribute are ignored.
- Other scripts are executed via dynamic script insertion.


Frameset Definition
-------------------

The frameset definition is created by processing the `<body>` of the frameset document.
Every `<hf-frame>` is **both** a frame definition and a frame declaration,
unless it has a `def` attribute in which case it is only a declaration - `@def` will contain the ID of a frame definition. 

Each frame definition is added to the list of definitions maintained in the frameset definition.

Each frame declaration has its children - if any - removed.

The result of this processing is list of frame definitions which contain
zero or more frame declarations as descendants.
Likewise, the `<body>` will contain one or more frame declarations as descendants.

After processing, the `<body>` is inserted into the browser view.
Its contained frame declarations are automatically handled,
typically by fetching and rendering the frame `@src`.
These renderings may insert more frame declarations which are again automatically handled.

### Configuration

Any `<script for>` in the `<body>` is used to 
to generate an options object for the "associated element", see
[script-handling](#script-handling).

The script SHOULD have a format like

    <script for>
	({
		lookup: function(url) { }
	})
	</script>
    
This options object will configure how HyperFrameset determines 
the appropriate frame target for `requestnavigation` events 
triggered by clicks on hyperlinks or form-submission (GET only).

The following callbacks can be configured

- **`lookup(url, details)`**
	return the target frame `targetname` for the landing-page URL or a `requestnavigation` event.  
	For `requestnavigation` events the `details` object has the following fields:
		+ url: the URL to be navigated to
		+ element: the source element for the event (`<a href>` or `<form method="get">`)
		+ referrer: the current document.URL
	If this method returns a valid target frame `targetname` then 
	pushState-assisted-navigation is initiated
	and frames with that target `targetname` are loaded with the hyperlinked resource.  
	If it returns `true` then the `requestnavigation` event is cancelled.
	Otherwise the `requestnavigation` event continues to bubble, 
	where it might be handled elsewhere or eventually 
	result in a normal browser navigation being performed.

The `lookup()` callback can be configured for any of
`<hf-frame>`, `<hf-panel>`, `<hf-vlayout>`, `<hf-hlayout>`, `<hf-deck>`, `<hf-rdeck>`. 

It can also be configured for `<body>`, which means that it is used for 
determining the target-frame of the landing-page URL, and
for `requestnavigation` events will result in the document URL being changed. 


Frame Definition
----------------

    <hf-frame defid="hfdef_frameX">
		<hf-body condition="loaded">
			<hf-transform type="main">
			</hf-transform>
		</hf-body>
	</hf-frame>
	
### `<hf-frame>`

A frame definition must contain one or more `<hf-body>` elements.

If it is to be referenced by other frame declarations then it must also have an `@id`.

Since a frame definition is also a frame declaration it will typically contain
other attributes detailed in the [Frame Declaration](#Frame_Declaration) section.

### `<hf-body>`

A frame body is a container for frame content.

Within a frame definition it will contain one or more `<hf-transform>` child elements.

Within the browser view it will contain a processed representation of the document fetched from the frame's `@src`.
The processing involves applying each of the child transforms in turn -
the first transform is applied to the `@src` document,
subsequent transforms are fed the output of the previous transform.

**TODO:** `@condition`: `loaded`, `loading`, `uninitialized`
**TODO:** transition details

### `<hf-transform>`

The type of the transform is selected with `@type`.

There are three built-in transform types: `main`, `script`, `hazard`.

#### `main`

	<hf-transform type="main" main=".content">
	</hf-transform>
	
This transform identifies a single element in the source document that contains the primary content -
the identified element is not included in the primary content. 
This element can be identified with a CSS selector in the `main` attribute, e.g. `main=".content"`.
If `@main` is not defined then a sequential search is performed with `main`, then `[role=main]`, then `body`.

The transform element will contain no markup.

#### `script`

The transform SHOULD have a format like

	<hf-transform type="script">
    <script for>
	({
		transform: function(fragment) { }
	})
	</script>
	</hf-transform>
    
The script MUST NOT have a `src` attribute, and is evaluated with

    (Function('return (' + script.text + ');'))()

to generate a `processor` object for the transform. The transformation is performed by calling
	
	processor.transform(fragment);
	
which is passed either the source document or a document-fragment,
and must return a document-fragment. 

#### `hazard`

	<hf-transform type="hazard" format="css">
	<!-- Your HTML template here -->
	<nav>
	  <haz:each select=".navigation ul li">
	    <div>
	      <span expr:_html="a"></span><!-- span.innerHTML = a.outerHTML -->
	    </div>
	  </haz:each>
	</nav>
	</hf-transform>

This provides a simple templating service.
The content will be HTML with special templating elements and attributes,
which include directives such as `<haz:if>`
and data expressions such as `@expr:href`.

Directives and data expressions are interpreted using a data provider
which is selected by `@format`. Current `format` options are `css`, `microdata`, `json`.

##### Directives

###### `<haz:if>`

	<haz:if test="expression">...</haz:if>

The contents of this element will be part of the output only if the expression evaluates to `true`.

###### `<haz:unless>`

	<haz:unless test="expression">...</haz:unless>

The contents of this element will be part of the output only if the expression evaluates to `false`.

###### `<haz:choose>`, `<haz:when>`, `<haz:otherwise>`

	<haz:choose>
		<haz:when test="expression1">...</haz:when>
		<haz:when test="expression2">...</haz:when>
		<haz:otherwise>...</haz:otherwise>
	</haz:choose>

The `<haz:choose>` element will be replaced by the contents of 
the first child `<haz:when>` whose expression evaluates to `true`, 
or (if none of them do) the contents of `<haz-otherwise>` child elements.

###### `<haz:each>`

	<haz:each select="expression">

The contents of this element will be repeated in the output 
for each item found by the expression. 
If zero items are found then the contents will not be in the output at all.

###### `<haz:template>`

	<haz:template name="ID">

The element will be used to *replace* an `<haz:include>` element identified by `ID`.

###### `<haz:include>`

	<haz:include name="ID">

The element will be *replaced* with 
the contents of the `<haz:template>` element identified by `ID`.
This template must be in the *current* hazard transform.

**TODO:** `<haz:eval>`, `<haz:text>`, `<haz:mtext>`

##### Directives as attributes

There are a few HTML elements which cannot be wrapped inside arbitrary elements.
For example, when parsing a HTML table any unexpected non-table-tags 
between `<table>` and `<td>` are dropped from the output.

In this situation you cannot markup with Hazard elements, 
but most of them can be implemented with attribute markup. 
These Hazard attributes are promoted to elements after parsing,
according to the following rules in order:

	<element haz:otherwise /> -> 
		<haz:otherwise><element /></haz:otherwise>

	<element haz:when="expression" /> -> 
		<haz:when test="expression"><element /></haz:when>

	<element haz:each="expression" /> ->
		<haz:each select="expression"><element /></haz:each>

	<element haz:if="expression" /> -> 
		<haz:if test="expression"><element /></haz:if>

	<element haz:unless="expression" /> -> 
		<haz:unless test="expression"><element /></haz:unless>

	<element haz:choose /> -> 
		<element><haz:choose /></element>

	<element haz:template="id" /> -> 
		<haz:template name="id"><element /></haz:template>


##### Data Expressions

These attributes have a name composed of a prefix then a colon (:) then a regular attribute name, e.g.

	expr:href
	
The prefix determines how the expression given in the attribute value is processed.
After processing the unprefixed attribute is set to the returned value.

If the returned value is `boolean` then the attribute is either removed (`false`) or added as an empty attribute (`true`).

If the attribute name is `_html` then the `innerHTML` of the element is set to the returned value
(or if a node is returned then all current children of the element are reoved and the node is appended to the element).

If the attribute name is `_text` then the `textContent` of the element is set to the returned value.

There are two possible prefixes: `expr` and `mexpr`.

*`expr:`* attribute values have the form (FIXME BNF or something)

	css-selector {attribute-name} | filter-name: params | filter-name: params
	
Filters are optional as is the `{attribute-name}`.

`attribute-name` can be a regular attribute or `_html` (for `innerHTML`) or `_text` (for `textContent`).

Filters can be registered with the (as yet undocumented) 
`Meeko.framer.registerFilter()` call.

The base filters are:

- `lowercase`
- `uppercase`
- `if: <value-if-input-trueish>`
- `unless: <value-if-input-falseish>`
- `if_unless: <value-if-input-trueish>, <value-if-input-falseish>`
- `match: <comparsion-text-or-regexp>, <value-if-match>, <value-if-not-match>`
- `replace: <text-or-regex-pattern>, <replacement-text>`
- `map: <array-of-regexp-output-pairs-or-dict-of-text-output-fields>`
- `date: <date-format>, <timezone>`

**TODO:** pad this out

*`mexpr:`* attribute values are plain-text with sections bounded by `{{` and `}}` being interpolated by the algorithm of `expr:` attributes.


Frame Declaration
-----------------

	<hf-frame def="hfdef_frameX" targetname="hf_frame1" src="scope:./index.html" main="main"></hf-frame>
	
When a frame declaration enters the browser view, its `src` attribute is interpreted as a URL and fetched.
Its `def` attribute is used to lookup a frame definition which will process the fetched document
and produce a rendering for the frame.

### Frame naming

Similar to `<frame>` and `<iframe>`, 
a frame declaration can have a `targetname` attribute,
which allows it to be a target for `requestnavigation` events.


Navigation Requests
-------------------

**NOTE:**
- `history.pushState` is a requirement for HyperFrameset. If it isn't available then HyperFrameset will not start.
- "PushState Assisted Navigation" (PAN) may sometimes be referred to as panning, as in [camera panning](http://en.wikipedia.org/Panning_\(camera\)). 


### `requestnavigation` event

User initiated browser navigation is triggered by `click` events which bubble through `<a href>` and by form submission.
HyperFrameset will (conditionally) prevent default browser handling of these events
and generate a `requestnavigation` event which itself has the default action of normal browser navigation.

The `requestnavigation` event has the following fields:

- `target`: the hyperlink or form element
- `detail`: the URL that will be navigated to by default

**TODO:**

- event.stopPropagation() / event.stopImmediatePropagation() are no-ops.
- use event.defaultPrevented / event.preventDefault() to determine default handling


### Hyperlink handling

The "hyperlink-element" is a `<a href>` found through the following steps:

1. Find the closest (self-or-ancestor) "linking-element" to the `click` event target.  
	A linking-element is a `<a href>` element **or** any element with the `link` attribute.  
2. If there is no linking-element then abandon the search, returning nothing.
3. If the linking-element is `<a href>` then return it as the hyperlink-element. 
4. Otherwise find the first descendant `<a href>` **or** `<link href>` of the linking-element and return it as the hyperlink-element. 
5. If there isn't one then return the closest `<a href>` ancestor of the linking-element.
6. If there isn't one then the search fails, returning nothing.

Interpret the hyperlink `href` as an absolute URL
which is used in triggering the `requestnavigation` event.
This **extends** standard browser behavior. 


### `<form>` handling

HyperFrameset ONLY handles forms where `@method="GET"`.

All other forms are NOT handled, which means the native browser behavior will apply
unless external code prevents the default-action and implements a different behavior.

You are encouraged to handle other forms in a site-specific manner. 

#### @method = GET

The form's `@action` and input values are processed to generate an absolute query URL
which is then used to trigger the `requestnavigation` event.
This will mimic standard browser behavior.


### `requestnavigation` handling

The `requestnavigation` event bubbles up from the hyperlink or form, potentially passing through frames (or other HyperFrameset elements) and then to the frameset.

Each element can potentially handle the event, if its `lookup()` callback returns a valid frame target `targetname`.
If it does then the `framer` takes charge of loading the resource and updating the target frame (or frames).
Panning is NOT used in this case - potentially cross-site URLs can be loaded. 

If no elements handle the event then the `framer` determines whether to perform panning or normal browser navigation. 

Some hyperlinks are not appropriate for panning and immediately trigger normal navigation:

- hyperlinks to pages on other sites 
- hyperlinks with a different protocol, e.g. `javascript:...`, `ftp:`
- anchor hyperlinks - `<a href="#skip">`

That leaves hyperlinks to other pages within the same site.

If a framer `lookup()` callback has been registered it is queried for the frameset of the hyperlinked page.
If it is not the same as the current frameset then normal navigation is triggered.

If a frameset definition `lookup()` is registered it is queried for the frame-target of the hyperlinked page.
If it is valid then the resource is loaded and the target frame (or frames) are updated.

Otherwise normal browser navigation is triggered. 


Bonus APIs
----------

HyperFrameset defines various utility classes and functions for internal use.
Many of these are also available for external use if appropriate.
The most useful of these are include:

+ `Meeko.Promise`
	This is a JS implementation of ES6 Promises  
	**TODO:** `asap()`, `defer()`, `delay()`, `pipe()`, `reduce()`

+ `Meeko.URL`  
	This provides overlapping functionality with the [proposed URL API](http://url.spec.whatwg.org/#api).  
	`Meeko.URL(absoluteURL)` will return a URL object with the following (read-only) fields:  
	- `href`, `protocol`, `host`, `hostname`, `port`, `pathname`, `search`, `hash` **(Standard)**  
	- `origin`, `basepath`, `base`, `filename`, `nosearch`, `nohash` **(Extensions)**  
		The URL object also has the `resolve(relativeURL)` method which performs a
		fast conversion of a relative URL to absolute, using itself for the `baseURL`.


Debugging
---------

By default, HyperFrameset logs error and warning messages to the browser console.
The logger can be configured to provide info and debug messages (see Configuration).

If the `log_level` is set to "debug" then when errors occur the 
[error stack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack)
is also dumped to the console.

Inline scripts in the frameset document are automatically given 
a [sourceURL](https://developer.chrome.com/devtools/docs/javascript-debugging#@sourceurl-and%20displayname%20in%20action)
on platforms which support it. 
Thist should help finding the source of errors.

**FIXME:** more guidance, particularly about asynchronous programming and error logging

Notes and Warnings
------------------

- the configuration options and mechanism may change in future releases
- unlike CSS, frameset documents SHOULD be in the same domain as the content page otherwise the browsers cross-site restrictions will apply.
Detection for this hasn't been implemented yet. 
- all stylesheets in the content document are removed 
before applying the frameset document. 
This allows for a fallback styling option of frameset-less pages. 
- There are no compatibility checks and warnings between the content and frameset documents (charset, etc)


TODO
----
- this README is too long - needs to be split up into sub-sections
- some features would be best explained with demo pages / sites 

