import React from 'react';
import './App.css';
import Animator from './ui/Animator';
import { initializeIcons } from '@uifabric/icons';
initializeIcons();

const App: React.FC = () => {
  	return (
		<Animator></Animator>	
  	);
}

export default App;
