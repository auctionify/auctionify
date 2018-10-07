import React, { Component } from 'react';
import moment from 'moment';
import InputMoment from 'input-moment';
import 'input-moment/dist/input-moment.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './datepicker.css'

import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormText,
  Col,
  Row,
  InputGroupAddon,
  InputGroup,
} from 'reactstrap';
import { HashRouter, Route, Link, NavLink, withRouter} from 'react-router-dom'

import {getWeb3} from './web3';
import AuctionContractor from './contract';
import './App.css';


const FormInput = (props) => {
  let append;
  if (props.append) {
    append = (<InputGroupAddon addonType="append">{props.append}</InputGroupAddon>)
  }

  const className = `flyingLabel ${(props.showLabel || props.value)?"visible":""}`;

    
  return (
    <InputGroup>
      <Label className={className} for={props.name}>{props.label}</Label>
      <Input autoComplete="off" min={props.min} max={props.max} step={props.step} onChange={props.onChange} value={props.value} bsSize={props.size || "lg"} type={props.type || "text"} name={props.name} id={props.name} placeholder={props.placeholder}>
        {props.children}
      </Input>
      {append}
    </InputGroup>
  );
}

const FormDescription = (props) => {
  return (
    <FormGroup row>
      <Label for={props.name} sm={2}></Label>
      <Col sm={10}>
        <InputGroup>
            {props.children}
        </InputGroup>
      </Col>
    </FormGroup>
  );
}

class FormDatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      moment: this.props.value || moment(),
      showPicker: false,
    }

    this.onChange = this.onChange.bind(this);
    this.handleSave = this.handleSave.bind(this);
    
    this.showPicker = this.showPicker.bind(this);
    this.hidePicker = this.hidePicker.bind(this);
  }

  onChange(moment) {
    if (this.props.onChange) this.props.onChange.call(null, this.state.moment);
    this.setState({ moment });
  };

  handleSave() {
    this.setState({
      showPicker: false,
    });
  };

  showPicker(e) {
    this.setState({
      showPicker: true,
    });
  }

  hidePicker(e) {
    this.setState({
      showPicker: false,
    });
  }

  value() {
    return this.state.moment.format('lll');
  }

  render() {
    return (
      <React.Fragment>
        <InputGroup>
          <Label className="flyingLabel visible" for={this.props.name}>{this.props.label}</Label>
          <Input
            autoComplete="off"
            onChange={this.props.onChange}
            value={this.value()}
            bsSize={this.props.size || "lg"}
            type="text"
            name={this.props.name}
            id={this.props.name}
            placeholder={this.props.placeholder}
            onFocus={this.showPicker}
          />
          <InputGroupAddon addonType="append"><span className="input-group-text"><i className="fa fa-calendar"></i></span></InputGroupAddon>
        </InputGroup>
        <div id="date-picker-container">
          <InputMoment
            moment={this.state.moment}
            onChange={this.onChange}
            minStep={5}
            onSave={this.handleSave}
            id="datepicker"
            className={this.state.showPicker?'visible':''}
            prevMonthIcon="fa fa-angle-double-left"
            nextMonthIcon="fa fa-angle-double-right"
          />
        </div>
      </React.Fragment>
    );
  }
}

class CreateAuction extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accounts: [],
      title: '',
      description: '',
      minimumBid: 0.000001,
      auctionEnd: moment().add(3, 'days'),
    };

    this.setup().then(() => console.log("setup completed"));
    this.onInputChange = this.onInputChange.bind(this);
    this.createAuction = this.createAuction.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
    this.timeToAuctionEnd = this.timeToAuctionEnd.bind(this);
  }

  onInputChange({target}) {
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  onDateChange(date) {
    console.log(date.format('llll'));
    this.setState({
      auctionEnd: date
    });
  }

  async setup() {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();
    this.setState({
      web3,
      accounts,
      account: accounts[0],
    });
    // contract.HighestBidIncreased().watch((err, result) => {
    //   console.log(err, result)
    // });

    // contract.bid.sendTransaction({
    //   value: window.web3.toWei(2, 'ether')
    // }, console.log)

  }

  timeToAuctionEnd() {
    return this.state.auctionEnd.fromNow();
  }

  async createAuction(e) {
    e.preventDefault();
    const contractor = new AuctionContractor(window.web3, this.state.account); // window.web3 or this.state.web3
    const address = await contractor.create({
      title: this.state.title,
      auctionEnd: ""+Math.round(this.state.auctionEnd.toDate().getTime()/1000),
      beneficiary: this.state.account,
      description: this.state.description,
      minimumBid: '10000000000',
      // minimumBid: this.state.minimumBid,
    });
    this.props.history.push(`/auction/${address}`);
  }
        // <FormDescription>{this.timeToAuctionEnd()}</FormDescription>

  render() {
    return (
      <Form onSubmit={this.createAuction} id="auctionForm">
        <Row>
          <Col>
            <FormInput name="title" label="Title" placeholder="Auction Title" onChange={this.onInputChange} value={this.state.title} />
          </Col>
        </Row>
        <Row>
          <Col>
            <FormInput name="description" label="Description" placeholder="Auction Description" onChange={this.onInputChange} value={this.state.description} />
          </Col>
        </Row>
        <Row>
          <Col md>
            <Row><Col>
              <FormDatePicker showLabel={true} name="auctionEnd" label="Deadline" type="date" onChange={this.onDateChange} value={this.state.auctionEnd} />
            </Col></Row>
          </Col>
          <Col md>
            <Row><Col>
              <FormInput min={0} step={0.000001} showLabel={true} name="minimumBid" label="Minimum Bid" placeholder="0.01" type="number" append="ETH" onChange={this.onInputChange} value={this.state.minimumBid} />
            </Col></Row>
          </Col>
        </Row>
        <Row>
          <Col>
            <FormInput showLabel={true} name="account" label="Account" type="select" onChange={this.onInputChange} value={this.state.account}>
              {this.state.accounts.map((account, index) => <option key={index}>{account}</option>)}
            </FormInput>
          </Col>
        </Row>
        <Row>
          <Col>
            <Button id="createAuction" color="primary" size="lg">Create</Button>
          </Col>
        </Row>
      </Form>
    );
  }
}

class ShowAuction extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      contract: {},
      accounts: [],
      account: null,
    }

    this.setup();
  }

  async setup() {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();
    const contractor = new AuctionContractor(window.web3, accounts[0]); // window.web3 or this.state.web3
    this.contract = contractor.at(this.props.match.params.address)
    this.setState({
      web3,
      accounts,
      account: accounts[0],
      contract: {
        title: await this.contract.auctionTitleAsync(),
        description: await this.contract.auctionDescriptionAsync(),
      }
    });
  }

  render() {
    return (
      <div>
        <h1>{this.state.contract.title}</h1>
        <p>{this.state.contract.description}</p>
        <div>{this.props.match.params.address}</div>
      </div>
    );
  }
}

const Underline = () => (<div className="underline"></div>);

class App extends Component {
  render() {
    return (
      <HashRouter>
        <Container id="main">
          <Row>
            <Col>
              <h1 className="brand-title">&bull; Auctionify &bull;</h1>
            </Col>
          </Row>
          <Row>
            <Col>
              <Underline />
            </Col>
          </Row>
          <Route path="/" exact={true} component={withRouter(CreateAuction)}/>
          <Route path="/auction/:address" component={withRouter(ShowAuction)}/>
        </Container>
      </HashRouter>
    );
  }
}

export default App;
