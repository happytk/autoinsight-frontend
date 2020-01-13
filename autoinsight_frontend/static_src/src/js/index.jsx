import React from 'react';
import ReactDOM from 'react-dom';
import { RestfulProvider } from 'restful-react';
import AutoinsightDeployer from './components/AutoinsightDeployer.jsx';

const MyRestfulApp = () => (
  <RestfulProvider base="/">
    <AutoinsightDeployer />
  </RestfulProvider>
);

const initDeployerApp = (node) => {
  ReactDOM.render((
    <MyRestfulApp />
  ), node);
};

window.initDeployerApp = initDeployerApp;
