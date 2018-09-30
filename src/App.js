import React, { Component } from 'react';
import { Button } from 'reactstrap';
import { HashRouter, Route, Link, NavLink } from 'react-router-dom'

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


class App extends Component {
  render() {
    return (
      <Button color="danger">Hello world!</Button>
    );
  }
}

export default App;
