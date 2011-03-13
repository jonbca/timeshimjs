describe("ModernizrTimeDetection", function () {
	it('should detect no support for time tag', function () {
		var timeSupport = Modernizr.timetag;
		expect(timeSupport).toBeFalsy()
		expect(document.getElementsByClassName('no-timetag').length).toBeGreaterThan(0);
	});
});

describe("TimeShimCollectSequence", function () {
	it('should collect a sequence of digits from a longer string', function () {
		var seq = "2010-03-11";
		var pattern = /\d/;
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('2010');
	});
	
	it('should collect a sequence of digits from a just-long-enough string', function () {
		var seq = "210";
		var pattern = /\d/;
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('210');
	});
	
	it('should be finished when there are no more chars', function() {
		var seq = "2010";
		var pattern = /.*/;
		var collector = TimeShim.collector(seq);
		
		collector.collectSequence(pattern);
		expect(collector.isFinished()).toBeTruthy();
	});
	
	it('should collect a single digit', function() {
		var seq = "1";
		var pattern = /\d/;
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('1');
		expect(collector.isFinished()).toBeTruthy();
	});
	
	it('should collect an empty string', function () {
		var seq = "";
		var pattern = /.*/;
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('');
	});
	
	it('should not allow access to position', function () {
		var seq = "2010";
		var pattern = /.*/;
		var collector = TimeShim.collector(seq);
		
		expect(collector.position).not.toBeDefined();
		collector.position = 3;
		expect(collector.getPosition()).toEqual(0);
	});
	
	it('should skip initial whitespace', function () {
		var seq = "    \n \t1983";
		var collector = TimeShim.collector(seq);
		
		collector.skipWhitespace();
		expect(collector.getPosition()).toEqual(7);
	});
	
	it('should not skip initial whitespace when none is present', function () {
		var seq = "abcd   \n \t  \r";
		var collector = TimeShim.collector(seq);
		
		collector.skipWhitespace();
		expect(collector.getPosition()).toEqual(0);
	});
	
	it('should allow multiple collections', function () {
		var seq = "abcd1234";
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(/[a-z]/)).toEqual('abcd');
		expect(collector.collectSequence(/\d/)).toEqual('1234');
	});
	
	it('should allow multiple collections with whitespace', function () {
		var seq = "abcd    \t 1234";
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(/[a-z]/)).toEqual('abcd');
		expect(collector.collectSequence(/\d/)).toEqual('');
		collector.skipWhitespace();
		expect(collector.collectSequence(/\d/)).toEqual('1234');
	});
	
	it('should strip leading and trailing whitespace', function () {
		var seq = "    \n \r   \tshehdhjd sljfsk     \r\n";
		var collector = TimeShim.collector(seq);
		
		expect(collector.stripLeadingAndTrailingWhitespace()).toEqual("shehdhjd sljfsk");
	});
	
	it('should throw an exception when stripping whitespace if collector has been used', function() {
		var seq = "dfjklsfj sjdk    \r \n";
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(/[a-z]/)).toEqual("dfjklsfj");
		expect(collector.stripLeadingAndTrailingWhitespace).toThrow({
			message: "You cannot strip leading/trailing whitespace once you have begun collecting from the input.",
		});
	});
	
	it('should strip linebreaks', function () {
		var seq = "   \n dfkjsl sk\r\n \t";
		var collector = TimeShim.collector(seq);
		
		expect(collector.stripLinebreaks()).toEqual("    dfkjsl sk \t");
	});
	
	it('should throw an exception when stripping whitespace if collector has been used', function() {
		var seq = "dfkjsl sk\r\n \t";
		var collector = TimeShim.collector(seq);
		
		expect(collector.collectSequence(/[a-z]/)).toEqual("dfkjsl");
		expect(collector.stripLinebreaks).toThrow();
	});
	
	it('should peek at 1 element when no count is specified', function () {
		var seq = "abcdefghijkl";
		var collector = TimeShim.collector(seq);
		
		expect(collector.peek()).toEqual('a');
		collector.seek(3);
		expect(collector.peek()).toEqual('d');
	});
	
	it('should peek at n elements when count is specified', function () {
		var seq = "abcdefghijkl";
		var collector = TimeShim.collector(seq);
		
		expect(collector.peek(4)).toEqual('abcd');
		expect(collector.getPosition()).toEqual(0);
		expect(collector.peek(8)).toEqual('abcdefgh');
	});
	
	it('should return a shortened string if the input is too short', function () {
		var seq = "abcd";
		var collector = TimeShim.collector(seq);
		
		expect(collector.peek(6)).toEqual('abcd');
	});
	
	it('should not allow a negative length', function () {
		var seq = "abcd";
		var collector = TimeShim.collector(seq);
		
		expect(function () {collector.peek(-5)}).toThrow();
	});
	
	it('should return from the middle of the string', function () {
		var seq = "abcdefghijkl";
		var collector = TimeShim.collector(seq);
		
		collector.seek(4);
		expect(collector.peek(4)).toEqual('efgh');	
	});
});

describe("DateProcessor", function () {
	var dp;
	
	beforeEach(function () {
		dp = TimeShim.dateProcessor();
	});
	
	it('should parse a month component', function () {
		var coll = TimeShim.collector("2010-12-30");
		
		var result = dp.parseMonthComponent(coll);
		expect(result['year']).toEqual(2010);
		expect(result['month']).toEqual(12);
	});
	
	it('should refuse to parse a bad year in a month component', function () {
		var coll = TimeShim.collector('100-12-26');
		
		expect(dp.parseMonthComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a 0 year in a month component', function () {
		var coll = TimeShim.collector('0000-12-26');
		
		expect(dp.parseMonthComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a bad month in a month component', function () {
		var coll = TimeShim.collector('2100-13-26');
		
		expect(dp.parseMonthComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a bad date in a month component', function () {
		var coll = TimeShim.collector('210013');
		
		expect(dp.parseMonthComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a bad date in a month component', function () {
		var coll = TimeShim.collector('2100d13');
		
		expect(dp.parseMonthComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a bad month in a month component', function () {
		var coll = TimeShim.collector('2100-1');
		
		expect(dp.parseMonthComponent(coll)).not.toBeDefined();
	});
	
	it('should parse a full date', function () {
		var coll = TimeShim.collector('2010-12-30');
		var dateobj = dp.parseDateComponent(coll);
		
		expect(dateobj).toEqual({year: 2010, month: 12, day: 30});
	});
	
	it('should refuse to parse a date with missing day', function () {
		var coll = TimeShim.collector('2100-12');
		
		expect(dp.parseDateComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a date with invalid day', function () {
		var coll = TimeShim.collector('2100-12-32');
		
		expect(dp.parseDateComponent(coll)).not.toBeDefined();
	});
	
	it('should refuse to parse a date with invalid day (leap year)', function () {
		var coll = TimeShim.collector('2100-02-29');
		
		expect(dp.parseDateComponent(coll)).not.toBeDefined();
	});
	
	it('should parse a date with a time', function () {
		var coll = TimeShim.collector('10:20:22');
		
		expect(dp.parseTimeComponent(coll)).toEqual({hour: 10, minute: 20, second: 22});
	});
	
	it('should parse a date with a fractional time', function () {
		var coll = TimeShim.collector('10:20:22.225');
		
		expect(dp.parseTimeComponent(coll)).toEqual({hour: 10, minute: 20, second: 22.225});
	});
	
	it('should parse a date with missing seconds', function () {
		var coll = TimeShim.collector('10:20');
		
		expect(dp.parseTimeComponent(coll)).toEqual({hour: 10, minute: 20, second: 0});
	});
	
	it('should parse a date with bad fractional seconds', function () {
		var coll = TimeShim.collector('10:20:30.');
		
		expect(dp.parseTimeComponent(coll)).toEqual({hour: 10, minute: 20, second: 0});
	});
	
	it('should parse a date with bad fractional seconds', function () {
		var coll = TimeShim.collector('10:20:30.3.22.3');
		
		expect(dp.parseTimeComponent(coll)).toEqual({hour: 10, minute: 20, second: 0});
	});
	
	it('should parse a whole datetime', function () {
		var dp = TimeShim.dateProcessor('2010-01-01T10:20:30.323');
		
		expect(dp.parseDateOrTimeString()).toEqual({year:2010,month:1,day:1,hour:10,minute:20,second:30.323});
	});
	
	it('should parse a whole datetime with no time', function () {
		var dp = TimeShim.dateProcessor('2010-01-01');
		
		expect(dp.parseDateOrTimeString()).toEqual({year:2010,month:1,day:1,hour:0,minute:0,second:0});
	});
	
	it('should parse a time with no date', function () {
		var dp = TimeShim.dateProcessor('20:02');
		expect(dp.parseDateOrTimeString()).toEqual({year:0,month:0,day:0,hour:20,minute:02,second:0});
	});
	
	it('should return null if the datetime can\'t be parsed', function () {
		var dp = TimeShim.dateProcessor('3 minutes from last Sunday');
		expect(dp.parseDateOrTimeString()).not.toBeDefined();
	});
});

describe("ModernizrTimeShim", function () {
	var timetag;
	var nonTimeTag;
	
	beforeEach(function (){
		timetag = document.createElement("time");
		nonTimeTag = document.createElement("notatime");
	});
	
	it('should say an element needs a date when pubdate is set', function () {
		timetag.pubdate = true;
		expect(TimeShim.needsDate(timetag)).toBeTruthy();
	});
	
	it('should say an element does not need a date when pubdate is not set', function () {
		timetag.pubdate = false;
		expect(TimeShim.needsDate(timetag)).toBeFalsy();
	});
	
	it('should say an element does not need a date if it is not a time element', function () {
		nonTimeTag.pubdate = true;
		expect(TimeShim.needsDate(nonTimeTag)).toBeFalsy();
		
		nonTimeTag.pubdate = false;
		expect(TimeShim.needsDate(nonTimeTag)).toBeFalsy();
	});
	
	it('should say an element has a datetime if datetime is set', function () {
		timetag.datetime = '2011-02-11';
		expect(TimeShim.hasDatetime(timetag)).toBeTruthy();
	});
	
	it('should say an element has no datetime if datetime is not set', function () {
		expect(TimeShim.hasDatetime(timetag)).toBeFalsy();
	});
});