import React, { Component, Fragment } from 'react';
import moment from 'moment';
import InputMoment from 'input-moment';
import LoadingOverlay from 'react-loading-overlay';
import auctionIcon from './images/auction.svg';
import ClickOutside from 'react-click-outside';
import 'input-moment/dist/input-moment.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './datepicker.scss'

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
  Badge,
  FormGroup,
} from 'reactstrap';
import { HashRouter, Route, withRouter} from 'react-router-dom'

import {getWeb3} from './web3';
import smartContract from '@auctionify/smart-contract'

import './App.scss';

window.smartContract = smartContract;
let web3,
    readOnlyWeb3,
    BigNumber,
    fromWei,
    toWei,
    accounts = [],
    WEI_STEP = '10000000000000000';

class FormInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
      invalid: false,
    }

    if (this.props.type === 'eth') {
      this.state.value = fromWei(this.state.value);
    }

    this.inputElement = null;
    this.focus = this.focus.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.handleWithError = this.handleWithError.bind(this);
  }

  setValue(val) {
    let properValue = val;

    if (this.props.type === 'eth') {
      properValue = fromWei(val);
    }

    this.setState({
      value: properValue,
    });
  }

  focus() {
    this.inputElement && this.inputElement.focus();
  }

  handleWithError(e) {
    this.setState({
      value: e.target.value,
      invalid: true,
    });

    const event = {...e};
    event.target = {...event.target, invalid: true};
    return this.props.onChange && this.props.onChange({
      target: {
        name: e.target.name,
        value: e.target.value,
        invalid: true,
      }
    });
  }

  onChange(e) {
    let invalid = false;
    let stateValue = e.target.value;

    this.setState({
      value: stateValue,
      invalid: false,
    });

    if (this.props.type !== 'eth') {
      return this.props.onChange && this.props.onChange(e);
    }

    if (isNaN(stateValue) || stateValue.trim() === '') return this.handleWithError(e);
    
    try {
      let valueWei = new BigNumber(toWei(stateValue));
      if (valueWei.lt(1)) return this.handleWithError(e);
      if (valueWei.lt(this.props.min)) return this.handleWithError(e);

      this.props.onChange && this.props.onChange({
        target: {
          name: this.props.name,
          value: valueWei,
        }
      });

    } catch(err) {
      return this.handleWithError(e);
    }
  }

  onKeyDown(e) {
    if (this.props.type === 'eth') {
      const diff = WEI_STEP.clone();
      if (e.keyCode === 38) {
        // do nothing
      }else if (e.keyCode === 40) {
        diff.negative = 1;
      }else {
        return;
      }
      let valueWei = this.props.value.add(diff);
      if (valueWei.lt(this.props.min)) valueWei = this.props.min.clone();

      this.props.onChange && this.props.onChange({
        target: {
          name: this.props.name,
          value: valueWei,
        }
      });

      this.setState({
        value: fromWei(valueWei),
        invalid: false,
      });

      return;
    }
    this.props.onKeyDown && this.props.onKeyDown(e); 
  }

  render () {
    let append;
    if (this.props.append) {
      append = (
        <InputGroupAddon onClick={this.focus} addonType="append">
          {this.props.append}
        </InputGroupAddon>
      );
    }else if (this.props.appendIcon) {
      append = (
        <InputGroupAddon onClick={this.focus} addonType="append">
          <span className="input-group-text">
            <i className={this.props.appendIcon}></i>
          </span>
        </InputGroupAddon>
      );
    }

    const labelClassName = `flyingLabel ${(this.props.showLabel || this.props.value)?"visible":""}`;

    let type = this.props.type;
    if (this.props.type === 'eth') type = 'text';

    

    return (
      <FormGroup className={`${this.state.invalid ? 'is-invalid' : ''}`}>
        <Label className={labelClassName} for={this.props.name}>{this.props.label}</Label>
        <InputGroup>
          <Input
            className="withFlyingLabel"
            autoComplete="off"
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
            value={this.state.value}
            bsSize={this.props.size || "lg"}
            type={type || "text"}
            name={this.props.name}
            id={this.props.name}
            onFocus={this.props.onFocus}
            placeholder={this.props.placeholder}
            readOnly={this.props.readOnly}
            innerRef={el => this.inputElement = el}
            >
            {this.props.children}
          </Input>
          {append}
        </InputGroup>
      </FormGroup>
    );
  }
}

class FormDatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      moment: this.props.value || moment(),
      showPicker: false,
    }

    this.inputElement = null;

    this.onChange = this.onChange.bind(this);
    this.handleSave = this.handleSave.bind(this);
    
    this.showPicker = this.showPicker.bind(this);
    this.hidePicker = this.hidePicker.bind(this);
  }

  onChange(moment) {
    if (this.props.onChange) this.props.onChange.call(null, this.state.moment);
    this.setState({ moment });
    this.inputElement.setState({
      value: this.value(),
    });
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
        <ClickOutside onClickOutside={this.handleSave}>
          <FormInput
            onChange={this.props.onChange}
            value={this.value()}
            bsSize={this.props.size}
            name={this.props.name}
            id={this.props.name}
            placeholder={this.props.placeholder}
            onFocus={this.showPicker}
            label={this.props.label}
            appendIcon="fa fa-calendar"
            readOnly
            ref={el => this.inputElement = el}
          />
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
        </ClickOutside>
      </Fragment>
    );
  }
}
const Auctionify = () => {
  return (
    <Row className="brand justify-content-center">
      <div className="text-center align-self-center mt-5">
        <Col>
          <img src={auctionIcon} alt="auction logo" />
        </Col>
        <Col xl>
          <h1>Auctionify</h1>
        </Col>
        <Col>
          <p>101</p>
        </Col>
      </div>
    </Row>
  )
}
class CreateAuction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadingText: '',
      title: '',
      description: '',
      minimumBid: WEI_STEP.clone(),
      auctionEnd: moment().add(3, 'days').startOf('day'),
    };

    this.createAuction = this.createAuction.bind(this);
  }
  
  async createAuction(data) {
    this.setState({
      loading: true,
      loadingText: 'Deploying Contract'
    });

    const contract = new web3.eth.Contract(smartContract.ABI);
    const args = [
      data.title,
      data.auctionEnd.unix().toString(),
      data.account,
      data.description,
      data.minimumBid.toString(),
      data.listed,
      data.escrowEnabled,
    ];

    console.log("Deploy contract", args);

    contract.deploy({
      data: smartContract.bytecode,
      arguments: args,
    }).send({
      from: data.account,
      gasPrice: toWei(window.gasPrice.toString(), 'Gwei'),
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
      <LoadingOverlay background="rgba(255,255,255,.8)" color="#F60" active={this.state.loading} spinner text={this.state.loadingText}>
        <Row className="m-0">
          <Col lg="5" className="accent-bg">
            <Auctionify />
          </Col>
          <Col className="py-4">
            <CreateAuctionForm onSubmit={this.createAuction} />
          </Col>
        </Row>
      </LoadingOverlay>
    );
  }
}

class CreateAuctionForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
      description: '',
      minimumBid: WEI_STEP.clone(),
      auctionEnd: moment().add(3, 'days').startOf('day'),
      account: accounts[0],
      isValid: true,
      listed: true,
      escrowEnabled: true,
      accounts,
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.createAuction = this.createAuction.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
  }

  onInputChange({target}) {
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (target.invalid) {
      this.setState({
        [name]: '-',
        isValid: false,
      });
      return;
    }

    this.setState({
      [name]: value,
      isValid: name == 'minimumBid' ? true : this.state.isValid,
    });
  }

  onDateChange(auctionEnd) {
    this.setState({ auctionEnd });
  }

  createAuction(e) {
    e.preventDefault();
    this.props.onSubmit({
      title: this.state.title,
      description: this.state.description,
      minimumBid: this.state.minimumBid,
      auctionEnd: this.state.auctionEnd,
      account: this.state.account,
      listed: this.state.listed,
      escrowEnabled: this.state.escrowEnabled,
    });
  }

  render() {
    return (
      <Fragment>
        <Container>
          <Row><Col><h3 className="title">Create an auction!</h3></Col></Row>
        </Container>
        <Form onSubmit={this.createAuction} id="auctionForm" className="container">
          <Row><Col>
            <FormInput showLabel={true} name="title" label="Title" placeholder="Auction Title" onChange={this.onInputChange} value={this.state.title} />
          </Col></Row>
           <Row><Col>
            <FormInput showLabel={true} name="description" label="Description" placeholder={"Auction Description"} type="textarea" onChange={this.onInputChange} value={this.state.description} />
          </Col></Row>
          <Row><Col>
            <FormDatePicker showLabel={true} name="auctionEnd" label="Deadline" type="date" onChange={this.onDateChange} value={this.state.auctionEnd} />
          </Col></Row>
          <Row><Col>
            <FormInput showLabel={true} min={new BigNumber('1')} name="minimumBid" label="Minimum Bid" placeholder="0.01" append="ETH" type="eth" onChange={this.onInputChange} value={this.state.minimumBid}/>
          </Col></Row>
          <Row><Col>
            <FormInput showLabel={true} name="account" label="Account" type="select" onChange={this.onInputChange} value={this.state.account}>
              {this.state.accounts.map((account, index) => <option key={index}>{account}</option>)}
            </FormInput>
          </Col></Row>
          <Row className="mt-2">
            <Col xs={6}>
              <FormGroup check>
                <Label check>
                  <Input onChange={this.onInputChange} checked={this.state.listed} name="listed" type="checkbox" />{' '}
                  Listed
                </Label>
              </FormGroup>
            </Col>
            <Col xs={6}>
              <FormGroup check>
                <Label check>
                  <Input onChange={this.onInputChange} checked={this.state.escrowEnabled} name="escrowEnabled" type="checkbox" />{' '}
                  Enable escrow
                </Label>
              </FormGroup>
            </Col>
          </Row>
          <Row className="mt-3"><Col>
            <FormGroup className="text-right">
              <Button disabled={!this.state.isValid} id="createAuctionBtn" color="primary">Create Auction</Button>
            </FormGroup>
          </Col></Row>
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

const WinningNotice = props => {
  if (props.account && props.account === props.bidder) {
    return (
      <div>
        <i className="fa fa-trophy"></i>
        You are the highest bidder!
      </div>
    );
  }
  return '';
}
class HighestBid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {
      }
    }
  }
  componentDidMount() {
    this.resize();
  }

  resize() {
    if (!this.containerEl) return;

    const ml = parseInt(getComputedStyle(this.containerEl, null).getPropertyValue('padding-left'));
    this.setState({
      style: {
        width: `${this.containerEl.offsetHeight}px`,
        top: `${this.containerEl.offsetHeight}px`,
        marginLeft: `${-ml}px`,
      }
    })
  }

  render() {
    const props = this.props;

    if (!props.bid || props.bid.isZero()) {
      return '';
    }

    let youVisible = false;
    if (props.account && props.account === props.bidder) {
      youVisible = true;
    }

    return (
      <Col
        sm={{size: 8, offset: 2}}
        md={{size: 6, offset: 3}}
        lg={{size: 4, offset: 4}}
      >
        <div className="highest-bid container" ref={el => this.containerEl = el}>
          <div className="hb-label" style={this.state.style} ref={el => this.boxLabelEl = el}>
            <i className="fa fa-trophy"></i> &nbsp;Highest Bid
          </div>
          <Row className="pl-4">
            <Col>
              <h3>{fromWei(props.bid).toString()} ETH</h3>
              <div className="bidder">
                <span className="address">{props.bidder.substr(0, 14)}</span>
                <Badge color="dark" className={`you ${youVisible ? 'visible' : 'hidden'}`}>
                  <i className="fa fa-star"></i> You
                </Badge>
              </div>
            </Col>
          </Row>
        </div>
      </Col>
    );
  }
}

class ShowAuction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loadingText: 'loading auction',
    }

    this.bid = this.bid.bind(this);
  }

  async componentDidMount() {
    const contract = new readOnlyWeb3.eth.Contract(smartContract.ABI, this.props.match.params.address);
    window.contract = contract;

    const auction = {
      account: accounts[0],
      title: await contract.methods.auctionTitle().call(),
      description: await contract.methods.auctionDescription().call(),
      highestBidder: await contract.methods.highestBidder().call(),
      minimumBid: new BigNumber(await contract.methods.minimumBid().call()),
      highestBid: new BigNumber(await contract.methods.highestBid().call()),
    }

    const deadline = await contract.methods.auctionEnd().call();
    auction.auctionEnd = moment(deadline*1000);

    this.setState({
      auction,
      loading: false,
    });

    contract.events.HighestBidIncreased().on('data', ({returnValues}) => {
      const highestBidder = returnValues.bidder;
      const highestBid = new BigNumber(returnValues.amount);

      this.setState({
        auction: {
          ...this.state.auction,
          highestBidder,
          highestBid,
        }
      });
    });
  }

  async bid({bidAmount}) {
    const contract = new web3.eth.Contract(smartContract.ABI, this.props.match.params.address);

    this.setState({
      loading: true,
      loadingText: 'Sending Transaction',
    });

    try {
      const transaction = contract.methods.bid();
      await transaction.send({
        from: this.state.auction.account,
        value: bidAmount,
        gasPrice: toWei(window.gasPrice.toString(), 'Gwei'),
      }).on('transactionHash', hash => {
        this.setState({
          loadingText: `Confirming ${hash.substr(0, 10)}`,
        });
      }).on('error', err => {
        this.setState({
          loading: false
        });
      });

      this.setState({
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false
      });
    }
  }

  render() {
    let auction = (<div className="accent-bg auction-placeholder"><span></span></div>);
    if (this.state.auction) {
      auction = (<Auction auction={this.state.auction} onBid={this.bid} />);
    }
    return (
      <LoadingOverlay background="rgba(255,255,255,.7)" color="#F60" active={this.state.loading} spinner text={this.state.loadingText}>
        {auction}
      </LoadingOverlay>
    );
  }
}

class Auction extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      now: moment(),
      bidAmount: BigNumber.max(this.props.auction.minimumBid, this.props.auction.highestBid.add(WEI_STEP)),
    }

    this.onInputChange = this.onInputChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  onInputChange({target}) {
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  componentDidMount() {
    this.intervalId = setInterval(() => {
      this.setState({
        now: moment(),
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  minimumAcceptableBid() {
    return BigNumber.max(this.props.auction.minimumBid, this.props.auction.highestBid.add(new BigNumber('1')))
  }

  submit(e) {
    e.preventDefault();
    this.props.onBid({
      bidAmount: this.state.bidAmount,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.auction.highestBid === prevProps.auction.highestBid) return;
    const bidAmount = BigNumber.max(this.state.bidAmount, this.props.auction.highestBid.add(WEI_STEP));
    this.setState({
      bidAmount,
    });
    this.ethInput.setValue(bidAmount);
  }

  render() {
    const {auction} = this.props;
    if (!auction) {
      return '';
    }

    let highestBidComponent = '';

    if (!auction.highestBid.isZero()) {
      highestBidComponent = (
        <HighestBid bid={auction.highestBid} bidder={auction.highestBidder} account={auction.account} />
      )
    }

    return (
      <Row className="m-0">
        <Col lg="12" className="accent-bg auction-header container">
          <Row>
            <Col>
              <h1 id="auction-title">{auction.title}</h1>
            </Col>
          </Row>
          <Row>
            {highestBidComponent}
          </Row>
          <Row>
            <Col className="text-center p-0">
              <CountDown now={this.state.now} to={auction.auctionEnd} />
            </Col>
          </Row>
        </Col>
        <Col className="py-4">
          <Container>
            <Row><Col>
              <p id="auction-description">{auction.description.split(/\n/).map((line, key) => {
                return <Fragment key={key}>{line}<br /></Fragment>;
              })}</p>
            </Col></Row>
            <Row className="bid-container">
              <Col
                sm={{size: 8, offset: 2}}
                md={{size: 6, offset: 3}}
                lg={{size: 4, offset: 4}} >
                <Form onSubmit={this.bid} id="bidForm">
                  <Row>
                    <Col>
                      <FormInput showLabel={true}
                        name="bidAmount"
                        min={this.minimumAcceptableBid()}
                        label="Amount"
                        placeholder="0.01"
                        type="eth"
                        append="ETH"
                        onChange={this.onInputChange}
                        value={this.state.bidAmount}
                        ref={el => this.ethInput = el}
                      />
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col sm={{size: 4, order:2}} className="text-right">
                      <Button id="bid" block color="primary" onClick={this.submit}>Bid</Button>
                    </Col>
                    <Col order={1} className="text-center text-sm-left mt-2 winner-notice">
                       <WinningNotice bidder={auction.highestBidder} account={auction.account} />
                    </Col>
                  </Row>
                </Form>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    );
  }
}

const Footer = () => {
  return (
    <Container className="footer">
      <Row noGutters>
        <Col className="text-center text-lg-right">
          <a href="https://github.com/auctionify/auctionify"><i className="fa fa-github"></i> Auctionify </a>
           | Made with <i className="fa fa-heart"></i> in Montréal
        </Col>
      </Row>
    </Container>
  );
}

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

    const response = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
    const gasPrices = await response.json();

    window.gasPrice = gasPrices.safeLowWait;

    console.log(gasPrices);
    
    this.setState({
      loaded: true,
    });
  }

  render() {
    let content = (<div></div>);
    if (this.state.loaded) {
      content = (
        <Container className="main-container">
          <Container className="main">
            <Route path="/" exact={true} component={withRouter(CreateAuction)} />
            <Route path="/auction/:address" component={withRouter(ShowAuction)} />
            <Footer />
          </Container>
        </Container>
      );
    }
    return (
      <HashRouter>{content}</HashRouter>
    );
  }
}

export default App;
