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
import smartContract from './contract';

import './App.scss';

let web3,
    readOnlyWeb3,
    BigNumber,
    fromWei,
    toWei,
    accounts = [],
    WEI_STEP = '100000000000';

const FormInput = (props) => {
  let inputElement;
  const focus = () => {
    inputElement && inputElement.focus();
  }
  let append;
  if (props.append) {
    append = (
      <InputGroupAddon onClick={focus} addonType="append">
        {props.append}
      </InputGroupAddon>
    );
  }else if (props.appendIcon) {
    append = (
      <InputGroupAddon onClick={focus} addonType="append">
        <span className="input-group-text">
          <i className={props.appendIcon}></i>
        </span>
      </InputGroupAddon>
    );
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
    <FormGroup>
      <Label className={className} for={props.name}>{props.label}</Label>
      <InputGroup>
        <Input
          className="withFlyingLabel"
          autoComplete="off"
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={value}
          bsSize={props.size || "lg"}
          type={type || "text"}
          name={props.name}
          id={props.name}
          onFocus={props.onFocus}
          placeholder={props.placeholder}
          innerRef={el => inputElement = el}
          >
          {props.children}
        </Input>
        {append}
      </InputGroup>
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
          <p>001</p>
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
    ];
    console.log("Deploy contract", args);

    contract.deploy({
      data: smartContract.DATA,
      arguments: args,
    }).send({
      from: data.account,
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
      accounts,
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

  createAuction(e) {
    e.preventDefault();
    this.props.onSubmit({
      title: this.state.title,
      description: this.state.description,
      minimumBid: this.state.minimumBid,
      auctionEnd: this.state.auctionEnd,
      account: this.state.account,
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
            <FormInput showLabel={true} min={WEI_STEP} name="minimumBid" label="Minimum Bid" placeholder="0.01" append="ETH" type="eth" onChange={this.onInputChange} value={this.state.minimumBid}/>
          </Col></Row>
          <Row><Col>
            <FormInput showLabel={true} name="account" label="Account" type="select" onChange={this.onInputChange} value={this.state.account}>
              {this.state.accounts.map((account, index) => <option key={index}>{account}</option>)}
            </FormInput>
          </Col></Row>
          <Row><Col>
            <FormGroup className="text-right">
              <Button id="createAuctionBtn" color="primary">Create Auction</Button>
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

      await contract.methods.bid().send({
        from: this.state.auction.account,
        value: bidAmount,
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
      bidAmount: this.minimumAcceptableBid(),
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
    return BigNumber.max(this.props.auction.minimumBid, this.props.auction.highestBid.add(WEI_STEP))
  }

  submit(e) {
    e.preventDefault();
    this.props.onBid({
      bidAmount: this.state.bidAmount,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.auction.highestBid === prevProps.auction.highestBid) return;
    console.log(this.state.bidAmount, this.props.auction.highestBid);
    console.log(this.state.bidAmount.toString(), this.props.auction.highestBid.add(WEI_STEP).toString());
    this.setState({
      bidAmount: BigNumber.max(this.state.bidAmount, this.props.auction.highestBid.add(WEI_STEP)),
    });
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
                      <FormInput showLabel={true} name="bidAmount" min={this.minimumAcceptableBid()} label="Amount" placeholder="0.01" type="eth" append="ETH" onChange={this.onInputChange} value={this.state.bidAmount} />
                    </Col>
                  </Row>
                  <Row>
                    <Col className="text-right">
                      <Button id="bid" color="primary" onClick={this.submit}>Bid</Button>
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
