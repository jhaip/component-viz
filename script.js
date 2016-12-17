class BaseVisualizer {
    constructor(parent, windowSize) {
        this.parent = parent
        this.windowSize = windowSize
        this.inputSize = 1
        this.startIndexInWindow = 0
        this.stopIndexInWindow = this.windowSize-1
    }
}

class TextVisualizer extends BaseVisualizer {
    visualize(index, index_in_window, data) {
        // using jQuery to append a text element
        var el = $("<span></span>").attr("class", "item").text(data+", ");
        $(this.parent).append(el);
    }
}

class LineGraphVisualizer extends BaseVisualizer {
    constructor(parent, windowSize, xScale = 20, yScale = 10, color = "black", dotRadius = 2) {
        super(parent, windowSize);
        this.inputSize = 2
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

class ColorVisualizer extends BaseVisualizer {
    visualize(index, index_in_window, data) {
        d3.select(this.parent).append("div")
            .attr("class", "item")
            .style("width", "40px")
            .style("height", "40px")
            .style("float", "left")
            .style("background-color", d3.rgb(255,0,0,0.1*data));
    }
}

class CircleVisualizer extends BaseVisualizer {
    constructor(parent, windowSize, elementSize = 40, color = "red") {
        super(parent, windowSize);
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

class EntireWindowVisualizer extends BaseVisualizer {
    constructor(parent, windowSize) {
        super(parent, windowSize);
        this.inputSize = windowSize;
        this.stopIndexInWindow = 0;
    }
    visualize(index, index_in_window, data) {
        // proof that the entire window can be passed in at once to create a graph as normal
        // one example fit is using d3 to render the entire window and to take advantage
        // of transitions, updates, etc of d3 that aren't available when creating each
        // visual individually.
        var el = $("<span></span>").attr("class", "item").text(data.toString());
        $(this.parent).append(el);
    }
}

var data = [4];
var WINDOW_SIZE = 7;
var visualizers = [new TextVisualizer($("#stage2").get(0), WINDOW_SIZE),
                   new LineGraphVisualizer($("#stage").get(0), WINDOW_SIZE),
                   new ColorVisualizer($("#stage3").get(0), WINDOW_SIZE),
                   new CircleVisualizer($("#stage4").get(0), WINDOW_SIZE),
                   new EntireWindowVisualizer($("#stage5").get(0), WINDOW_SIZE)];

function confineIndexToWindow(index) {
    if (index < 0)
        return 0;
    if (index >= data.length)
        return data.length-1;
    return index;
}

function updateScene(windowStart) {
    windowStart = parseInt(windowStart);
    windowStart = Math.max(0, windowStart);
    var windowEnd = confineIndexToWindow(windowStart+WINDOW_SIZE);
    $(".stage").empty();
    $("#windowStart").val(windowStart);
    $("#windowStartValue").text(`Window: ${windowStart} - ${windowEnd}`);
    var windowStartOffset = Math.min(...visualizers.map(function(v) { return v.startIndexInWindow; }))
    for (var i=windowStartOffset; i<WINDOW_SIZE; i++) {
        var indexOutsideWindow = windowStart + i;
        if (indexOutsideWindow >= Math.min(data.length-1, 0) && indexOutsideWindow < data.length) {
            visualizers.forEach(function(v) {
                if (i >= v.startIndexInWindow && i <= v.stopIndexInWindow) {
                    if (v.inputSize > 1) {
                        if (indexOutsideWindow+v.inputSize <= data.length) {
                            v.visualize(indexOutsideWindow, i, data.slice(indexOutsideWindow, indexOutsideWindow+v.inputSize));
                        }
                    } else {
                        v.visualize(indexOutsideWindow, i, data[indexOutsideWindow]);
                    }
                }
            });
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function update_data() {
    $("#windowStart").attr("max", Math.max(data.length-1, data.length-WINDOW_SIZE));
    updateScene(data.length-WINDOW_SIZE);
}

$("#addDataButton").click(function(e) {
    data.push(getRandomInt(0,10));
    update_data();
});

$("#playButton").click(function(e) {
    var start = $("#windowStart").val();
    var stop = $("#windowStart").attr("max");
    var i = start;
    var timer = setInterval(function() {
        updateScene(i);
        i++;
        if (i > stop) {
            clearInterval(timer);
        }
    }, 100);
});

update_data();
