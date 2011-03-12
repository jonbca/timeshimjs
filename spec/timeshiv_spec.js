describe("ModernizrTimeDetection", function () {
	it('should detect no support for time tag', function () {
		var timeSupport = Modernizr.timetag;
		expect(timeSupport).toBeFalsy()
		expect(document.getElementsByClassName('no-timetag').length).toBeGreaterThan(0);
	});
});

describe("TimeShivCollectSequence", function () {
	it('should collect a sequence of digits from a longer string', function () {
		var seq = "2010-03-11";
		var pattern = /\d/;
		var collector = TimeShiv.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('2010');
	});
	
	it('should collect a sequence of digits from a just-long-enough string', function () {
		var seq = "210";
		var pattern = /\d/;
		var collector = TimeShiv.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('210');
	});
	
	it('should be finished when there are no more chars', function() {
		var seq = "2010";
		var pattern = /.*/;
		var collector = TimeShiv.collector(seq);
		
		collector.collectSequence(pattern);
		expect(collector.isFinished()).toBeTruthy();
	});
	
	it('should collect a single digit', function() {
		var seq = "1";
		var pattern = /\d/;
		var collector = TimeShiv.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('1');
		expect(collector.isFinished()).toBeTruthy();
	});
	
	it('should collect an empty string', function () {
		var seq = "";
		var pattern = /.*/;
		var collector = TimeShiv.collector(seq);
		
		expect(collector.collectSequence(pattern)).toEqual('');
	});
	
	it('should not allow access to position', function () {
		var seq = "2010";
		var pattern = /.*/;
		var collector = TimeShiv.collector(seq);
		
		expect(collector.position).not.toBeDefined();
		collector.position = 3;
		expect(collector.getPosition()).toEqual(0);
	});
	
	it('should skip initial whitespace', function () {
		var seq = "    \n \t1983";
		var collector = TimeShiv.collector(seq);
		
		collector.skipWhitespace();
		expect(collector.getPosition()).toEqual(7);
	});
	
	it('should not skip initial whitespace when none is present', function () {
		var seq = "abcd   \n \t  \r";
		var collector = TimeShiv.collector(seq);
		
		collector.skipWhitespace();
		expect(collector.getPosition()).toEqual(0);
	});
	
	it('should allow multiple collections', function () {
		var seq = "abcd1234";
		var collector = TimeShiv.collector(seq);
		
		expect(collector.collectSequence(/[a-z]/)).toEqual('abcd');
		expect(collector.collectSequence(/\d/)).toEqual('1234');
	});
	
	it('should allow multiple collections with whitespace', function () {
		var seq = "abcd    \t 1234";
		var collector = TimeShiv.collector(seq);
		
		expect(collector.collectSequence(/[a-z]/)).toEqual('abcd');
		expect(collector.collectSequence(/\d/)).toEqual('');
		collector.skipWhitespace();
		expect(collector.collectSequence(/\d/)).toEqual('1234');
	});
	
	it('should strip leading and trailing whitespace', function () {
		var seq = "    \n \r   \tshehdhjd sljfsk     \r\n";
		var collector = TimeShiv.collector(seq);
		
		expect(collector.stripLeadingAndTrailingWhitespace()).toEqual("shehdhjd sljfsk");
	});
});

describe("ModernizrTimeShiv", function () {
	var timetag;
	var nonTimeTag;
	
	beforeEach(function (){
		timetag = document.createElement("time");
		nonTimeTag = document.createElement("notatime");
	});
	
	it('should say an element needs a date when pubdate is set', function () {
		timetag.pubdate = true;
		expect(TimeShiv.needsDate(timetag)).toBeTruthy();
	});
	
	it('should say an element does not need a date when pubdate is not set', function () {
		timetag.pubdate = false;
		expect(TimeShiv.needsDate(timetag)).toBeFalsy();
	});
	
	it('should say an element does not need a date if it is not a time element', function () {
		nonTimeTag.pubdate = true;
		expect(TimeShiv.needsDate(nonTimeTag)).toBeFalsy();
		
		nonTimeTag.pubdate = false;
		expect(TimeShiv.needsDate(nonTimeTag)).toBeFalsy();
	});
	
	it('should say an element has a datetime if datetime is set', function () {
		timetag.datetime = '2011-02-11';
		expect(TimeShiv.hasDatetime(timetag)).toBeTruthy();
	});
	
	it('should say an element has no datetime if datetime is not set', function () {
		expect(TimeShiv.hasDatetime(timetag)).toBeFalsy();
	});
});