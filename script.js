class BaseVisualizer {
    constructor(parent, windowSize) {
        this.parent = parent;
    }
}

class SingleIterationSelector extends BaseVisualizer {
    selectIndices(windowStart, windowEnd) {
        var indices = [];
        for (var i = windowStart; i <= windowEnd; i++) {
            indices.push([i, 1]);
        }
        return indices;
    }
}

class LastValueSelector extends BaseVisualizer {
    selectIndices(windowStart, windowEnd) {
        return [[windowEnd, 1]];
    }
}

class PairIterationSelector extends BaseVisualizer {
    selectIndices(windowStart, windowEnd) {
        var indices = [];
        for (var i = Math.max(0, windowStart-1); i <= windowEnd-1; i++) {
            indices.push([i,2]);
        }
        return indices;
    }
}
class WholeWindowSelector extends BaseVisualizer {
    selectIndices(windowStart, windowEnd) {
        return [[windowStart, windowEnd-windowStart+1]];
    }
}

class LogVisualizer extends SingleIterationSelector {
    visualize(index, index_in_window, data) {
        // using jQuery to append a text element
        var el = $("<div></div>").attr("class", "item").text(`Value = ${data[0]}`);
        $(this.parent).append(el);
    }
}
class LastValueTextVisualizer extends LastValueSelector {
    visualize(index, index_in_window, data) {
        // using jQuery to append a text element
        var el = $("<div></div>").attr("class", "item").text(`Value = ${data[0]}`);
        $(this.parent).append(el);
    }
}

class LineGraphVisualizer extends PairIterationSelector {
    constructor(parent, xScale = 20, yScale = 10, color = "black", dotRadius = 2) {
        super(parent, 0);
        this.inputSize = 2;
        this.xScale = xScale;
        this.yScale = yScale;
        this.color = color;
        this.dotRadius = dotRadius;
        this.startIndexInWindow = -1;
        this.stopIndexInWindow = this.windowSize-2
    }
    visualize(index, index_in_window, data) {
        // using d3 to create svg elements
        // each item is a line from the previous point to the next one
        // and dot at the next value
        // CSS on the .item class stacks the elements on top of each other to
        // create a line graph
        var el = d3.select(this.parent).append("svg").attr("class", "item");
        el.append("circle")
            .attr("cx", (index_in_window+1)*this.xScale)
            .attr("cy", data[1]*this.yScale)
            .attr("r", this.dotRadius)
            .style("fill", this.color);
        el.append("line")
            .style("stroke", this.color)
            .attr("x1", index_in_window*this.xScale)
            .attr("y1", data[0]*this.yScale)
            .attr("x2", (index_in_window+1)*this.xScale)
            .attr("y2", data[1]*this.yScale);
    }
}

class ColorVisualizer extends SingleIterationSelector {
    visualize(index, index_in_window, data) {
        d3.select(this.parent).append("div")
            .attr("class", "item")
            .style("width", "40px")
            .style("height", "40px")
            .style("float", "left")
            .style("background-color", d3.rgb(255,0,0,0.1*data));
    }
}

class CircleVisualizer extends SingleIterationSelector {
    constructor(parent, elementSize = 40, color = "red") {
        super(parent, 0);
        this.elementSize = elementSize;
        this.color = color;
    }
    visualize(index, index_in_window, data) {
        // create an element where the data is visualized as color
        var svg = d3.select(this.parent).append("svg")
            .attr("class", "item")
            .attr("width", this.elementSize)
            .attr("height", this.elementSize);
        svg.append("circle")
            .attr("r", data)
            .attr("cx", this.elementSize/2)
            .attr("cy", this.elementSize/2)
            .style("fill", this.color);
    }
}

class EntireWindowVisualizer extends WholeWindowSelector {
    visualize(index, index_in_window, data) {
        // proof that the entire window can be passed in at once to create a graph as normal
        // one example fit is using d3 to render the entire window and to take advantage
        // of transitions, updates, etc of d3 that aren't available when creating each
        // visual individually.
        var el = $("<span></span>").attr("class", "item").text(data.toString());
        $(this.parent).append(el);
    }
}

class PlotlyLineVisualizer extends WholeWindowSelector {
    visualize(index, index_in_window, data) {
        // proof that the entire window can be passed in at once to create a graph as normal
        // one example fit is using d3 to render the entire window and to take advantage
        // of transitions, updates, etc of d3 that aren't available when creating each
        // visual individually.
        var el = $("<div></div>").attr("id", "myDiv").css({width: "400px", height: "400px"});
        $(this.parent).append(el);

        var x = [];
        for (var i=0; i<data.length; i++) {
            x.push(i);
        }

        var trace = {
          x: x,
          y: data,
          type: 'scatter'
        };

        Plotly.newPlot('myDiv', [trace]);
    }
}

var data = [4];
var WINDOW_SIZE = 7;
var visualizers = [new LogVisualizer($("#stage").get(0)),
                   new LastValueTextVisualizer($("#stage2").get(0)),
                   new LineGraphVisualizer($("#stage3").get(0)),
                   new ColorVisualizer($("#stage4").get(0)),
                   new CircleVisualizer($("#stage5").get(0)),
                   new EntireWindowVisualizer($("#stage6").get(0)),
                   new PlotlyLineVisualizer($("#stage7").get(0))
                  ];

function updateScene(windowStart, windowEnd) {
    $(".stage").empty();
    visualizers.forEach(function(v) {
        v.selectIndices(windowStart, windowEnd).forEach(function(i_n) {
            var i = i_n[0];
            var n = i_n[1];
            v.visualize(i, i-windowStart, data.slice(i, i+n));
        });
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function update_data() {
    $( "#slider-range" ).slider( "option", "max", data.length-1 );
    var newMin = Math.max(0, data.length-WINDOW_SIZE);
    $( "#slider-range" ).slider( "option", "values", [newMin, data.length-1] );
    update_slider_text();
    updateScene(newMin, data.length-1);
}

$("#addDataButton").click(function(e) {
    data.push(getRandomInt(0,10));
    update_data();
});

var STOP_AT_FULL_WINDOW_IF_POSSIBLE = true;
$("#playButton").click(function(e) {
    var start = parseInt($("#windowStart").val());
    var stop = parseInt($("#windowStart").attr("max"));
    if (start == stop) {
        start = parseInt($("#windowStart").attr("min"));
    }
    if (STOP_AT_FULL_WINDOW_IF_POSSIBLE) {
        if (stop >= WINDOW_SIZE) {
            stop = data.length-WINDOW_SIZE;
        }
    }
    var i = start;
    var timer = setInterval(function() {
        updateScene(i);
        i++;
        if (i > stop) {
            clearInterval(timer);
        }
    }, 100);
});

function update_slider_text() {
    var min = slider.slider("values", 0);
    var max = slider.slider("values", 1);
    $( "#amount" ).val(`${min} - ${max}`);
}

var slider = $( "#slider-range" ).slider({
    range: true,
    min: 0,
    max: 0,
    values: [ 0, 0 ],
    slide: function( event, ui ) {
      update_slider_text();
    }
});
// $( "#slider-range" ).slider( "option", "values", [10,250] );
// $( "#slider-range" ).slider( "option", "min", 10 );
// $( ".selector" ).slider({ change: function( event, ui ) {} });
// $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) + " - $" + $( "#slider-range" ).slider( "values", 1 ) );
update_slider_text();

update_data();
