/* Test for the HTML5 time element described at:
http://dev.w3.org/html5/spec/Overview.html#the-time-element
Copyright (C) 2011 Jonathan Abourbih
Released under MIT license.
*/
if (Modernizr) {
	Modernizr.addTest('timetag', function () {
		var test = document.createElement('time'),
			testDateString = "2011-03-12",
			testDate = new Date(testDateString),
			ret = true;
		
		test.datetime = testDateString;
		test.textContent = testDateString;
		ret = (test.valueAsDate && test.valueAsDate === testDate);
	
		return ret;
	});
}

var TimeShiv = (function (){
	/* Collector implements the character sequence collector from the 
	HTML 5 specification:
	http://dev.w3.org/html5/spec/Overview.html#collect-a-sequence-of-characters */
	var collector = function(input, position) {
		var coll = {},
			position = position || 0;
		
		coll.collectSequence = function(pattern) {
			var len = input.length;
			var result = [];
			var initialPosition = position;

			if (coll.isFinished()) {
				return "";
			}

			while(position < input.length &&
				input[position].match(pattern)) {
				result[position - initialPosition] = input[position];
				position += 1;
			}

			return result.join('');
		};
			
		coll.skip = function(num) {
			num = num || 1;
			position += num;
		};
			
		coll.skipWhitespace = function() {
			var initialPosition = position;
			coll.collectSequence(/\s/);
			return position - initialPosition;
		};
		
		coll.stripLeadingAndTrailingWhitespace = function() {
			if (position != 0) {
				throw { name: "IllegalState",
				 		message: "You cannot strip leading/trailing whitespace once you have begun collecting from the input."
				};
			}
			
			input = input.replace(/^\s*/, "");
			input = input.replace(/\s*$/, "");
			return input;
		};
		
		coll.isFinished = function() {
			return position >= input.length;
		};
		
		coll.getPosition = function() {
			return position;
		}
		
		return coll;
	};

	return {
		collector: collector,
		
		apply: function() {
			var timeElements = document.getElementByTagName('time');
			for (var i = timeElements.length; i -= 1;) {
				this.applyToElement(timeElements[i]);
			}
		},
		
		applyToElement: function(timeElement) {
			console.log(timeElement);
		},
		
		needsDate: function(element) {
			return element.tagName.toLowerCase() == "time" && element.pubdate;
		},
		
		hasDatetime: function(element) {
			return !!element.datetime;
		},
		
		isValidDateOrTimeInContent: function(value) {
			
		},
		
		parseDateComponent: function(input, position) {
			/* parse month component */
			var digit = /[0-9]/;
		},
	};
})();