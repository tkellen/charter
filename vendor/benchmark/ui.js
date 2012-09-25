var log = document.getElementById('log');
var results = document.getElementById('results');

// show realtime data as benchmark runs
var benchdata = function () {
  var size = this.stats.sample.length;
  if (!this.aborted) {
    log.innerHTML = (this.name + ' &times; ' + this.count + ' (' +
        size + ' sample' + (size == 1 ? '' : 's') + ')');
  }
};

// add suite to page
var addSuite = function(suite) {

  // append suite to list of benchmarks that are runnable
  $('#suites').append("<li>"+suite.name+" [run]</li>")
              .click(function(){suite.run({async:true});});

  // add realtime logging to each benchmark
  for(var i=0, len = suite.length; i < len; i++) {
    suite[i].on("start cycle", benchdata);
  }

  // inform page we are starting
  suite.on("start", function () {
    results.innerHTML = "<strong>Running "+this.name+":</strong><br/><br/>";
  }).

  // when switching tests, show the result for the previous benchmark
  on("cycle", function (event) {
    var bench = event.target;
    results.innerHTML += "<span id=\"result"+bench.id+"\">"+String(bench)+"</span><br/>";
  }).

  // display fastest test and clear realtime log
  on("complete", function () {
    var id = this.filter("fastest").pluck("id");
    var name = this.filter("fastest").pluck("name");
    results.innerHTML += "<br/>Fastest is <strong>"+name+"</strong>.";
    log.innerHTML = "";
    $("#result"+id).addClass('fastest');
  });

  return suite;
};