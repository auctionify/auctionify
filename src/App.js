import React, { Component } from 'react';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormText,
  Col,
  InputGroupAddon,
  InputGroup,
} from 'reactstrap';
import { HashRouter, Route, Link, NavLink, withRouter} from 'react-router-dom'
import DatePicker from 'react-datepicker';

import {getWeb3} from './web3';
import AuctionContractor from './contract';
import './App.css';


const FormInput = (props) => {
  let append;
  if (props.append) {
    append = (<InputGroupAddon addonType="append">{props.append}</InputGroupAddon>)
  }

  return (
    <FormGroup row>
      <Label for={props.name} sm={2}>{props.label}</Label>
      <Col sm={10}>
        <InputGroup>
          <Input onChange={props.onChange} value={props.value} bsSize={props.size || "lg"} type={props.type || "text"} name={props.name} id={props.name} placeholder={props.placeholder}>
            {props.children}
          </Input>
          {append}
        </InputGroup>
      </Col>
    </FormGroup>
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

const FormDatePicker = props => {
  return (
    <FormGroup row>
      <Label for={props.name} sm={2}>{props.label}</Label>
      <Col sm={10}>
        <InputGroup className="datepicker-parent">
          <DatePicker
            selected={props.value}
            onChange={props.onChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="LLL"
            timeCaption="time"
            className="form-control-lg form-control datepicker"
            minDate={moment().add(1, 'hours')}
          />
        </InputGroup>
      </Col>
    </FormGroup>
  );
}

class CreateAuction extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accounts: [],
      title: '',
      description: '',
      minimumBid: '',
      auctionEnd: moment().add(1, 'days'),
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
    // const contractor = new AuctionContractor(window.web3, accounts[0]);
    // const contract = contractor.at('0x597ade7923ecc17626d38fe11313c77a20ab9acb')
    
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
      auctionEnd: ""+Math.round(new Date().getTime()/1000+1000000),
      beneficiary: this.state.account,
      description: this.state.description,
      minimumBid: '10000000000',
      // minimumBid: this.state.minimumBid,
    });
    this.props.history.push(`/auction/${address}`);
  }

  render() {
    return (
      <Form onSubmit={this.createAuction}>
        <FormInput name="title" label="Title" placeholder="My kidney" onChange={this.onInputChange} value={this.state.title} />
        <FormInput name="description" label="Description" placeholder="Used for 28 years" onChange={this.onInputChange} value={this.state.description} />
        <FormDescription>{this.timeToAuctionEnd()}</FormDescription>
        <FormDatePicker name="auctionEnd" label="Date" placeholder="28 years" type="date" onChange={this.onDateChange} value={this.state.auctionEnd} />
        <FormInput name="minimumBid" label="Minimum Bid" placeholder="0.01" type="number" append="ETH" onChange={this.onInputChange} value={this.state.minimumBid} />
        <FormInput name="account" label="Account" type="select" onChange={this.onInputChange} value={this.state.account}>
          {this.state.accounts.map((account, index) => <option key={index}>{account}</option>)}
        </FormInput>
        <Button className="submit" color="primary" size="lg">Create</Button>
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


class App extends Component {
  render() {
    return (
      <HashRouter>
        <Container>
          <h1 className="brand-title">Auctionify</h1>
          <Route path="/" exact={true} component={withRouter(CreateAuction)}/>
          <Route path="/auction/:address" component={withRouter(ShowAuction)}/>
        </Container>
      </HashRouter>
    );
  }
}

export default App;
