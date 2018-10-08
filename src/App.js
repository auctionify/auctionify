import React, { Component, Fragment } from 'react';
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
import {getTransactionReceipt, AuctionContractor} from './contract';
import './App.css';


const FormInput = (props) => {
  let append;
  if (props.append) {
    append = (<InputGroupAddon addonType="append">{props.append}</InputGroupAddon>)
  }

  const className = `flyingLabel ${(props.showLabel || props.value)?"visible":""}`;

  let onChange = props.onChange;
  let onKeyDown = props.onKeyDown;
  let type = props.type;
  let value = props.value;

  if (type == 'eth') {
    type = 'text';
    value = window.web3.fromWei(props.value).toFixed();

    onChange = e => {
      const stringValue = e.target.value;
      if (isNaN(stringValue)) return;
      const valueWei = window.web3.toBigNumber(window.web3.toWei(stringValue));

      if (valueWei.lessThan(1) || !valueWei.isInt()) return;

      props.onChange({
        target: {
          name: props.name,
          value: valueWei,
        }
      });
    }

    onKeyDown = e => {
      let diff = 0;
      if (e.keyCode == 38) {
        diff++;
      }else if (e.keyCode == 40) {
        diff--;
      }
      if (diff == 0) return;
      const valueWei = props.value.add(diff);
      if (valueWei.lessThan(1) || !valueWei.isInt()) return;

      props.onChange({
        target: {
          name: props.name,
          value: valueWei,
        }
      });
    }
  }
    
  return (
    <InputGroup>
      <Label className={className} for={props.name}>{props.label}</Label>
      <Input autoComplete="off"
        onChange={onChange}
        onKeyDown={onKeyDown}
        value={value}
        bsSize={props.size || "lg"}
        type={type || "text"}
        name={props.name}
        id={props.name}
        placeholder={props.placeholder} >
        {props.children}
      </Input>
      {append}
    </InputGroup>
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
      <Fragment>
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
      </Fragment>
    );
  }
}
const Auctionify = () => {
  return (
    <Fragment>
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
    </Fragment>
  )
}
class CreateAuction extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accounts: [],
      title: '',
      description: '',
      minimumBid: new window.web3.toBigNumber(1),
      auctionEnd: moment().add(3, 'days'),
    };

    this.setup().then(() => console.log("setup completed"));
    this.onInputChange = this.onInputChange.bind(this);
    this.createAuction = this.createAuction.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
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
  }

  async createAuction(e) {
    e.preventDefault();
    const contractor = new AuctionContractor(window.web3, this.state.account); // window.web3 or this.state.web3
    const address = await contractor.create({
      title: this.state.title,
      auctionEnd: ""+Math.round(this.state.auctionEnd.toDate().getTime()/1000),
      beneficiary: this.state.account,
      description: this.state.description,
      minimumBid: this.state.minimumBid,
    });
    this.props.history.push(`/auction/${address}`);
  }

  render() {
    return (
      <Fragment>
        <Auctionify />
        <Form onSubmit={this.createAuction} id="auctionForm">
          <Row>
            <Col>
              <FormInput showLabel={true} name="title" label="Title" placeholder="something to sell ..." onChange={this.onInputChange} value={this.state.title} />
            </Col>
          </Row>
          <Row>
            <Col>
              <FormInput showLabel={true} name="description" label="Description" placeholder={"describe\nthe auction ..."} type="textarea" onChange={this.onInputChange} value={this.state.description} />
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
                <FormInput showLabel={true} name="minimumBid" label="Minimum Bid" placeholder="0.01" append="ETH" type="eth" onChange={this.onInputChange} value={this.state.minimumBid}/>
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
      </Fragment>
    );
  }
}


const CountDown = props => {
  if (!props.to || !props.now) return <div></div>;
  const duration = moment.duration(props.to-props.now);
  const pad = n => (""+n).padStart(2, '0');
  return (
    <div className="countdown">
      <span className="time">{pad(Math.floor(duration.asDays()))}</span>
      <span className="separater">:</span>
      <span className="time">{pad(duration.hours())}</span>
      <span className="separater">:</span>
      <span className="time">{pad(duration.minutes())}</span>
      <span className="separater">:</span>
      <span className="time">{pad(duration.seconds())}</span>
    </div>
  );
}


const HighestBid = props => {
  if (!props.bid || props.bid == 0) {
    return '';
  }
  return (
    <div className="highest-bid">
      <h3>{window.web3.fromWei(props.bid).toFixed()} ETH</h3>
      <small>highest bid</small>
    </div>
  );
}

class ShowAuction extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      loading: true,
      contract: {},
      accounts: [],
      account: null,
      now: moment(),
      description: '',
      title: '',
      highestBidder: '',
      bidAmount: new window.web3.toBigNumber(1),
      minimumBid: new window.web3.toBigNumber(1),
      highestBid: new window.web3.toBigNumber(0),
    }

    this.onInputChange = this.onInputChange.bind(this);
    this.bid = this.bid.bind(this);

    this.setup();
  }

  async setup() {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();
    const contractor = new AuctionContractor(window.web3, accounts[0]); // window.web3 or this.state.web3
    this.contract = contractor.at(this.props.match.params.address);

    const detail = {
      title: await this.contract.auctionTitleAsync(),
      description: await this.contract.auctionDescriptionAsync(),
      highestBidder: await this.contract.highestBidderAsync(),
      minimumBid: window.web3.toBigNumber(await this.contract.minimumBidAsync()),
      highestBid: window.web3.toBigNumber(await this.contract.highestBidAsync()),
    }
    console.log(detail);

    const deadline = await this.contract.auctionEndAsync();
    detail.auctionEnd = moment(deadline.toFixed()*1000);

    this.setState({
      web3,
      accounts,
      account: accounts[0],
      ...detail,
      loading: false,
      bidAmount: window.web3.BigNumber.max(detail.minimumBid, detail.highestBid.add(1)),
    });

    window.contract = this.contract;

    this.contract.HighestBidIncreased().watch((err, result) => {
      if (err) return;
      const highestBidder = result.args.bidder;
      const highestBid = result.args.amount;

      this.setState({
        highestBidder,
        highestBid,
        bidAmount: window.web3.max(this.state.bidAmount, highestBid.add(1)),
      });
    });

    setInterval(() => {
      this.setState({
        now: moment(),
      });
    }, 1000);
  }

  onInputChange({target}) {
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  bid(e) {
    e.preventDefault();
    this.contract.bid.sendTransaction({
      value: this.state.bidAmount,
    }, async (err, transactionHash) => {
      if (err) throw err;
      console.log(await getTransactionReceipt(window.web3, transactionHash));
    });
  }

  render() {
    return (
      <Fragment>
        <Row><Col>
          <h1 id="auction-title">{this.state.title}</h1>
        </Col></Row>
        <Row><Col>
          <CountDown now={this.state.now} to={this.state.auctionEnd} />
        </Col></Row>
        <Row>
          <Col className="text-center">
            <HighestBid bid={this.state.highestBid} />
          </Col>
        </Row>
        <Row><Col>
          <p id="auction-description">{this.state.description.split(/\n/).map((line, key) => {
            return <Fragment key={key}>{line}<br /></Fragment>;
          })}</p>
        </Col></Row>
        <Row><Col md={{offset: 3, size: 6}}>
          <Form onSubmit={this.bid} id="bidForm">
            <Row>
              <Col>
                <FormInput showLabel={true} name="bidAmount" label="Amount" placeholder="0.01" type="eth" append="ETH" onChange={this.onInputChange} value={this.state.bidAmount} />
              </Col>
            </Row>
            <Row>
              <Col>
                <Button id="bid" color="primary" size="lg">Bid</Button>
              </Col>
            </Row>
          </Form>
        </Col></Row>
       </Fragment>
    );
  }
}



const Underline = () => (<div className="underline"></div>);

class App extends Component {
  render() {
    return (
      <HashRouter>
        <Container id="main">
          <Route path="/" exact={true} component={withRouter(CreateAuction)}/>
          <Route path="/auction/:address" component={withRouter(ShowAuction)}/>
        </Container>
      </HashRouter>
    );
  }
}

export default App;
