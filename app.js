(function () {
  'use strict';
  var input = document.getElementById('input');
  var weighted = document.getElementById('weighted');
  var codepoints = document.getElementById('codepoints');
  var remaining = document.getElementById('remaining');
  var status = document.getElementById('status');
  var highlight = document.getElementById('highlight');
  var counter = document.getElementById('counter');

  function render() {
    var r = MojiCounter.analyze(input.value);
    weighted.textContent = r.weighted + ' / ' + r.limit;
    codepoints.textContent = r.codePoints;
    remaining.textContent = r.remaining;
    counter.className = r.over ? 'over' : '';
    status.textContent = r.over ? '超過: ' + (-r.remaining) + ' 重み分オーバーしています' : '上限内です';
    // 超過部分のハイライト(textContentで挿入しXSSを避ける)
    highlight.textContent = '';
    if (r.over) {
      var n = input.value.normalize('NFC');
      highlight.appendChild(document.createTextNode(n.slice(0, r.overflowIndex)));
      var mark = document.createElement('mark');
      mark.textContent = n.slice(r.overflowIndex);
      highlight.appendChild(mark);
    }
  }

  input.addEventListener('input', render);
  document.getElementById('clear').addEventListener('click', function () {
    input.value = ''; render(); input.focus();
  });
  document.getElementById('copy').addEventListener('click', function () {
    if (navigator.clipboard) navigator.clipboard.writeText(input.value);
    else { input.select(); document.execCommand('copy'); }
  });
  render();
})();
