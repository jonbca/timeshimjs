/* Test for the HTML5 time element described at:
http://dev.w3.org/html5/spec/Overview.html#the-time-element
Copyright (C) 2011 Jonathan Abourbih
Released under MIT license.
*/
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true,
 plusplus: true, bitwise: true, browser: true, maxerr: 50, indent: 4 */
var Modernizr = Modernizr || false;
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

var TimeShim = (function () {
/* Collector implements the character sequence collector from the 
	HTML 5 specification:
	http://dev.w3.org/html5/spec/Overview.html#collect-a-sequence-of-characters */
    var collector = function (input, position) {
        position = position || 0;

        var coll = {},
            failIfStarted = function () {
                if (position !== 0) {
                    throw {
                        name: "IllegalState",
                        message: "You cannot strip leading/trailing whitespace once you have begun collecting from the input."
                    };
                }
            };

        coll.collectSequence = function (pattern) {
            var result = [],
                initialPosition = position;

            if (coll.isFinished()) {
                return "";
            }

            while (position < input.length && input[position].match(pattern)) {
                result[position - initialPosition] = input[position];
                position += 1;
            }

            return result.join('');
        };

        coll.skip = function (num) {
            num = num || 1;
            position += num;
        };

        coll.peek = function (howMany) {
            howMany = howMany || 1;

            if (howMany === 0) {
                return '';
            } else if (howMany < 0) {
                throw {
                    name: "IllegalArgument",
                    message: "Can't peek into the past."
                };
            } else if (howMany + position >= input.length) {
                return input.slice(position);
            } else {
                return input.slice(position, position + howMany);
            }
        };

        coll.skipWhitespace = function () {
            var initialPosition = position;
            coll.collectSequence(/\s/);
            return position - initialPosition;
        };

        coll.stripLeadingAndTrailingWhitespace = function () {
            failIfStarted();

            input = input.replace(/^\s*/, "");
            input = input.replace(/\s*$/, "");
            return input;
        };

        coll.stripLinebreaks = function () {
            failIfStarted();

            input = input.replace(/[\r\n]/g, "");
            return input;
        };

        coll.isFinished = function () {
            return position >= input.length;
        };

        coll.getPosition = function () {
            return position;
        };

        coll.seek = function (new_pos) {
            position = new_pos || 0;

            if (new_pos > input.length || new_pos < 0) {
                throw {
                    name: "IllegalState",
                    message: "Cannot seek beyond the length or before the start of input."
                };
            }
        };

        coll.len = input.length;

        return coll;
    },

        dateProcessor = function (dateString, inContent) {
            var dp = {},
                datePresent = true,
                timePresent = true,
                getDaysForMonth = function (year, month) {
                    switch (month) {
                    case 1:
                    case 3:
                    case 5:
                    case 7:
                    case 8:
                    case 10:
                    case 12:
                        return 31;
                    case 4:
                    case 6:
                    case 9:
                    case 11:
                        return 30;
                    case 2:
                        if (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)) {
                            return 29;
                        } else {
                            return 28;
                        }
                    }
                };

            dp.parseMonthComponent = function (coll) {
                var year_s = coll.collectSequence(/\d/),
                    year = 0,
                    month_s = '0',
                    month = 0;
                if (year_s.length < 4) {
                    return;
                }

                year = parseInt(year_s, 10);
                if (year <= 0) {
                    return;
                }

                if (coll.isFinished() || coll.peek() !== '-') {
                    return;
                } else {
                    coll.skip();
                }

                month_s = coll.collectSequence(/\d/);
                if (month_s.length !== 2) {
                    return;
                }

                month = parseInt(month_s, 10);
                if (month < 0 || month > 12) {
                    return;
                }

                return {
                    "year": year,
                    "month": month
                };
            };

            dp.parseDateComponent = function (coll) {
                var dateObj = dp.parseMonthComponent(coll),
                    maxDay = 0,
                    date_s = '0',
                    date = 0;

                if (!dateObj) {
                    return;
                }

                maxDay = getDaysForMonth(dateObj.year, dateObj.month);

                if (coll.isFinished() || coll.peek() !== '-') {
                    return;
                } else {
                    coll.skip();
                }

                date_s = coll.collectSequence(/\d/);
                if (date_s.length !== 2) {
                    return;
                }

                date = parseInt(date_s, 10);
                if (date < 1 || date > maxDay) {
                    return;
                }

                dateObj.day = date;
                return dateObj;
            };

            dp.parseTimeComponent = function (coll) {
                var hour_s = coll.collectSequence(/\d/),
                    hour = 0,
                    minute_s = '',
                    minute = 0,
                    second_s = '',
                    second = 0,
                    pos = 0,
                    nextTwoAreDigits = false,
                    possibleSeconds = '';
                if (hour_s.length !== 2) {
                    return;
                }

                hour = parseInt(hour_s, 10);
                if (hour < 0 || hour > 23) {
                    return;
                }

                if (coll.isFinished() || coll.peek() !== ':') {
                    return;
                } else {
                    coll.skip();
                }

                minute_s = coll.collectSequence(/\d/);
                if (minute_s.length !== 2) {
                    return;
                }

                minute = parseInt(minute_s, 10);
                if (minute < 0 || minute > 59) {
                    return;
                }

                second_s = '0';
                if (!coll.isFinished() && coll.peek() === ':') {
                    coll.skip();
                    pos = coll.getPosition();
                    nextTwoAreDigits = coll.collectSequence(/\d/).length === 2;
                    coll.seek(pos);

                    if (!coll.isFinished() && coll.getPosition() !== coll.len - 1 && nextTwoAreDigits) {
                        possibleSeconds = coll.collectSequence(/[\d.]/);
                        if (/^\d{2}(?:\.\d+)?$/.test(possibleSeconds)) {
                            second_s = possibleSeconds;
                        }
                    }
                }

                second = parseFloat(second_s);
                if (second < 0 || second >= 60) {
                    return;
                }

                return {
                    "hour": hour,
                    "minute": minute,
                    "second": second
                };
            };

            dp.parseDateOrTimeString = function () {
                var coll = collector(dateString),
                    startPosition = 0,
                    dateObj = null,
                    timeObj = null,
                    result = null;

                if (inContent) {
                    coll.skipWhitespace();
                }

                startPosition = coll.getPosition();

                dateObj = dp.parseDateComponent(coll);
                if (!dateObj) {
                    datePresent = false;
                    dateObj = {};
                }

                if (datePresent && !coll.isFinished() && coll.peek() === 'T') {
                    coll.skip(1);
                } else if (datePresent && (coll.isFinished() || coll.peek() !== 'T')) {
                    timePresent = false;
                    timeObj = {};
                } else {
                    coll.seek(startPosition);
                }

                if (timePresent) {
                    timeObj = dp.parseTimeComponent(coll);
                    if (!timeObj) {
                        return;
                    }
                }

                if (datePresent || timePresent) {
                    result = {};

                    result.year = dateObj.year || 0;
                    result.month = dateObj.month || 0;
                    result.day = dateObj.day || 0;
                    result.hour = timeObj.hour || 0;
                    result.minute = timeObj.minute || 0;
                    result.second = timeObj.second || 0;
                }

                return result;
            };

            dp.hasDateComponent = function () {
                return datePresent;
            };

            dp.hasTimeComponent = function () {
                return timePresent;
            };

            dp.isValidDateWithOptionalTime = function () {
                return (/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/).test(dateString) && datePresent;
            };

            dp.isValidDateInContentWithOptionalTime = function () {
                return (/^\s*\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?\s*$/).test(dateString) && datePresent;
            };

            dp.isValidDateOrTimeString = function () {
                return !(/^\s+/.test(dateString)) && !(/\s+$/.test(dateString)) && (datePresent || timePresent);
            };

            dp.isValidDateOrTimeStringInContent = function () {
                return datePresent || timePresent;
            };

            return dp;
        };

    return {
        collector: collector,
        dateProcessor: dateProcessor,

        apply: function () {
            var elements = document.getElementsByTagName('time'),
                i = 0;

            for (i = 0; i < elements.length; i += 1) {
                this.processElement(elements[i]);
            }
        },

        needsDate: function (element) {
            return element.tagName.toLowerCase() === "time" && element.hasAttribute("pubdate");
        },

        processElement: function (element) {
            var hasDatetime = element.hasAttribute("datetime"),
                dp = null,
                result = null,
                d = null;

            if (hasDatetime) {
                element.dateTime = element.getAttribute("datetime");
                element.pubDate = element.hasAttribute("pubdate");
                dp = dateProcessor(element.dateTime);
            } else {
                dp = dateProcessor(element.textContent, true);
            }

            result = dp.parseDateOrTimeString();
            if (result) {
                d = new Date(result.year, result.month - 1, result.day, result.hour, result.minute, Math.floor(result.second), (result.second - Math.floor(result.second) * 1000));
            }

            element.valueAsDate = d;
        }
    };
}());
