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

var TimeShim = (function () {
/* Collector implements the character sequence collector from the 
	HTML 5 specification:
	http://dev.w3.org/html5/spec/Overview.html#collect-a-sequence-of-characters */
    var collector = function (input, position) {
        var coll = {};
        position = position || 0;

        var failIfStarted = function () {
            if (position !== 0) {
                throw {
                    name: "IllegalState",
                    message: "You cannot strip leading/trailing whitespace once you have begun collecting from the input."
                };
            }
        };

        coll.collectSequence = function (pattern) {
            var result = [];
            var initialPosition = position;

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

        coll.peek = function () {
            return input[position];
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
    };

    var dateProcessor = function (dateString, inContent) {
        var dp = {};
        var datePresent = true,
            timePresent = true;

        var getDaysForMonth = function (year, month) {
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
            var year_s = coll.collectSequence(/\d/);
            if (year_s.length < 4) {
                throw {
                    name: "InvalidDate",
                    message: ["Given year", year_s, "is not a valid year."].join(' ')
                };
            }

            var year = parseInt(year_s, 10);
            if (year <= 0) {
                throw {
                    name: "InvalidDate",
                    message: ["Given year", year_s, "is not greater than 0"].join(' ')
                };
            }

            if (coll.isFinished() || coll.peek() !== '-') {
                throw {
                    name: "InvalidDate",
                    message: "Date string has no month"
                };
            } else {
                coll.skip();
            }

            var month_s = coll.collectSequence(/\d/);
            if (month_s.length !== 2) {
                throw {
                    name: "InvalidDate",
                    message: ["Given month", month_s, "is not 2 digits long."].join(' ')
                };
            }

            var month = parseInt(month_s, 10);
            if (month < 0 || month > 12) {
                throw {
                    name: "InvalidDate",
                    message: ["Given month", month_s, "is not between 1 and 12."].join(' ')
                };
            }

            return {
                "year": year,
                "month": month
            };
        };

        dp.parseDateComponent = function (coll) {
            var dateObj = dp.parseMonthComponent(coll),
                maxDay = getDaysForMonth(dateObj.year, dateObj.month);

            if (coll.isFinished() || coll.peek() !== '-') {
                throw {
                    name: "InvalidDate",
                    message: "Date string has no day"
                };
            } else {
                coll.skip();
            }

            var date_s = coll.collectSequence(/\d/);
            if (date_s.length !== 2) {
                throw {
                    name: "InvalidDate",
                    message: ["Given day", date_s, "is not 2 digits long."].join(' ')
                };
            }

            var date = parseInt(date_s, 10);
            if (date < 1 || date > maxDay) {
                throw {
                    name: "InvalidDate",
                    message: ["Given day", date_s, "is not between 1 and", maxDay, "."].join(' ')
                };
            }

            dateObj.day = date;
            return dateObj;
        };

        dp.parseTimeComponent = function (coll) {
            var hour_s = coll.collectSequence(/\d/);
            if (hour_s.length !== 2) {
                throw {
                    name: "InvalidTime",
                    message: ["Hour", hour_s, "is not 2 digits long."].join(' ')
                };
            }

            var hour = parseInt(hour_s, 10);
            if (hour < 0 || hour > 23) {
                throw {
                    name: "InvalidTime",
                    message: ["Hour", hour_s, "is not between 0 and 23."].join(' ')
                };
            }

            if (coll.isFinished() || coll.peek() !== ':') {
                throw {
                    name: "InvalidTime",
                    message: "There is no minutes component."
                };
            } else {
                coll.skip();
            }

            var minute_s = coll.collectSequence(/\d/);
            if (minute_s.length !== 2) {
                throw {
                    name: "InvalidTime",
                    message: ["Minute", minute_s, "is not 2 digits long."].join(' ')
                };
            }

            var minute = parseInt(minute_s, 10);
            if (minute < 0 || minute > 59) {
                throw {
                    name: "InvalidTime",
                    message: ["Minute", minute_s, "is not between 0 and 59."].join(' ')
                };
            }

            var second_s = '0';
            if (!coll.isFinished() && coll.peek() === ':') {
                coll.skip();
                var pos = coll.getPosition();
                var nextTwoAreDigits = coll.collectSequence(/\d/).length === 2;
                coll.seek(pos);

                if (!coll.isFinished() && coll.getPosition() !== coll.len - 1 && nextTwoAreDigits) {
                    var possible_seconds = coll.collectSequence(/[\d.]/);
                    if (/^\d{2}(?:\.\d+)?$/.test(possible_seconds)) {
                        second_s = possible_seconds;
                    }
                }
            }

            var second = parseFloat(second_s);
            if (second < 0 || second >= 60) {
                throw {
                    name: "InvalidTime",
                    message: ["Seconds", second_s, "is not between 0 and 59"].join(" ")
                };
            }

            return {
                "hour": hour,
                "minute": minute,
                "second": second
            };
        };

        dp.parseDateOrTimeString = function () {
            var coll = collector(dateString);

            if (inContent) {
                coll.skipWhitespace();
            }

            var startPosition = coll.getPosition();
            var dateObj = {};
            try {
                dateObj = dp.parseDateComponent(coll);
            } catch (e) {
                datePresent = false;
            }

            if (datePresent && coll.peek() === 'T') {
                coll.skip(1);
            } else if (datePresent && (coll.isFinished() || coll.peek() !== 'T')) {
                timePresent = false;
            } else {
                coll.seek(startPosition);
            }

            var timeObj = {};
            if (timePresent) {
                timeObj = dp.parseTimeComponent(coll);
            }

            var result = null;
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

        apply: function () {},

        applyToElement: function (timeElement) {
            console.log(timeElement);
        },

        needsDate: function (element) {
            return element.tagName.toLowerCase() === "time" && element.pubdate;
        },

        /**
         * Returns true if the given element has a datetime attribute.
         * 
         * @param {Element} element The element to test.
         * @returns {Boolean} true if the element has a datetime attribute.
         */
        hasDatetime: function (element) {
            return !!element.datetime;
        },

        processElement: function (element) {
            var hasDateTime = this.hasDateTime(element);
            var dp;

            if (hasDateTime) {
                dp = dateParser(element.datetime);
            } else {
                dp = dateParser(element.textContent, true);
            }

            var result = dp.parseDateOrTimeString();
            var d = null;
            if (result) {
                d = new Date(result.year, result.month, result.day, result.hour, result.minute, Math.floor(result.second), (result.second - Math.floor(result.second) * 1000));
            }

            element.valueAsDate = d;
        }
    };
}());