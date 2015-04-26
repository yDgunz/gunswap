go();

function go() {
	outputs = {siteswaps: []};
	$('#siteswaps').empty();

	SiteswapGenerator.getSiteswaps({period: 7, numProps: 3}, outputs, function() { buildGraph(outputs.graph, outputs.states); } );	

	/*
	setInterval(function() { 
		var numFound = $("#siteswaps li").length;
		for (var i = 0; i < outputs.siteswaps.length-numFound; i++) {
			$('#siteswaps').append('<li>' + outputs.siteswaps[numFound+i] + '</li>');
		}
		//console.log(outputs.origStateIx + ' ' + outputs.history.map(function(a) { return a.transition; }).join(''));
	},0);
	*/
}

function buildGraph(graph,states) {

    var w = 600;
    var h = 600;
    var linkDistance=300;

    var colors = d3.scale.category10();

    var dataset = { nodes: [], edges: [] };

    for (var i = 0; i < graph.length; i++) {
    	dataset.nodes.push({name: states[i].join('') });
		for (var j = 0; j < graph[i].length; j++) {
			dataset.edges.push({source: i, target: graph[i][j].stateIx, value: graph[i][j].transition});
		}	
    }

    var svg = d3.select("body").append("svg").attr({"width":w,"height":h});

    var force = d3.layout.force()
        .nodes(dataset.nodes)
        .links(dataset.edges)
        .size([w,h])
        .linkStrength(0.1)
	    .friction(0.9)
	    .linkDistance(linkDistance)
	    .charge(-30)
	    .gravity(0.1)
	    .theta(0.8)
	    .alpha(0.1)
	    .start();

    var edges = svg.selectAll("line")
      .data(dataset.edges)
      .enter()
      .append("line")
      .attr("id",function(d,i) {return 'edge'+i})
      .style("stroke","#ccc");
    
    var nodes = svg.selectAll("circle")
      .data(dataset.nodes)
      .enter()
      .append("circle")
      .attr("id",function(d,i) {return 'node'+i})
      .attr({"r":10})
      .style("fill",function(d,i){return colors(i);})
      .on("click",function() {
     	svg.select('#'+this.id).attr({"r":20});
      });

    force.on("tick", function(){

        edges.attr({"x1": function(d){return d.source.x;},
                    "y1": function(d){return d.source.y;},
                    "x2": function(d){return d.target.x;},
                    "y2": function(d){return d.target.y;}
        });

        nodes.attr({"cx":function(d){return d.x;},
                    "cy":function(d){return d.y;}
        });

    });

	window.svg = svg;

}