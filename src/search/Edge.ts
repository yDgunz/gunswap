import { Node } from "./Node";

export interface Edge {
	SourceNode : number;
	TargetNode : number;
	Value : string;
}

export function GetEdges(nodes : Node[]) : Edge[] {
	var edges : Edge[] = [];

	// compare all nodes
	for (var i = 0; i < nodes.length; i++) {
		for (var j = 0; j < nodes.length; j++) {				
			
			var edgeValue = GetEdgeValue(nodes[i], nodes[j]);
			if (edgeValue) {
				nodes[i].Edges.push(edges.push({SourceNode: i, TargetNode: j, Value: edgeValue})-1);
			}

		}
	}

	return edges;
}


export function GetEdgeValue(source : Node, target : Node) : string|null {

	var edgeValue = "";

	var nextUp = source.LandingSchedule[0];
	var newNodeLandingSchedule = source.LandingSchedule.slice(1,target.LandingSchedule.length);
	newNodeLandingSchedule.push(0);


	var multiplex = false;
	if (nextUp == 0) {
		edgeValue = "0";
	} else if (nextUp > 1) {
		multiplex = true;
		edgeValue = "[";
	}
	for (var i = 0; i < newNodeLandingSchedule.length; i++) {
		var tossValue = i+1;
		var tossValueString = tossValue.toString();
		if (tossValue > 9) {
			tossValueString = String.fromCharCode(87+tossValue);
		}
		if(newNodeLandingSchedule[i] != target.LandingSchedule[i]) {
			if (nextUp >= (target.LandingSchedule[i] - newNodeLandingSchedule[i])) {
				edgeValue += tossValueString;
				nextUp--;
				if (nextUp == 1 && (target.LandingSchedule[i] - newNodeLandingSchedule[i]) == 2) {
					edgeValue += tossValueString;
					nextUp--;
				}	
			} else {
				return null;
			}
		}
	}
	if (multiplex) {
		edgeValue += ']';
	}	

	return edgeValue;

}