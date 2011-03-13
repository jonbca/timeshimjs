# Javascript Time Shim
This library provides an (optional) [Modernizr](http://www.modernizr.com) test for detecting the [HTML5 time element](http://dev.w3.org/html5/spec/Overview.html#the-time-element), and a shim that you can use to provide browser support for the time element if it's not natively supported.

## License
This tool is licensed under the MIT license. It is copyright 2011 Jonathan Abourbih.

# Work in Progress
This is very much a work in progress, but in the end it will support:

* determining the datetime value of the time element and properly setting the _valueAsDate_ property, based on the rules in the specification; _(this is partly done)_
* optionally generating appropriately-formatted content for the time tag when none has been provided.

Currently it follows the spec's parsing rules very closely (practically step by step), and this may not be the most efficient way of handling it. I'd be interested in refactoring with regexes if this reduces code size and improves performance.

## Testing
This tool uses [Jasmine](http://pivotal.github.com/jasmine/) for testing. To run the tests, open the [SpecRunner.html](timeshimjs/blob/master/SpecRunner.html) file in any browser. The Jasmine  files and stuff are included in the [lib](timeshimjs/tree/master/lib) directory, and the specs are in [spec](timeshimjs/tree/master/spec).

# How to Use
Include the _timeshim.js_ file your HTML page. To use the Modernizr test, you'll also need to include the modernizr script before _timeshim.js_.

    <script src="lib/modernizr-1.7.min.js" type="text/javascript"></script>
    <script src="timeshim.js" type="text/javascript"></script>
    <script type="text/javascript">
        if(!Modernizr.timetag) {
            TimeShim.apply();
        }
    </script>