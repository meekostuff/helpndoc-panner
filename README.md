HelpNDoc-Panner
===============

[HelpNDoc](http://www.helpndoc.com/) is a Help-Authoring-Tool 
which can generate documentation in a number of formats 
including HTML for the Web. 
Its default HTML generator uses HTML Framesets. 

[HyperFrameset](https://github.com/meekostuff/HyperFrameset) 
uses AJAX and `history.pushState` to revolutionize 
the concept of HTML Framesets. 
In particular, HyperFrameset pages synchronize the URL in the address-bar
with the URL of the primary content being viewed. 

**HelpNDoc-Panner** is a HelpNDoc template that generates 
HyperFrameset enabled documentation. 
The pages will look like the default HelpNDoc output 
but the framesets are emulated with AJAX 
and navigation is handled with `history.pushState`.


Installation
------------

**TODO**

Browser Support
---------------

The documentation generated by this template works fine in all browsers -
old or new, javascript enabled or not.

HyperFrameset requires features provided by modern mainstream browsers 
- in general this means IE10+ - 
so in older browsers (or with Javascript disabled) 
you won't get the frameset view.

Testing
-------

All modern browsers have significant restrictions on using AJAX with the local file-system - that is, when using the `file:` protocol. Because HyperFrameset depends on AJAX these restrictions could prevent HyperFrameset from working. 

If you want to view your generated documentation on your local machine it is recommended to run a minimal HTTP server. The following are only suggestions.

- [Mongoose](https://www.cesanta.com/products/binary)
- [Fenix](http://fenixwebserver.com/)

If you don't want to install a HTTP server then either use Firefox, or
call Chrome from the command-line with


```
\path\to\chrome.exe --disable-web-security --user-data-dir \path\to\HelpNDoc\Output
```




