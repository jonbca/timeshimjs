/* Test for the HTML5 time element described at:
http://dev.w3.org/html5/spec/Overview.html#the-time-element
Copyright (C) 2011 Jonathan Abourbih
Released under MIT license.
*/
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

var TimeShiv = (function (){
	return {
		apply: function() {
			var timeElements = document.getElementByTagName('time');
			for (var i = timeElements.length; i -= 1;) {
				this.applyToElement(timeElements[i]);
			}
		},
		
		applyToElement: function(timeElement) {
			console.log(timeElement);
		}
	};
})();