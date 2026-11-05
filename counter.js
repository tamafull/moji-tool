/* X(旧Twitter)重み付き文字数カウンタ。DOM非依存(nodeでテスト可能)。
 * 仕様根拠: twitter-text config v3 (docs.x.com/fundamentals/counting-characters)。
 * URL検出・絵文字判定は公式 twitter-text 3.1.0 の parseTweet を開発時に突き合わせて
 * 実測した挙動に合わせた独自実装(T-0013、差分は REPORT.md)。公式コードは同梱していない。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MojiCounter = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CONFIG = {
    maxWeightedLength: 280,
    defaultWeight: 2,
    urlLength: 23,
    emojiWeight: 2,
    // 重み1の範囲 [start, end] (code point)
    weightOneRanges: [[0x0000, 0x10FF], [0x2000, 0x200D], [0x2010, 0x201F], [0x2032, 0x2037]],
    weightOne: 1
  };

  // TLD一覧(tools/gen_tlds.js が生成。IANA一覧のうち twitter-text 3.1.0 が認識するもの)
  var TLDS = /*TLDS-BEGIN*/'aaa aarp abb abbott abbvie abc able abogado abudhabi ac academy accenture accountant accountants aco actor ad ads adult ae aeg aero aetna af afl africa ag agakhan agency ai aig airbus airforce airtel akdn al alibaba alipay allfinanz allstate ally alsace alstom am americanexpress americanfamily amex amfam amica amsterdam analytics android anquan anz ao aol apartments app apple aq aquarelle ar arab aramco archi army arpa art arte as asda asia associates at athleta attorney au auction audi audible audio auspost author auto autos aw aws ax axa az azure ba baby baidu banamex band bank bar barcelona barclaycard barclays barefoot bargains baseball basketball bauhaus bayern bb bbc bbt bbva bcg bcn bd be beats beauty beer berlin best bestbuy bet bf bg bh bharti bi bible bid bike bing bingo bio biz bj black blackfriday blockbuster blog bloomberg blue bm bms bmw bn bnpparibas bo boats boehringer bofa bom bond boo book booking bosch bostik boston bot boutique box br bradesco bridgestone broadway broker brother brussels bs bt build builders business buy buzz bv bw by bz bzh ca cab cafe cal call calvinklein cam camera camp canon capetown capital capitalone car caravan cards care career careers cars casa case cash casino cat catering catholic cba cbn cbre cc cd center ceo cern cf cfa cfd cg ch chanel channel charity chase chat cheap chintai christmas chrome church ci cipriani circle cisco citadel citi citic city ck cl claims cleaning click clinic clinique clothing cloud club clubmed cm cn co coach codes coffee college cologne com commbank community company compare computer comsec condos construction consulting contact contractors cooking cool coop corsica country coupon coupons courses cpa cr credit creditcard creditunion cricket crown crs cruise cruises cu cuisinella cv cw cx cy cymru cyou cz dad dance data date dating datsun day dclk dds de deal dealer deals degree delivery dell deloitte delta democrat dental dentist desi design dev dhl diamonds diet digital direct directory discount discover dish diy dj dk dm dnp do docs doctor dog domains dot download drive dtv dubai dupont durban dvag dvr dz earth eat ec eco edeka edu education ee eg email emerck energy engineer engineering enterprises epson equipment er ericsson erni es esq estate et eu eurovision eus events exchange expert exposed express extraspace fage fail fairwinds faith family fan fans farm farmers fashion fast fedex feedback ferrari ferrero fi fidelity fido film final finance financial fire firestone firmdale fish fishing fit fitness fj fk flickr flights flir florist flowers fly fm fo foo food football ford forex forsale forum foundation fox fr free fresenius frl frogans frontier ftr fujitsu fun fund furniture futbol fyi ga gal gallery gallo gallup game games gap garden gay gb gbiz gd gdn ge gea gent genting george gf gg ggee gh gi gift gifts gives giving gl glass gle global globo gm gmail gmbh gmo gmx gn godaddy gold goldpoint golf goodyear goog google gop got gov gp gq gr grainger graphics gratis green gripe grocery group gs gt gu gucci guge guide guitars guru gw gy hair hamburg hangout haus hbo hdfc hdfcbank health healthcare help here hermes hiphop hisamitsu hitachi hiv hk hkt hm hn hockey holdings holiday homedepot homegoods homes homesense honda horse hospital host hosting hot hotels hotmail house how hr hsbc ht hu hughes hyatt hyundai ibm icbc ice icu id ie ieee ifm ikano il im imamat imdb immo immobilien in inc industries infiniti info ing ink institute insurance insure int international intuit investments io ipiranga iq ir irish is ismaili ist istanbul it itau itv jaguar java jcb je jeep jetzt jewelry jio jll jm jmp jnj jo jobs joburg jot joy jp jpmorgan jprs juegos kaufen kddi ke kerryhotels kerryproperties kfh kg kh ki kia kim kindle kitchen kiwi km kn koeln komatsu kosher kp kpmg kpn kr krd kred kuokgroup kw ky kyoto kz la lacaixa lamborghini lamer land landrover lanxess lasalle lat latino latrobe law lawyer lb lc lds lease leclerc lefrak legal lego lexus lgbt li lidl life lifeinsurance lifestyle lighting like lilly limited limo lincoln link live living lk llc llp loan loans locker locus lol london lotte lotto love lpl lplfinancial lr ls lt ltd ltda lu lundbeck luxe luxury lv ly ma madrid maif maison makeup man management mango map market marketing markets marriott marshalls mattel mba mc mckinsey md me med media meet melbourne meme memorial men menu merckmsd mg mh miami microsoft mil mini mint mit mitsubishi mk ml mlb mls mm mma mn mo mobi mobile moda moe moi mom monash money monster mormon mortgage moscow moto motorcycles mov movie mp mq mr ms msd mt mtn mtr mu museum mv mw mx my mz na nab nagoya name navy nba nc ne nec net netbank netflix network neustar new news next nextdirect nexus nf nfl ng ngo nhk ni nico nike nikon ninja nissan nissay nl no nokia norton now nowruz nowtv np nr nra nrw ntt nu nyc nz obi observer office okinawa olayan olayangroup ollo om omega one ong onl online ooo open oracle orange org organic origins osaka otsuka ott ovh pa page panasonic paris pars partners parts party pay pccw pe pet pf pfizer pg ph pharmacy phd philips phone photo photography photos physio pics pictet pictures pid pin ping pink pioneer pizza pk pl place play playstation plumbing plus pm pn pnc pohl poker politie porn post pr praxi press prime pro prod productions prof progressive promo properties property protection pru prudential ps pt pub pw pwc py qa qpon quebec quest racing radio re read realestate realtor realty recipes red redumbrella rehab reise reisen reit reliance ren rent rentals repair report republican rest restaurant review reviews rexroth rich richardli ricoh ril rio rip ro rocks rodeo rogers room rs rsvp ru rugby ruhr run rw rwe ryukyu sa saarland safe safety sakura sale salon samsclub samsung sandvik sandvikcoromant sanofi sap sarl sas save saxo sb sbi sbs sc scb schaeffler schmidt scholarships school schule schwarz science scot sd se search seat secure security seek select sener services seven sew sex sexy sfr sg sh shangrila sharp shell shia shiksha shoes shop shopping shouji show si silk sina singles site sj sk ski skin sky skype sl sling sm smart smile sn sncf so soccer social softbank software sohu solar solutions song sony soy space sport spot sr srl ss st stada staples star statebank statefarm stc stcgroup stockholm storage store stream studio study style su sucks supplies supply support surf surgery suzuki sv swatch swiss sx sy sydney systems sz tab taipei talk taobao target tatamotors tatar tattoo tax taxi tc tci td tdk team tech technology tel temasek tennis teva tf tg th thd theater theatre tiaa tickets tienda tips tires tirol tj tjmaxx tjx tk tkmaxx tl tm tmall tn to today tokyo tools top toray toshiba total tours town toyota toys tr trade trading training travel travelers travelersinsurance trust trv tt tube tui tunes tushu tv tvs tw tz ua ubank ubs ug uk unicom university uno uol ups us uy uz va vacations vana vanguard vc ve vegas ventures verisign versicherung vet vg vi viajes video vig viking villas vin vip virgin visa vision viva vivo vlaanderen vn vodka volvo vote voting voto voyage vu wales walmart walter wang wanggou watch watches weather weatherchannel webcam weber website wed wedding weibo weir wf whoswho wien wiki williamhill win windows wine winners wme woodside work works world wow ws wtc wtf xbox xerox xihuan xin xn--11b4c3d xn--1ck2e1b xn--1qqw23a xn--2scrj9c xn--30rr7y xn--3bst00m xn--3ds443g xn--3e0b707e xn--3hcrj9c xn--3pxu8k xn--42c2d9a xn--45br5cyl xn--45brj9c xn--45q11c xn--4dbrk0ce xn--4gbrim xn--54b7fta0cc xn--55qw42g xn--55qx5d xn--5su34j936bgsg xn--5tzm5g xn--6frz82g xn--6qq986b3xl xn--80adxhks xn--80ao21a xn--80aqecdr1a xn--80asehdb xn--80aswg xn--8y0a063a xn--90a3ac xn--90ae xn--90ais xn--9dbq2a xn--9et52u xn--9krt00a xn--b4w605ferd xn--bck1b9a5dre4c xn--c1avg xn--c2br7g xn--cck2b3b xn--cckwcxetd xn--cg4bki xn--clchc0ea0b2g2a9gcd xn--czr694b xn--czrs0t xn--czru2d xn--d1acj3b xn--d1alf xn--e1a4c xn--eckvdtc9d xn--efvy88h xn--fct429k xn--fhbei xn--fiq228c5hs xn--fiq64b xn--fiqs8s xn--fiqz9s xn--fjq720a xn--flw351e xn--fpcrj9c3d xn--fzc2c9e2c xn--fzys8d69uvgm xn--g2xx48c xn--gckr3f0f xn--gecrj9c xn--gk3at1e xn--h2breg3eve xn--h2brj9c xn--h2brj9c8c xn--hxt814e xn--i1b6b1a6a2e xn--imr513n xn--io0a7i xn--j1aef xn--j1amh xn--j6w193g xn--jlq480n2rg xn--jvr189m xn--kcrx77d1x4a xn--kprw13d xn--kpry57d xn--kput3i xn--l1acc xn--lgbbat1ad8j xn--mgb9awbf xn--mgba3a3ejt xn--mgba3a4f16a xn--mgba7c0bbn0a xn--mgbaam7a8h xn--mgbab2bd xn--mgbah1a3hjkrd xn--mgbai9azgqp6j xn--mgbayh7gpa xn--mgbbh1a xn--mgbbh1a71e xn--mgbc0a9azcg xn--mgbca7dzdo xn--mgbcpq6gpa1a xn--mgberp4a5d4ar xn--mgbgu82a xn--mgbi4ecexp xn--mgbpl2fh xn--mgbt3dhd xn--mgbtx2b xn--mgbx4cd0ab xn--mix891f xn--mk1bu44c xn--mxtq1m xn--ngbc5azd xn--ngbe9e0a xn--ngbrx xn--node xn--nqv7f xn--nqv7fs00ema xn--nyqy26a xn--o3cw4h xn--ogbpf8fl xn--otu796d xn--p1acf xn--p1ai xn--pgbs0dh xn--pssy2u xn--q7ce6a xn--q9jyb4c xn--qcka1pmc xn--qxa6a xn--qxam xn--rhqv96g xn--rovu88b xn--rvc1e0am3e xn--s9brj9c xn--ses554g xn--t60b56a xn--tckwe xn--tiq49xqyj xn--unup4y xn--vermgensberater-ctb xn--vermgensberatung-pwb xn--vhquv xn--vuq861b xn--w4r85el8fhu5dnra xn--w4rs40l xn--wgbh1c xn--wgbl6a xn--xhq521b xn--xkc2al3hye2a xn--xkc2dl3a5ee0h xn--y9a3aq xn--yfro4i67o xn--ygbi2ammx xn--zfr164b xxx xyz yachts yahoo yamaxun yandex ye yodobashi yoga yokohama you youtube yt yun za zappos zara zero zip zm zone zuerich zw'/*TLDS-END*/.split(' ').join('|');

  // ---- URL検出 ----
  // ドメイン文字: プロトコル付きは非ASCIIの大半を許容、プロトコル無しはASCII+ラテン拡張のみ
  var LATIN = '\\u00c0-\\u00d6\\u00d8-\\u00f6\\u00f8-\\u024f\\u0253\\u0254\\u0256\\u0257\\u0259\\u025b\\u0260\\u0263\\u0268\\u0269\\u026f\\u0272\\u0275\\u0280\\u0283\\u0288-\\u028c\\u0292\\u02bb\\u0300-\\u036f\\u0399\\u03b9\\u1e00-\\u1eff\\u1fbe\\u2c65\\u2c66\\u2c7e\\u2c7f';
  var WIDE = '\\x22\\x60\\u00a1-\\u167f\\u1681-\\u180d\\u180f-\\u1fff\\u200b-\\u200d\\u2010-\\u2027\\u2030-\\u205e\\u2060-\\u2065\\u206a-\\u{10ffff}';

  // 名前ラベル+TLD。TLD直後が + @ の場合はメール等とみなしURLにしない。
  // opts.underscoreSub: サブドメインに _ を許可(プロトコル付きのみ)。opts.minSub: サブドメイン1個以上必須。
  function domain(extra, opts) {
    opts = opts || {};
    var an = 'A-Za-z0-9' + extra;
    var label = '(?:[' + an + '][' + an + '-]*)?[' + an + ']';
    var subLabel = '(?:[' + an + '][' + an + (opts.underscoreSub ? '_' : '') + '-]*)?[' + an + ']';
    return '(?:' + subLabel + '\\.)' + (opts.minSub ? '+' : '*') + label + '\\.(?:' + TLDS + ')(?![A-Za-z0-9+@-])';
  }

  var P_MID = "[A-Za-z0-9!#$%&'*+,\\-./:;=@\\[\\]_|~\\u2013" + LATIN + ']';
  var P_END = '[A-Za-z0-9#+\\-/=_' + LATIN + ']';
  var PAREN = '\\(' + P_MID + '*\\)';
  var PATH = '/(?:(?:' + P_MID + '|' + PAREN + ')*(?:' + P_END + '|' + PAREN + '))?';
  var Q_MID = "[A-Za-z0-9!#$%&'()*+,\\-./:;=?@\\[\\]_|~]";
  var QUERY = '\\?' + Q_MID + '*[A-Za-z0-9#&/=_-]'; // "?" だけは含めない
  var PRE = '(?<![A-Za-z0-9@\\uff20$#\\uff03\\u202a-\\u202e])';

  function urlRegex() {
    var withProto = 'https?://' + domain(WIDE, { underscoreSub: true }) + '(?::[0-9]+)?(?:' + PATH + ')?(?:' + QUERY + ')?';
    // プロトコル無しはポート/クエリ単独を含めず、"/" パスがあるときだけ付随させる。
    var tail = '(?:(?::[0-9]+)?' + PATH + '(?:' + QUERY + ')?)?';
    // 公式の癖: 先頭がラテン拡張文字(é等)の場合、文字列先頭では直前文字扱いになり次の文字からURL
    var notAtStart = '(?!^(?![\\x00-\\x7f])[' + LATIN + '](?!\\.))'; // i フラグで ſ が s に畳まれるため ASCII を除外
    var noProto = '(?<![-_./])' + notAtStart + domain(LATIN) + tail;
    // 公式の癖: "_" の直前でもサブドメインを含む3ラベル以上なら先行文字として許容される
    var afterUnderscore = '(?<=[A-Za-z0-9]_)' + domain(LATIN, { minSub: true }) + tail;
    // 公式の癖: プロトコル無しで [-_./] の直後に「非ASCII等を含むドメイン文字の連なり+TLD」が続くと、
    // 全体が(無効な先行文字により)URL扱いされず、途中の "example.com" 部分も拾われない。
    var run = '[A-Za-z0-9\\-._/]*[' + '"#$@`' + WIDE + '][A-Za-z0-9"#$@`' + WIDE + '\\-._/]*';
    var swallow = '[-_./]' + run + '\\.(?:' + TLDS + ')(?![A-Za-z0-9+@-])';
    return new RegExp(PRE + '(?:' + withProto + '|' + noProto + '|' + afterUnderscore + '|(?<swallow>' + swallow + '))', 'giu');
  }

  // ---- 絵文字 ----
  // 1個 = キーキャップ / 国旗(RI2つ) / ZWJ結合 / 単体(肌色・VS16付き・絵文字表示)。
  // VS16なしのテキスト字形(© ® など)は絵文字扱いせず通常の文字重みを適用する。
  var E_LOOSE = '\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?';
  var E_SOLO = '(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}|\\p{Emoji_Presentation}|\\p{Extended_Pictographic}\\uFE0F)';
  var TAGS = '[\\u{E0020}-\\u{E007F}]*'; // 地域旗のタグ列
  var TOKEN_SRC = '(\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3|' + E_LOOSE + '(?:\\u200D' + E_LOOSE + ')+|' + E_SOLO + TAGS + ')|[\\s\\S]';

  function cpWeight(cp, config) {
    var r = config.weightOneRanges;
    for (var i = 0; i < r.length; i++) if (cp >= r[i][0] && cp <= r[i][1]) return config.weightOne;
    return config.defaultWeight;
  }

  /** [start,end) をトークン化して state.weighted に加算し、初超過位置(UTF-16 index)を記録。 */
  function weighSegment(text, start, end, config, state) {
    var re = new RegExp(TOKEN_SRC, 'gu'), m, seg = text.slice(start, end);
    while ((m = re.exec(seg)) !== null) {
      state.weighted += m[1] ? config.emojiWeight : cpWeight(m[0].codePointAt(0), config);
      if (state.overflowIndex < 0 && state.weighted > config.maxWeightedLength) state.overflowIndex = start + m.index;
    }
  }

  function findUrls(text) {
    var out = [], re = urlRegex(), m;
    while ((m = re.exec(text)) !== null) {
      if (!m.groups.swallow) out.push({ start: m.index, end: m.index + m[0].length });
    }
    return out;
  }

  /** overflowIndex: 超過が始まる位置(NFC正規化後文字列のUTF-16 index)。超過なしは -1。 */
  function analyze(input, options) {
    var config = Object.assign({}, CONFIG, options || {});
    var text = String(input == null ? '' : input).normalize('NFC');
    var urls = findUrls(text);
    var state = { weighted: 0, overflowIndex: -1 };
    var limit = config.maxWeightedLength, pos = 0;

    urls.forEach(function (u) {
      weighSegment(text, pos, u.start, config, state);
      state.weighted += config.urlLength;
      if (state.overflowIndex < 0 && state.weighted > limit) state.overflowIndex = u.start;
      pos = u.end;
    });
    weighSegment(text, pos, text.length, config, state);

    return {
      weighted: state.weighted,
      codePoints: Array.from(text).length,
      limit: limit,
      remaining: limit - state.weighted,
      over: state.weighted > limit,
      overflowIndex: state.overflowIndex,
      urls: urls.length
    };
  }

  return { analyze: analyze, findUrls: findUrls, CONFIG: CONFIG };
});
