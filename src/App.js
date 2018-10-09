import React, { Component, Fragment } from 'react';
import moment from 'moment';
import InputMoment from 'input-moment';
import LoadingOverlay from 'react-loading-overlay';

import 'input-moment/dist/input-moment.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './datepicker.css'

import {
  Container,
  Button,
  Form,
  Label,
  Input,
  Col,
  Row,
  InputGroupAddon,
  InputGroup,
} from 'reactstrap';
import { HashRouter, Route, withRouter} from 'react-router-dom'

import {getWeb3} from './web3';
import smartContract from './contract';

import './App.css';


let web3;
let readOnlyWeb3;
let BigNumber;
let fromWei;
let toWei;
let accounts = [];
let WEI_STEP = '100000000000';

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

  let step = props.step || WEI_STEP;
  let min = props.min || 0;

  if (type === 'eth') {
    type = 'text';
    value = fromWei(props.value);

    onChange = e => {
      const stringValue = e.target.value;
      if (isNaN(stringValue)) return;
      const valueWei = new BigNumber(toWei(stringValue));

      if (valueWei.lt(1)) return;
      if (valueWei.lt(min)) return;
      props.onChange({
        target: {
          name: props.name,
          value: valueWei,
        }
      });
    }

    onKeyDown = e => {
      const diff = step.clone();
      if (e.keyCode === 38) {
        // do nothing
      }else if (e.keyCode === 40) {
        diff.negative = 1;
      }else {
        return;
      }
      const valueWei = props.value.add(diff);
      if (valueWei.lt(1)) return;
      if (valueWei.lt(min)) return;

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
          <small id="version">v0.0.2</small>
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
      loading: false,
      loadingText: '',
      accounts: [],
      title: '',
      description: '',
      minimumBid: WEI_STEP.clone(),
      auctionEnd: moment().add(3, 'days').startOf('day'),
    };

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

  onDateChange(auctionEnd) {
    this.setState({ auctionEnd });
  }

  async componentDidMount() {
    this.setState({
      web3,
      accounts,
      account: accounts[0],
    });
  }

  async createAuction(e) {
    e.preventDefault();
    
    this.setState({
      loading: true,
      loadingText: 'Deploying Contract'
    });

    const contract = new web3.eth.Contract(smartContract.ABI);
    const args = [
      this.state.title,
      this.state.auctionEnd.unix().toString(),
      this.state.account,
      this.state.description,
      this.state.minimumBid.toString(),
    ];
    console.log("Deploy contract", args);

    contract.deploy({
      data: smartContract.DATA,
      arguments: args,
    }).send({
      from: this.state.account,
      gas: 3000000,
    }).on('error', err => {
      console.log(err);
      this.setState({
        loading: false,
      });
    }).on('transactionHash', transactionHash => {
      this.setState({
        loadingText: `Confirming ${transactionHash.substr(0, 10)}`,
      });
    }).on('receipt', receipt => {
      this.setState({
        loadingText: 'Confirmed!'
      });
      setTimeout(() => {
        this.setState({
          loading: false,
        });
        this.props.history.push(`/auction/${receipt.contractAddress}`);
      }, 2000);
    })
  }

  render() {
    return (
      <LoadingOverlay
        active={this.state.loading}
        spinner
        text={this.state.loadingText}
      >
        <div id="content">
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
                  <FormInput showLabel={true} min={WEI_STEP} name="minimumBid" label="Minimum Bid" placeholder="0.01" append="ETH" type="eth" onChange={this.onInputChange} value={this.state.minimumBid}/>
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
        </div>
      </LoadingOverlay>
    );
  }
}


const CountDown = props => {
  if (!props.to || !props.now) return <div></div>;
  const duration = moment.duration(props.to-props.now);
  const pad = n => (""+n).padStart(2, '0');
  return (
    <div className="countdown">
      <div className="section">
        <span className="time">{pad(Math.floor(duration.asDays()))}</span><br />
        <span className="label">days</span>
      </div>

      <div className="section"><span className="separater">:</span><br />&nbsp;</div>
      
      <div className="section">
        <span className="time">{pad(duration.hours())}</span><br />
        <span className="label">hours</span>
      </div>

      <div className="section"><span className="separater">:</span><br />&nbsp;</div>
      
      <div className="section">
        <span className="time">{pad(duration.minutes())}</span><br />
        <span className="label">minutes</span>
      </div>

      <div className="section"><span className="separater">:</span><br />&nbsp;</div>
      
      <div className="section">
        <span className="time">{pad(duration.seconds())}</span><br />
        <span className="label">seconds</span>
      </div>
    </div>
  );
}


const HighestBid = props => {
  if (!props.bid || props.bid.isZero()) {
    return '';
  }
  return (
    <div className="highest-bid">
      <h3>{fromWei(props.bid).toString()} ETH</h3>
      <span>{props.bidder.substr(0, 10)}</span>
      <small>highest bid</small>
    </div>
  );
}

class ShowAuction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loadingText: 'loading auction',
      contract: {},
      account: null,
      now: moment(),
      description: '',
      title: '',
      highestBidder: '',
      bidAmount: new BigNumber(1),
      minimumBid: new BigNumber(1),
      highestBid: new BigNumber(0),
    }

    this.onInputChange = this.onInputChange.bind(this);
    this.bid = this.bid.bind(this);

  }

  async componentDidMount() {
    this.contract = new readOnlyWeb3.eth.Contract(smartContract.ABI, this.props.match.params.address);
    window.contract = this.contract;

    const detail = {
      title: await this.contract.methods.auctionTitle().call(),
      description: await this.contract.methods.auctionDescription().call(),
      highestBidder: await this.contract.methods.highestBidder().call(),
      minimumBid: new BigNumber(await this.contract.methods.minimumBid().call()),
      highestBid: new BigNumber(await this.contract.methods.highestBid().call()),
    }

    const deadline = await this.contract.methods.auctionEnd().call();
    detail.auctionEnd = moment(deadline*1000);

    this.setState({
      web3,
      account: accounts[0],
      ...detail,
      loading: false,
      bidAmount: BigNumber.max(detail.minimumBid, detail.highestBid.add(WEI_STEP)),
    });


    this.contract.events.HighestBidIncreased().on('data', ({returnValues}) => {
      const highestBidder = returnValues.bidder;
      const highestBid = new BigNumber(returnValues.amount);
      this.setState({
        highestBidder,
        highestBid,
        bidAmount: BigNumber.max(this.state.bidAmount, highestBid.add(WEI_STEP)),
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

  async bid(e) {
    const contract = new web3.eth.Contract(smartContract.ABI, this.props.match.params.address);

    e.preventDefault();
    this.setState({
      loading: true,
      loadingText: 'Sending Transaction',
    });
    let {transactionHash} = await contract.methods.bid().send({
      from: this.state.account,
      value: this.state.bidAmount,
    }).on('transactionHash', hash => {
      this.setState({
        loadingText: `Confirming ${hash.substr(0, 10)}`,
      });
    });

    this.setState({
      loading: false
    });
  }

  minimumAcceptableBid() {
    return BigNumber.max(this.state.minimumBid, this.state.highestBid.add(WEI_STEP))
  }

  render() {
    return (
      <LoadingOverlay
        active={this.state.loading}
        spinner
        text={this.state.loadingText}
      >
        <div id="content">
          <Row><Col>
            <h1 id="auction-title">{this.state.title}</h1>
          </Col></Row>
          <Row><Col>
            <CountDown now={this.state.now} to={this.state.auctionEnd} />
          </Col></Row>
          <Row>
            <Col className="text-center">
              <HighestBid bid={this.state.highestBid} bidder={this.state.highestBidder} />
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
                  <FormInput showLabel={true} name="bidAmount" min={this.minimumAcceptableBid()} label="Amount" placeholder="0.01" type="eth" append="ETH" onChange={this.onInputChange} value={this.state.bidAmount} />
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button id="bid" color="primary" size="lg">Bid</Button>
                </Col>
              </Row>
            </Form>
          </Col></Row>
        </div>
      </LoadingOverlay>
    );
  }
}



const Underline = () => (<div className="underline"></div>);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };

    this.setup().then(() => console.log("Setup complete!"));
  }

  async setup() {
    const web3s = await getWeb3();

    web3 = web3s.web3;
    readOnlyWeb3 = web3s.readOnlyWeb3;

    BigNumber = readOnlyWeb3.utils.BN;
    toWei = readOnlyWeb3.utils.toWei;
    fromWei = readOnlyWeb3.utils.fromWei;

    if (web3) {
      accounts = await web3.eth.getAccounts();
    }

    window.web3 = web3;
    window.readOnlyWeb3 = readOnlyWeb3;
    window.BigNumber = BigNumber;

    WEI_STEP = new BigNumber(WEI_STEP);

    this.setState({
      loaded: true,
    });
  }

  render() {
    let content = (<div></div>);
    if (this.state.loaded) {
      content = (
        <Container id="main">
          <Route path="/" exact={true} component={withRouter(CreateAuction)} />
          <Route path="/auction/:address" component={withRouter(ShowAuction)} />
        </Container>
      );
    }
    return (
      <HashRouter>{content}</HashRouter>
    );
  }
}

export default App;
