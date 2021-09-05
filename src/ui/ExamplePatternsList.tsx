import React, { Component, ReactNode } from 'react';
import { List, Link } from 'office-ui-fabric-react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths } from '../simulator/DwellPath';
import { PatternSettings } from './PatternSettings';
import ReactDOM from 'react-dom';

interface Props {
	updatePattern : Function
}

interface ExamplePattern {
	name: string,
	patternSettings: PatternSettings
}

export class ExamplePatternsList extends Component<Props,any> {
	examplePatternListDomElement: any;

	constructor(props : any) {
		super(props);		

		this.onRenderCell = this.onRenderCell.bind(this);
		this.jugglePattern = this.jugglePattern.bind(this);

		this.examplePatternListDomElement = React.createRef();

	}

	private jugglePattern(patternSettings : PatternSettings) {
		var s = new Siteswap(patternSettings.siteswap);
		var pattern = new Pattern(s, GetDwellPaths(patternSettings.dwellPath), patternSettings.dwellRatio, 1);
		pattern.Simulate(100,patternSettings.beatDuration);		

		this.props.updatePattern(pattern, patternSettings);
	}

	private onRenderCell(item?: ExamplePattern, index?: number | undefined): ReactNode {
		return (
			<div id={index!.toString()}>
				<Link onClick={() => {this.jugglePattern((item as ExamplePattern).patternSettings)}}>{(item as ExamplePattern).name}</Link>
			</div>
		);
	}

	componentDidMount() {
		var exampleListDomNode = ReactDOM.findDOMNode(this.examplePatternListDomElement.current);
		if (exampleListDomNode) {
			(exampleListDomNode as any).style.height = (window.innerHeight - (exampleListDomNode as any).offsetTop - 40).toString()+"px";
			(exampleListDomNode as any).style.overflow = "auto";
		}		
	}

	render() {

		var examplePatterns = [
			{
				name: "Cascade",
				patternSettings: {
					siteswap: "3",
					dwellPath: "(30)(10)",
					beatDuration: 0.24,
					dwellRatio: 0.8
				}
			},
			{
				name: "Reverse Cascade",
				patternSettings: {
					siteswap: "3",
					dwellPath: "(10)(30)",
					beatDuration: 0.24,
					dwellRatio: 0.8
				}
			},
			{
				name: "Columns",
				patternSettings: {
					siteswap: "(4,4)(4,0)",
					dwellPath: "(20).(20).(0)",
					beatDuration: 0.24,
					dwellRatio: 0.8
				}
			},
			{
				name: "Yo-Yo",
				patternSettings: {
					siteswap: "(4,2)",
					dwellPath: "(20).(0,60).(0).(0,25)",
					beatDuration: 0.2,
					dwellRatio: 1.1
				}
			},
			{
				name: "Tennis",
				patternSettings: {
					siteswap: "3",
					dwellPath: "(35,15).(20)(7).(20)(7)",
					beatDuration: 0.24,
					dwellRatio: 0.9
				}
			},
			{
				name: "423",
				patternSettings: {
					siteswap: "423",
					dwellPath: "(30).(30).(30)(10)",
					beatDuration: 0.24,
					dwellRatio: 0.8
				}
			},
			{
				name: "Factory",
				patternSettings: {
					siteswap: "(2,4)(2,4x)(2x,4)",
					dwellPath: "(20).(20).(30,40).(0).(-20,40).(30)(0)",
					beatDuration: 0.24,
					dwellRatio: 1.2
				}
			},
			{
				name: "Mill's Mess",
				patternSettings: {
					siteswap: "3",
					dwellPath: "(0,10)(-20,10).(0)(20).(0,0)(-20,0)",
					beatDuration: 0.24,
					dwellRatio: 1
				}
			}
		];

		return (
			<List items={examplePatterns} onRenderCell={this.onRenderCell} ref={this.examplePatternListDomElement}></List>
		)
	}

}