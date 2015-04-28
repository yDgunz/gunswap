d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function go() {
	outputs = {siteswaps: []};
	$('#siteswaps').empty();
	$('#graphContainer').empty();

	var callbacks = {
		onNodeSearch: function (origNodeIx,history) {

			$("#currentSiteswap").text(history.map(function(a) { return outputs.graph.edges[a].value; }).join(''));

			var nodes = svg.selectAll("circle").attr({"r":5});
			var edges = svg.selectAll("line").style("stroke-width","1");
			svg.select('#node'+origNodeIx).attr({"r":10});
			for (var i = 0; i < history.length; i++) {
				svg.select('#node'+outputs.graph.edges[history[i]].target).attr({"r":10});
				svg.select('#edge'+history[i]).style("stroke-width","5");
			}
		},

		onGraphCreated: function (onForceEnd) {
			return buildGraph(outputs.graph, outputs.states, onForceEnd);		
		},

		onSiteswapAdded: function(siteswap, siteswapIx) {
			$('#siteswaps').append('<li><a href="#" id="' + siteswapIx + '" onclick="showSiteswap(' + siteswapIx + ');">' + siteswap.join('') + '</a></li>');
		}

	}

	SiteswapGenerator.getSiteswaps({period: parseInt($('#period').val()), numProps: parseInt($('#numProps').val()), delay: parseInt($('#delay').val())}, outputs, callbacks);

}

function showSiteswap(siteswapIx) {
	var nodes = svg.selectAll("circle").attr({"r":5});
	var edges = svg.selectAll("line").style("stroke-width","1");
	var nodeLabels = svg.selectAll(".nodeLabel").style("display","none");
	var history = outputs.siteswaps[siteswapIx].history;
	for (var i = 0; i < history.length; i++) {
		svg.select('#node'+outputs.graph.edges[history[i]].target).attr({"r":15});
		svg.select('#nodeLabel'+outputs.graph.edges[history[i]].target).style("display",null);
		svg.select('#edge'+history[i]).style("stroke-width","5");
	}
	$('#currentSiteswap').text(siteswaps[siteswapIx].siteswap);
}

function buildGraph(graph,states,onForceEnd) {

	var w = $('#graphContainer').width()-50;
	var h = $(window).height()-50;
	var linkDistance=w/2;

	//var dataset = { nodes: [], edges: [] };
	dataset = { nodes: [], edges: [] };

	for (var i = 0; i < graph.nodes.length; i++) {
		dataset.nodes.push({name: graph.nodes[i].state.join('')});
		for (var j = 0; j < graph.nodes[i].edges.length; j++) {
			dataset.edges.push({source: i, target: graph.edges[graph.nodes[i].edges[j]].target, value: graph.edges[graph.nodes[i].edges[j]].value});
		}	
	}

	var svg = d3.select("#graphContainer").append("svg").attr({"width":w,"height":h});

	//var force = d3.layout.force()
	force = d3.layout.force()
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

	force.on("end",onForceEnd);

	var edges = svg.selectAll("line")
		.data(dataset.edges)
		.enter()
		.append("line")
		.attr("id",function(d,i) {return 'edge'+i})
		.style("stroke","#ccc");
    
	var nodes = svg.selectAll(".node")
		.data(dataset.nodes)
		.enter()
		.append("g")
		.attr("class","node")
		.call(force.drag); 

	nodes.append("circle")
		.attr("id",function(d,i) {return 'node'+i})
		.attr("r",5)
		.style("fill",function(d,i){return i == 0 ? 'blue' : 'red';});

	nodes.append("text")
		.attr("x",15)
		.attr("class","nodeLabel")
		.attr("id",function(d,i) { return "nodeLabel"+i; })
		.style("display","none")
		.text(function(d) { return d.name });


	force.on("tick", function(){

		edges.attr({"x1": function(d){return d.source.x;},
					"y1": function(d){return d.source.y;},
					"x2": function(d){return d.target.x;},
					"y2": function(d){return d.target.y;}
		});

		nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	});

	window.svg = svg;

	return force;

}