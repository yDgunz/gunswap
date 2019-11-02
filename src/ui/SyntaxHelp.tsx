import React, { Component } from 'react';
import { DefaultButton, IconButton } from 'office-ui-fabric-react';

export interface Props {
	closeSyntaxHelp: Function
}

export class SyntaxHelp extends Component<Props,any> {

	constructor(props : Props) {
		super(props);

		this.close = this.close.bind(this);
	}

	private close() {
		this.props.closeSyntaxHelp();
	}

	examplePatternSettings = (
		<div className="example-pattern-settings">
			<code>
				siteswap: 3 <br/>
				beatDuration: 0.28 <br/>
				dwellPath: (30)(10) <br/>
				dwellRatio: 0.8
			</code>
		</div>
	);

	syntaxExplanation = (
<div>
<p>Patterns can be defined using a YAML based configuration input. All parameters are optional. The example below demonstrates a complete configuration using all the defaults.</p>
<p>
<code>siteswap</code> - siteswap string. Supports standard vanilla like <code>531</code>, multiplex like <code>33[33]</code>, and synchronous like <code>(4,6x)(6x,4)</code>. 2's are held by default, make them active by using "2A" like <code>42A3</code>. Passing patterns wrap each beat in &lt;&gt; with each juggler pipe delimited, so <code>&lt;3|3&gt;</code> is two jugglers both running 3 ball cascade. Use P to indicate a pass, so<code>&lt;3P|3P&gt;</code> is a pass on every throw. For multiple jugglers include the index of the juggler who is the target of the pass (starting at 1), so <code>&lt;3P3|3|3P1&gt;</code> is two jugglers passing while a third runs 3 ball cascade. You can also use a shorthand for expressing passing patterns like this: <code>&lt;3P333|3P333&gt;</code>, which would be the equivalent of <code>&lt;3P|3P&gt;&lt;3|3&gt;&lt;3|3&gt;&lt;3|3&gt;</code>. <i>If you input a passing siteswap you need to specify all the juggler positions and rotations, see "Juggler Positions" below</i>. Modify the number of spins with S, so <code>3S{0}3S{2}</code> is alternating flats and doubles. You can optionally specify the club toss orientation by adding the x,y,z components of the vector representing the direction the club handle is pointing in the right hand. So <code>{'3S{2,.1,.1,1}'}</code> is a toss that does 2 full rotations and is pointing slightly down and slighly inwards. Modify the dwell ratio with D, so <code>3D{.2}3D{.8}</code> is a 3 ball pattern where one hand is rushing the throw (good for animating half shower patterns). Modify the catch and throw by using C and T, respectively, so <code>{'3C{P}T\{C}'}</code> is penguin (P) catches followed by claw (C) throws. Bounce using B and optionally specify the bounce type. If no bounce type is specified then a bounce type that will work within the timing constraints of the pattern will be selected. So <code>5B</code> is a 5 ball lift bounce and <code>{'5B{HL}'}</code> is a 5 ball hyperlift bounce (ie. the ball is traveling down when it is caught). Options are L for lift, HL for hyperlift, F for force, and HF for hyperforce. You can also specify the number of bounces within the braces, so {'5B{2}'} would be a 5 ball pattern with 2 bounces. {'5B{HL2}'} is also a valid 2 bounce pattern. You can use the standard * notation to repeat patterns symmetrically, so <code>(4,2x)*</code> would be the equivalent of <code>(4,2x)(2x,4).</code> Patterns can contain any amount of whitespace between beats, so <code>5 3  1</code> would be the same as <code>531</code>.   
</p>

</div>
);

	render() {
		return (
			<div className="ms-Grid" dir="ltr">
				<div className="ms-Grid-row">
					<div className="ms-Grid-col ms-md10">
						<h1>Syntax Help</h1>
					</div>
					<div className="ms-Grid-col ms-md2">
						<IconButton className="close-button" iconProps={{iconName: "ChromeClose"}} onClick={this.close} />
					</div>
				</div>	
				<div className="ms-Grid-row">
					<div className="ms-Grid-col ms-md9">
						{this.syntaxExplanation}						
					</div>
					<div className="ms-Grid-col ms-md3">
						{this.examplePatternSettings}
					</div>
				</div>											
			</div>
		)
	}

}