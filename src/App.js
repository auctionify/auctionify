import React, { Component, Fragment } from 'react';
import moment from 'moment';
import InputMoment from 'input-moment';
import LoadingOverlay from 'react-loading-overlay';
import auctionIcon from './images/auctionify.png';
import ClickOutside from 'react-click-outside';
import ReactMarkdown from 'react-markdown';
import {beep} from './beep';
import 'input-moment/dist/input-moment.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './datepicker.scss';

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
  ListGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';

import { HashRouter, Route, withRouter, Link} from 'react-router-dom';

import {getWeb3} from './web3';
import smartContract from '@auctionify/smart-contract';

import './App.scss';

window.smartContract = smartContract;
let web3,
  readOnlyWeb3,
  network,
  BigNumber,
  fromWei,
  toWei,
  accounts = [],
  WEI_STEP = '10000000000000000';

let windowInFocus = true;

class AuctionStorage {
  static add (item) {
    const all = this.all();
    all.push(item);
    window.localStorage.setItem('faves', JSON.stringify(all));
  }

  static all () {
    return JSON.parse(window.localStorage.getItem('faves') || '[]');
  }

  static remove (fn) {
    const all = this.all();
    window.localStorage.setItem('faves', JSON.stringify(all.filter(i => !fn(i))));
  }

  static replace (fn, item) {
    let all = this.all();
    let index = all.findIndex(fn);
    if (index === -1) return false;
    all[index] = item;
    window.localStorage.setItem('faves', JSON.stringify(all));
    return true;
  }

  static exists (fn) {
    return this.all().some(fn);
  }
}

class FormInput extends Component {
  constructor (props) {
    super(props);

    this.state = {
      value: props.value,
      invalid: false
    };

    if (this.props.type === 'eth') {
      this.state.value = fromWei(this.state.value);
    }

    this.inputElement = null;
    this.focus = this.focus.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.handleWithError = this.handleWithError.bind(this);
  }

  setValue (val) {
    let properValue = val;

    if (this.props.type === 'eth') {
      properValue = fromWei(val);
    }

    this.setState({
      value: properValue
    });
  }

  focus () {
    this.inputElement && this.inputElement.focus();
  }

  handleWithError (e) {
    this.setState({
      value: e.target.value,
      invalid: true
    });

    const event = {...e};
    event.target = {...event.target, invalid: true};
    return this.props.onChange && this.props.onChange({
      target: {
        name: e.target.name,
        value: e.target.value,
        invalid: true
      }
    });
  }

  onChange (e) {
    let stateValue = e.target.value;

    this.setState({
      value: stateValue,
      invalid: false
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
          value: valueWei
        }
      });
    } catch (err) {
      return this.handleWithError(e);
    }
  }

  onKeyDown (e) {
    if (this.props.type === 'eth') {
      if (this.state.invalid) return;
      const diff = WEI_STEP.clone();
      if (e.keyCode === 38) {
        // do nothing
      } else if (e.keyCode === 40) {
        diff.negative = 1;
      } else {
        return;
      }
      let valueWei = this.props.value.add(diff);
      if (valueWei.lt(this.props.min)) valueWei = this.props.min.clone();

      this.props.onChange && this.props.onChange({
        target: {
          name: this.props.name,
          value: valueWei
        }
      });

      this.setState({
        value: fromWei(valueWei),
        invalid: false
      });

      return;
    }
    this.props.onKeyDown && this.props.onKeyDown(e);
  }

  render () {
    let append;
    if (this.props.append) {
      append = (
        <InputGroupAddon onClick={this.focus} addonType='append'>
          {this.props.append}
        </InputGroupAddon>
      );
    } else if (this.props.appendIcon) {
      append = (
        <InputGroupAddon onClick={this.focus} addonType='append'>
          <span className='input-group-text'>
            <i className={this.props.appendIcon} />
          </span>
        </InputGroupAddon>
      );
    }

    const labelClassName = `flyingLabel ${(this.props.showLabel || this.props.value) ? 'visible' : ''}`;

    let type = this.props.type;
    if (this.props.type === 'eth') type = 'text';

    return (
      <FormGroup className={`${this.state.invalid ? 'is-invalid' : ''}`}>
        <Label className={labelClassName} for={this.props.name}>{this.props.label}</Label>
        <InputGroup>
          <Input
            className='withFlyingLabel'
            autoComplete='off'
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
            value={this.state.value}
            bsSize={this.props.size || 'lg'}
            type={type || 'text'}
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
  constructor (props) {
    super(props);
    this.state = {
      moment: this.props.value || moment(),
      showPicker: false
    };

    this.inputElement = null;

    this.onChange = this.onChange.bind(this);
    this.handleSave = this.handleSave.bind(this);

    this.showPicker = this.showPicker.bind(this);
    this.hidePicker = this.hidePicker.bind(this);
  }

  onChange (moment) {
    if (this.props.onChange) this.props.onChange.call(null, this.state.moment);
    this.setState({ moment });
    this.inputElement.setState({
      value: this.value()
    });
  }

  handleSave () {
    this.setState({
      showPicker: false
    });
  }

  showPicker (e) {
    this.setState({
      showPicker: true
    });
  }

  hidePicker (e) {
    this.setState({
      showPicker: false
    });
  }

  value () {
    return this.state.moment.format('lll');
  }

  render () {
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
            message={this.props.message}
            appendIcon='far fa-calendar-alt'
            readOnly
            ref={el => this.inputElement = el}
          />
          <div id='date-picker-container'>
            <InputMoment
              moment={this.state.moment}
              onChange={this.onChange}
              minStep={1}
              onSave={this.handleSave}
              id='datepicker'
              className={this.state.showPicker ? 'visible' : ''}
              prevMonthIcon='fa fa-angle-double-left'
              nextMonthIcon='fa fa-angle-double-right'
            />
          </div>
        </ClickOutside>
      </Fragment>
    );
  }
}
const Auctionify = props => {
  let menu = '';

  if (props.linkTo === 'my-auctions') {
    menu = <Link className='btn btn-primary btn-sm' id='menu-btn' to='/my-auctions'>My Auctions</Link>;
  } else if (props.linkTo === 'create-auction') {
    menu = <Link className='btn btn-primary btn-sm' id='menu-btn' to='/'>Create Auction</Link>;
  }

  return (
    <Row className='brand justify-content-center'>
      <div className='text-center align-self-center mt-5'>
        <Col xl>
          <img src={auctionIcon} width='100%' alt='auction logo' />
        </Col>
        <Col xl>
          <h1>Auctionify</h1>
        </Col>
        <Col xl>
          <div className='network-name'><i className='fal fa-network-wired' /> {network}</div>
          <div className='version'>v0.2.7</div>
          {menu}
        </Col>
      </div>
    </Row>
  );
};
class CreateAuction extends Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: false,
      loadingText: '',
      showModal: false
    };

    this.createAuction = this.createAuction.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  async createAuction (data) {
    if (!web3) {
      return this.setState({
        showModal: true
      });
    }

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
      data.escrowEnabled
    ];

    console.log('Deploy contract', args);

    contract.deploy({
      data: smartContract.bytecode,
      arguments: args
    }).send({
      from: data.account,
      gasPrice: toWei(window.gasPrice.toString(), 'Gwei'),
      gas: window.gas * 2
    }).on('error', err => {
      console.log(err);
      this.setState({
        loading: false
      });
    }).on('transactionHash', transactionHash => {
      AuctionStorage.add({
        mine: true,
        title: data.title,
        transactionHash
      });

      this.setState({
        loadingText: `Confirming ${transactionHash.substr(0, 10)}`
      });
    }).on('receipt', receipt => {
      this.setState({
        loadingText: 'Confirmed!'
      });
      setTimeout(() => {
        this.setState({
          loading: false
        });
        this.props.history.push(`/auction/${receipt.contractAddress}`);
      }, 2000);
    });
  }

  toggleModal () {
    this.setState({
      showModal: !this.state.showModal
    });
  }

  render () {
    return (
      <LoadingOverlay background='rgba(255,255,255,.8)' color='#F60' active={this.state.loading} spinner text={this.state.loadingText}>
        <MetaMaskModal isOpen={this.state.showModal} toggle={this.toggleModal} />
        <Row className='m-0'>
          <Col lg={5} className='accent-bg'>
            <Auctionify linkTo='my-auctions' />
          </Col>
          <Col lg={7} className='py-4'>
            <CreateAuctionForm onSubmit={this.createAuction} />
          </Col>
        </Row>
      </LoadingOverlay>
    );
  }
}

class CreateAuctionForm extends Component {
  constructor (props) {
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
      accounts
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.createAuction = this.createAuction.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
  }

  onInputChange ({target}) {
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (target.invalid) {
      this.setState({
        [name]: '-',
        isValid: false
      });
      return;
    }

    this.setState({
      [name]: value,
      isValid: name === 'minimumBid' ? true : this.state.isValid
    });
  }

  onDateChange (auctionEnd) {
    this.setState({ auctionEnd });
  }

  createAuction (e) {
    e.preventDefault();
    this.props.onSubmit({
      title: this.state.title,
      description: this.state.description,
      minimumBid: this.state.minimumBid,
      auctionEnd: this.state.auctionEnd,
      account: this.state.account,
      listed: this.state.listed,
      escrowEnabled: this.state.escrowEnabled
    });
  }

  render () {
    return (
      <Fragment>
        <Container>
          <Row><Col><h3 className='title'>Create an auction!</h3></Col></Row>
        </Container>
        <Form onSubmit={this.createAuction} id='auctionForm' className='container'>
          <Row><Col>
            <FormInput showLabel name='title' label='Title' placeholder='Auction Title' onChange={this.onInputChange} value={this.state.title} />

          </Col></Row>
          <Row><Col>
            <FormInput showLabel name='description' label='Description' placeholder={'Auction Description'} type='textarea' onChange={this.onInputChange} value={this.state.description} />
          </Col></Row>
          <Row><Col>
            <FormDatePicker showLabel name='auctionEnd' label='Deadline' type='date' onChange={this.onDateChange} value={this.state.auctionEnd} />
          </Col></Row>
          <Row><Col>
            <FormInput showLabel min={this.state.minimumBid} name='minimumBid' label='Minimum Bid' placeholder='0.01' append='ETH' type='eth' onChange={this.onInputChange} value={this.state.minimumBid} />
          </Col></Row>
          <Row><Col>
            <FormInput showLabel name='account' label='Account' type='select' onChange={this.onInputChange} value={this.state.account}>
              {this.state.accounts.map((account, index) => <option key={index}>{account}</option>)}
            </FormInput>
          </Col></Row>
          <Row className='mt-2'>
            <Col xs={6}>
              <FormGroup check>
                <Label check>
                  <Input onChange={this.onInputChange} checked={this.state.listed} name='listed' type='checkbox' />{' '}
                  Listed
                </Label>
              </FormGroup>
            </Col>
            <Col xs={6}>
              <FormGroup check>
                <Label check>
                  <Input onChange={this.onInputChange} checked={this.state.escrowEnabled} name='escrowEnabled' type='checkbox' />{' '}
                  Enable escrow
                </Label>
              </FormGroup>
            </Col>
          </Row>
          <Row className='mt-3'><Col>
            <FormGroup className='text-right'>
              <Button disabled={!this.state.isValid} id='createAuctionBtn' color='primary'>Create Auction</Button>
            </FormGroup>
          </Col></Row>
        </Form>
      </Fragment>
    );
  }
}

class CountDown extends Component {
  constructor (props) {
    super(props);
    this.state = {
      now: moment()
    };
  }

  isFinished () {
    return moment().diff(this.props.to) >= 0;
  }

  componentDidMount () {
    this.intervalId = setInterval(() => {
      this.setState({
        now: moment()
      });
      if (this.isFinished()) {
        this.props.onFinished();
      }
    }, 1000);
  }

  componentWillUnmount () {
    clearInterval(this.intervalId);
  }

  render () {
    if (!this.props.to || this.isFinished()) return <div />;
    const duration = moment.duration(this.props.to - this.state.now);
    const pad = n => ('' + n).padStart(2, '0');
    return (
      <Row>
        <Col className='text-center p-0'>
          <div className='countdown'>
            <div className='section'>
              <span className='time'>{pad(Math.floor(duration.asDays()))}</span><br />
              <span className='label'>days</span>
            </div>

            <div className='section'><span className='separater'>:</span><br />&nbsp;</div>

            <div className='section'>
              <span className='time'>{pad(duration.hours())}</span><br />
              <span className='label'>hours</span>
            </div>

            <div className='section'><span className='separater'>:</span><br />&nbsp;</div>

            <div className='section'>
              <span className='time'>{pad(duration.minutes())}</span><br />
              <span className='label'>minutes</span>
            </div>

            <div className='section'><span className='separater'>:</span><br />&nbsp;</div>

            <div className='section'>
              <span className='time'>{pad(duration.seconds())}</span><br />
              <span className='label'>seconds</span>
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}

const WinningNotice = props => {
  if (props.account && props.account === props.bidder) {
    return (
      <div>
        <i className='fa fa-trophy' />
        &nbsp; You are the highest bidder!
      </div>
    );
  }
  return '';
};

class HighestBid extends Component {
  constructor (props) {
    super(props);
    this.state = {
      showIndicator: false,
      style: {
      }
    };
  }

  componentDidMount () {
    this.resize();
  }

  hideIndicatorOnFocus () {
    clearInterval(this.intervalId);
    clearTimeout(this.timeoutId);

    this.intervalId = setInterval(() => {
      if (windowInFocus) {
        clearInterval(this.intervalId);
        this.timeoutId = setTimeout(() => {
          this.setState({
            showIndicator: false
          });
        }, 10000);
      }
    }, 1000);
  }

  componentWillUnmount () {
    clearInterval(this.intervalId);
    clearTimeout(this.timeoutId);
  }

  componentDidUpdate (prevProps) {
    if (this.props.bid === prevProps.bid) return;

    beep();
    this.setState({
      showIndicator: true
    });
    this.hideIndicatorOnFocus();

    this.resize();
  }

  resize () {
    if (!this.containerEl) return;

    const ml = parseInt(getComputedStyle(this.containerEl, null).getPropertyValue('padding-left'));
    this.setState({
      style: {
        width: `${this.containerEl.offsetHeight}px`,
        top: `${this.containerEl.offsetHeight}px`,
        marginLeft: `${-ml}px`
      }
    });
  }

  render () {
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
        <div className='highest-bid container' ref={el => this.containerEl = el}>
          <div className={`highest-bid-indicator ${this.state.showIndicator ? '' : 'hidden'}`}>
            <i className='fas fa-bell' />
          </div>
          <div className='hb-label' style={this.state.style} ref={el => this.boxLabelEl = el}>
            <i className='fa fa-trophy' /> &nbsp;Highest Bid
          </div>
          <Row className='pl-4'>
            <Col>
              <h3>{fromWei(props.bid).toString()} ETH</h3>
              <div className='bidder'>
                <span className='address'>{props.bidder.substr(0, 14)}</span>
                <Badge color='dark' className={`you ${youVisible ? 'visible' : 'hidden'}`}>
                  <i className='fa fa-star' /> You
                </Badge>
              </div>
            </Col>
          </Row>
        </div>
      </Col>
    );
  }
}

const MetaMaskModal = props => {
  return (
    <Modal isOpen={props.isOpen} toggle={props.toggle} className='metamask-modal'>
      <ModalHeader toggle={props.toggle}>Web3 Required</ModalHeader>
      <ModalBody>
        Auctionify currently works with <a href='https://metamask.io/' rel='noopener noreferrer' target='_blank'>MetaMask</a> and mobile wallets (<a href='https://status.im/' rel='noopener noreferrer' target='_blank'>Status.im</a>, <a href='https://wallet.coinbase.com/' rel='noopener noreferrer' target='_blank'>Coinbase</a>, <a href='https://trustwalletapp.com/' rel='noopener noreferrer' target='_blank'>Trust</a>, etc)<br />
      </ModalBody>
      <ModalFooter>
        <Button color='primary' size='sm' onClick={props.toggle}>Ok</Button>
      </ModalFooter>
    </Modal>
  );
};

class ShowAuction extends Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: true,
      loadingText: 'loading auction',
      showModal: false
    };

    this.bid = this.bid.bind(this);
    this.finalize = this.finalize.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  async componentDidMount () {
    const contract = new readOnlyWeb3.eth.Contract(smartContract.ABI, this.props.match.params.address);
    window.contract = contract;

    const auction = {
      address: this.props.match.params.address,
      account: accounts[0],
      title: await contract.methods.auctionTitle().call(),
      description: await contract.methods.auctionDescription().call(),
      highestBidder: await contract.methods.highestBidder().call(),
      escrowModerator: await contract.methods.escrowModerator().call(),
      auctionState: await contract.methods.auctionState().call(),
      minimumBid: new BigNumber(await contract.methods.minimumBid().call()),
      highestBid: new BigNumber(await contract.methods.highestBid().call()),
      beneficiary: await contract.methods.beneficiary().call()

    };

    const deadline = await contract.methods.auctionEnd().call();
    auction.auctionEnd = moment(deadline * 1000);// .add(-3, 'day');

    this.setState({
      auction,
      loading: false
    });

    contract.events.HighestBidIncreased().on('data', ({returnValues}) => {
      const highestBidder = returnValues.bidder;
      const highestBid = new BigNumber(returnValues.amount);
      this.setState({
        auction: {
          ...this.state.auction,
          highestBidder,
          highestBid
        }
      });
    });
  }

  async finalize () {
    if (!web3) {
      return this.setState({
        showModal: true
      });
    }

    const contract = new web3.eth.Contract(smartContract.ABI, this.props.match.params.address);

    this.setState({
      loading: true,
      loadingText: 'Sending Transaction'
    });

    try {
      const transaction = contract.methods.endAuction();
      await transaction.send({
        from: this.state.auction.account,
        gasPrice: toWei(window.gasPrice.toString(), 'Gwei'),
        gas: window.gas / 5
      }).on('transactionHash', hash => {
        this.setState({
          loadingText: `Confirming ${hash.substr(0, 10)}`
        });
      }).on('error', err => {
        this.setState({
          loading: false
        });
      });

      const auctionState = await contract.methods.auctionState().call();
      this.setState({
        auction: {
          ...this.state.auction,
          auctionState
        },
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false
      });
    }
  }

  async bid ({bidAmount}) {
    if (!web3) {
      return this.setState({
        showModal: true
      });
    }
    const contract = new web3.eth.Contract(smartContract.ABI, this.props.match.params.address);

    this.setState({
      loading: true,
      loadingText: 'Sending Transaction'
    });

    try {
      const transaction = contract.methods.bid();
      await transaction.send({
        from: this.state.auction.account,
        value: bidAmount,
        gasPrice: toWei(window.gasPrice.toString(), 'Gwei'),
        gas: window.gas / 5
      }).on('transactionHash', hash => {
        this.setState({
          loadingText: `Confirming ${hash.substr(0, 10)}`
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

  toggleModal () {
    this.setState({
      showModal: !this.state.showModal
    });
  }

  render () {
    let auction = (<div className='accent-bg auction-placeholder'><span /></div>);
    if (this.state.auction) {
      auction = (<Auction auction={this.state.auction} onBid={this.bid} onFinalized={this.finalize} />);
    }
    return (
      <LoadingOverlay background='rgba(255,255,255,.7)' color='#F60' active={this.state.loading} spinner text={this.state.loadingText}>
        <MetaMaskModal isOpen={this.state.showModal} toggle={this.toggleModal} />
        {auction}
      </LoadingOverlay>
    );
  }
}

const AuctionEndStatus = props => {
  if (!props.show) return '';

  let label = 'Auction has ended';
  if (props.highestBidder === '0x0000000000000000000000000000000000000000') {
    label += ' without a winner';
  }
  if (props.auctionState === '2') {
    label = 'Auction is finalized!';
  }

  return (
    <Row>
      <Col className='text-center p-0'>
        <span><i className='far fa-calendar-times' /> {label}</span>
      </Col>
    </Row>
  );
};

const FinalizeAuction = props => {
  if (!props.show) return '';

  if (props.auction.auctionState === '2') { // for === maybe bigNum?
    // TODO: show button to call cleanUpAfterYourself() to everyone
    return '';
  }

  if (props.auction.account !== props.auction.highestBidder &&
    props.auction.account !== props.auction.escrowModerator && // { // This second condition is a temporary solution. TODO: on escrowModerator should see link/info to the dispute (On chain dispute trigger?).
    props.auction.account !== props.auction.beneficiary) {
    return '';
  }
  let message = null;

  if (props.auction.account === props.auction.beneficiary) {
    return (
      <Row className='bid-container'>
        <Col><Form><Row className='mt-1'>

          <Col xs={12} className='text-center mt-3 finalize-notice'>
            <i className='fas fa-info-circle' />  The highest bidder must finalize the auction!
          </Col>
        </Row>
        </Form></Col></Row>
    );
  }

  if (props.auction.account === props.auction.highestBidder) {
    message = 'You won the auction!';
  }
  if (props.auction.account === props.auction.escrowModerator) {
    message = 'You are the Escrow Moderator, be fair!';
  }

  return (
    <Row className='bid-container'>
      <Col><Form><Row className='mt-3'>
        <Col
          className='text-center'
          sm={{size: 8, offset: 2}}
          md={{size: 6, offset: 3}}
          lg={{size: 4, offset: 4}}
        >
          <Button id='fin' block color='primary' onClick={props.onClick}>Finalize Auction</Button>
        </Col>
        <Col xs={12} className='text-center mt-3 finalize-notice'>
          <i className='fas fa-trophy' /> {message}
        </Col>
        <Col xs={12} className='text-center mt-3 finalize-notice'>
          <i className='fas fa-info-circle' />  Finalize the auction to transfers the money to the beneficiary!
        </Col>

      </Row>
      </Form></Col></Row>
  );
};

class BidAuction extends Component {
  constructor (props) {
    super(props);

    this.state = {
      bidAmount: BigNumber.max(this.props.auction.minimumBid, this.props.auction.highestBid.add(WEI_STEP))
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.bid = this.bid.bind(this);
  }

  componentDidUpdate (prevProps) {
    if (this.props.auction.highestBid === prevProps.auction.highestBid) return;
    const bidAmount = BigNumber.max(this.state.bidAmount, this.props.auction.highestBid.add(WEI_STEP));
    this.setState({
      bidAmount
    });
    this.ethInput.setValue(bidAmount);
  }

  onInputChange ({target}) {
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  minimumAcceptableBid () {
    return BigNumber.max(this.props.auction.minimumBid, this.props.auction.highestBid.add(this.props.auction.minimumBid));
  }

  bid (e) {
    e.preventDefault();
    this.props.onBid({
      bidAmount: this.state.bidAmount
    });
  }

  render () {
    if (!this.props.show) return '';

    return (
      <Row className='bid-container'>
        <Col
          sm={{size: 8, offset: 2}}
          md={{size: 6, offset: 3}}
          lg={{size: 4, offset: 4}} >
          <Form onSubmit={this.bid} id='bidForm'>
            <Row>
              <Col>
                <FormInput showLabel
                  name='bidAmount'
                  min={this.minimumAcceptableBid()}
                  label='Amount'
                  placeholder='0.01'
                  type='eth'
                  append='ETH'
                  onChange={this.onInputChange}
                  value={this.state.bidAmount}
                  ref={el => this.ethInput = el}
                />
              </Col>
            </Row>
            <Row className='mt-2'>
              <Col sm={{size: 4, order: 2}} className='text-right'>
                <Button id='bid' block color='primary' onClick={this.bid}>Bid</Button>
              </Col>
              <Col order={1} className='text-center text-sm-left mt-2 winner-notice'>
                <WinningNotice bidder={this.props.auction.highestBidder} account={this.props.auction.account} />
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    );
  }
}

const FavoriteStar = props => {
  const className = props.faved ? 'fas fa-star' : 'far fa-star';
  const onToggle = e => {
    e.preventDefault();
    props.onToggle(!props.faved);
  };
  return (
    <div onClick={onToggle} className='fav-star'>
      <i className={`icon ${className}`} />
    </div>
  );
};

class Auction extends Component {
  constructor (props) {
    super(props);

    this.state = {
      finished: this.isFinished(),
      faved: AuctionStorage.exists(i => i.contractAddress === this.props.auction.address)
    };

    this.onBid = this.onBid.bind(this);
    this.finalize = this.finalize.bind(this);
    this.onFinished = this.onFinished.bind(this);
    this.onToggleFav = this.onToggleFav.bind(this);
  }

  finalize (e) {
    e.preventDefault();
    this.props.onFinalized();
  }

  isFinished () {
    return moment().diff(this.props.auction.auctionEnd) >= 0;
  }

  onFinished () {
    this.setState({
      finished: true
    });
  }

  onToggleFav (faved) {
    this.setState({
      faved
    });

    if (faved) {
      AuctionStorage.add({
        contractAddress: this.props.auction.address,
        title: this.props.auction.title
      });
    } else {
      AuctionStorage.remove(i => i.contractAddress === this.props.auction.address);
    }
  }

  onBid (e) {
    if (!this.state.faved) {
      this.onToggleFav(true);
    }
    this.props.onBid(e);
  }

  render () {
    const {auction} = this.props;
    if (!auction) {
      return '';
    }
    const networkSubdomain = network === 'mainnet' ? '' : `${network}.`;

    return (
      <Row className='m-0'>
        <Col lg='12' className='accent-bg auction-header container'>
          <Row>
            <Col>
              <h1 id='auction-title'> {auction.title}</h1>
              <FavoriteStar faved={this.state.faved} onToggle={this.onToggleFav} />
              <a
                target='_blank'
                rel='noopener noreferrer'
                href={`https://${networkSubdomain}etherscan.io/address/${this.props.auction.address}`}>
                <div className='network-name'><i className='fal fa-network-wired' /> {network}</div>
              </a>
            </Col>
          </Row>
          <Row>
            <HighestBid bid={auction.highestBid} bidder={auction.highestBidder} account={auction.account} />
          </Row>
          <CountDown onFinished={this.onFinished} to={auction.auctionEnd} />
          <AuctionEndStatus show={this.state.finished} highestBidder={auction.highestBidder} auctionState={auction.auctionState} />
        </Col>
        <Col className='py-4'>
          <Container>
            <Row><Col>
              <ReactMarkdown id='auction-description' source={auction.description} />
            </Col></Row>
            <FinalizeAuction onClick={this.finalize} show={this.state.finished} auction={auction} />
            <BidAuction show={!this.state.finished} onBid={this.onBid} auction={auction} />
          </Container>
        </Col>
      </Row>
    );
  }
}

const Footer = () => {
  return (
    <Container className='footer'>
      <Row noGutters>
        <Col lg={{size: 6, order: 2}} className='text-center text-lg-right'>
          <a target='_blank' rel='noopener noreferrer' href='https://github.com/auctionify'><i className='fab fa-github' /> Auctionify </a>
           | Made with <i className='fa fa-heart' /> in Montréal
        </Col>
        <Col lg={{size: 6, order: 1}} className='text-center text-lg-left'>
          <a target='_blank' rel='noopener noreferrer' href='https://etherscan.io/address/auctionify.eth'><i className='fab fa-ethereum' /> Auctionify.eth </a>
        </Col>
      </Row>
    </Container>
  );
};

class AuctionListItem extends Component {
  constructor (props) {
    super(props);

    this.remove = this.remove.bind(this);
  }

  remove (e) {
    e.preventDefault();
    this.props.remove(this.props.detail);
  }

  render () {
    const detail = this.props.detail;

    detail.transactionHash = detail.transactionHash || '-';
    detail.title = detail.title.trim() || '[ Untitled ]';

    const networkSubdomain = network === 'mainnet' ? '' : `${network}.`;

    let contractAddress = (
      <Fragment>
        <i className='fa fa-spinner fa-pulse' />
        &nbsp;
        <a target='_blank' rel='noopener noreferrer' href={`https://${networkSubdomain}etherscan.io/tx/${detail.transactionHash}`}>
          <code>{detail.transactionHash.toUpperCase().substr(0, 10)}</code> <i className='fa fa-external-link' />
        </a>
      </Fragment>
    );

    if (detail.contractAddress) {
      contractAddress = (
        <Fragment>
          <Link className='to-auction' to={`/auction/${detail.contractAddress}`}><code>{detail.contractAddress.toUpperCase().substr(0, 10)}</code></Link>
        </Fragment>
      );
    }
    return (
      <li className='list-group-item container'>
        <Row>
          <Col md={8}>
            <i className='fa fa-star golden' /> {detail.title}
          </Col>
          <Col md={4} className='text-left text-md-right addr'>
            {contractAddress}
          </Col>
        </Row>
      </li>
    );
  }
}

class AuctionsList extends Component {
  constructor (props) {
    super(props);

    this.state = {
      list: AuctionStorage.all()
    };
  }

  async getContractAddr (transactionHash) {
    let receipt = null;
    while (!receipt) {
      receipt = await readOnlyWeb3.eth.getTransactionReceipt(transactionHash);
      if (!receipt) await new Promise(acc => setTimeout(acc, 1000));
    }
    return receipt.contractAddress;
  }

  componentDidMount () {
    this.state.list.forEach(async item => {
      if (item.contractAddress) return;
      const contractAddress = await this.getContractAddr(item.transactionHash);
      item.contractAddress = contractAddress;

      AuctionStorage.replace(i => i.transactionHash === item.transactionHash, item);

      this.setState({
        list: [...this.state.list]
      });
    });
  }

  render () {
    return (
      <Container>
        <Row><Col><h3 className='title'>My Auctions</h3></Col></Row>
        <Row>
          <ListGroup flush className='w-100 auctions-list'>
            {this.state.list.map((auctionDetail, key) => {
              return (
                <AuctionListItem key={key} detail={auctionDetail} />
              );
            })}
          </ListGroup>
        </Row>
      </Container>
    );
  }
}

class MyAuctions extends Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <Row className='m-0'>
        <Col lg={5} className='accent-bg'>
          <Auctionify linkTo='create-auction' />
        </Col>
        <Col lg={7} className='py-4'>
          <AuctionsList />
        </Col>
      </Row>
    );
  }
}

class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      loaded: false
    };

    this.setup().then(() => console.log('Setup complete!'));
  }

  async setup () {
    const web3s = await getWeb3();

    web3 = web3s.web3;
    readOnlyWeb3 = web3s.readOnlyWeb3;
    network = web3s.network;

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

    window.gasPrice = (gasPrices.average / 10) + 10; // Some price optimization
    window.gas = 500000; // max gas included. this must be replaced with estimateGas()
    console.log(gasPrices);

    window.onfocus = () => {
      windowInFocus = true;
    };

    window.onblur = function () {
      windowInFocus = false;
    };

    this.setState({
      loaded: true
    });
  }

  render () {
    let content = (<div />);
    if (this.state.loaded) {
      content = (
        <Container className='main-container'>
          <Container className='main'>
            <Route path='/' exact component={withRouter(CreateAuction)} />
            <Route path='/auction/:address' component={withRouter(ShowAuction)} />
            <Route path='/my-auctions/' component={withRouter(MyAuctions)} />
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
