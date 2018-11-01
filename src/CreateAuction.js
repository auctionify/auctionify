import React, { Component, Fragment, useContext } from 'react';
import {
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
  Container,
} from 'reactstrap';
import moment from 'moment';
import { BigNumber, WEI_STEP } from './utils';
import { Web3Context } from './Web3Context';
import {
  Section,
  Inp,
  Fa,
  Check,
  HelpTip,
  EthInp,
  DateInp,
} from './Components';
import auctionIcon from './images/auctionify.png';
export const CreateAuction = props => {
  const { accounts } = useContext(Web3Context);
  // async createAuction (data) {
  //   if (!web3) {
  //     return this.setState({
  //       showModal: true
  //     });
  //   }

  //   this.setState({
  //     loading: true,
  //     loadingText: 'Deploying Contract'
  //   });

  //   const contract = new web3.eth.Contract(smartContract.ABI);
  //   const args = [
  //     data.title,
  //     data.auctionEnd.unix().toString(),
  //     data.account,
  //     data.description,
  //     data.minimumBid.toString(),
  //     data.listed,
  //     data.escrowEnabled
  //   ];

  //   console.log('Deploy contract', args);

  //   contract.deploy({
  //     data: smartContract.bytecode,
  //     arguments: args
  //   }).send({
  //     from: data.account,
  //     gasPrice: toWei(window.gasPrice.toString(), 'Gwei'),
  //     gas: window.gas * 2
  //   }).on('error', err => {
  //     console.log(err);
  //     this.setState({
  //       loading: false
  //     });
  //   }).on('transactionHash', transactionHash => {
  //     AuctionStorage.add({
  //       mine: true,
  //       title: data.title,
  //       transactionHash
  //     });

  //     this.setState({
  //       loadingText: `Confirming ${transactionHash.substr(0, 10)}`
  //     });
  //   }).on('receipt', receipt => {
  //     this.setState({
  //       loadingText: 'Confirmed!'
  //     });
  //     setTimeout(() => {
  //       this.setState({
  //         loading: false
  //       });
  //       this.props.history.push(`/auction/${receipt.contractAddress}`);
  //     }, 2000);
  //   });
  // }

  // toggleModal () {
  //   this.setState({
  //     showModal: !this.state.showModal
  //   });
  // }

  const submit = data => {
    console.log(data);
  };
  return <CreateAuctionForm accounts={accounts} onSubmit={submit} />;
};

class CreateAuctionForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
      description: '',
      auctionEnd: moment()
        .add(3, 'days')
        .startOf('day'),
      minimumBid: WEI_STEP,
      listed: false,
      escrowEnabled: true,
      account: this.props.accounts[0],
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state);
  }

  onInputChange({ target }) {
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
      isValid: name === 'minimumBid' ? true : this.state.isValid,
    });
  }

  render() {
    return (
      <Fragment>
        <Section unstyled>
          <Col className="header">
            <img id="logo" src={auctionIcon} alt="auction logo" />
          </Col>
          <Col className="d-flex justify-content-end">
            <Button color="primary" id="connect-wallet-btn">
              Connect to wallet
            </Button>
          </Col>
        </Section>
        <Section top>
          <Col xs={12}>
            <h2>Create an auction</h2>
          </Col>
          <Col xs={12}>
            <Inp
              name="title"
              label="Title"
              onChange={this.onInputChange}
              autoComplete="off"
              value={this.state.title}
            />
          </Col>
          <Col xs={12}>
            <Inp
              name="description"
              label="Description"
              onChange={this.onInputChange}
              autoComplete="off"
              value={this.state.description}
            />
          </Col>
        </Section>
        <Section bottom>
          <Col xs={12}>
            <h2>Sales parameters</h2>
          </Col>
          <Col xs={12}>
            <EthInp
              name="minimumBid"
              label="Starting price"
              onChange={this.onInputChange}
              initialValue={this.state.minimumBid}
              min={WEI_STEP}
            />
          </Col>
          <Col xs={12}>
            <DateInp
              name="auctionEnd"
              label="Deadline"
              onChange={this.onInputChange}
              autoComplete="off"
              append={<Fa r icon="calendar-alt" />}
              value={this.state.auctionEnd}
            />
          </Col>
          <Col xs={12}>
            <Inp
              name="account"
              label="Account"
              onChange={this.onInputChange}
              autoComplete="off"
              value={this.state.account}
              type="select">
              {this.props.accounts.map((account, index) => (
                <option key={index}>{account}</option>
              ))}
            </Inp>
          </Col>
          <Col xs={12} className="mt-3">
            <Container className="p-0">
              <Row noGutters>
                <Col xs={10}>
                  Enable escrow (recommended){' '}
                  <HelpTip id="escrow-help">
                    Enabling scrow does something magical!
                  </HelpTip>
                </Col>
                <Col xs={2} className="d-flex justify-content-end">
                  <Check
                    onChange={this.onInputChange}
                    checked={this.state.escrowEnabled}
                    name="escrowEnabled"
                  />
                </Col>
              </Row>
              <Row noGutters>
                <Col xs={10}>
                  Make auction private{' '}
                  <HelpTip id="unlisted-help">
                    Private auctions won't be listed in the auctions list.
                  </HelpTip>
                </Col>
                <Col xs={2} className="d-flex justify-content-end">
                  <Check
                    onChange={this.onInputChange}
                    checked={this.state.listed}
                    name="listed"
                  />
                </Col>
              </Row>
            </Container>
          </Col>
          <Col xs={12}>
            <Button
              block
              id="createAuctionBtn"
              color="primary"
              onClick={this.onSubmit}>
              Create auction
            </Button>
          </Col>
        </Section>
      </Fragment>
    );
  }
}
// <Auctionify linkTo='my-auctions' />
// <CreateAuctionForm onSubmit={this.createAuction} />

// class CreateAuctionForm extends Component {
//   constructor (props) {
//     super(props);

//     this.state = {
//       title: '',
//       description: '',
//       minimumBid: WEI_STEP.clone(),
//       auctionEnd: moment().add(3, 'days').startOf('day'),
//       account: accounts[0],
//       isValid: true,
//       listed: true,
//       escrowEnabled: true,
//       accounts
//     };

//     this.onInputChange = this.onInputChange.bind(this);
//     this.createAuction = this.createAuction.bind(this);
//     this.onDateChange = this.onDateChange.bind(this);
//   }

//   onInputChange ({target}) {
//     const value = target.type === 'checkbox' ? target.checked : target.value;
//     const name = target.name;

//     if (target.invalid) {
//       this.setState({
//         [name]: '-',
//         isValid: false
//       });
//       return;
//     }

//     this.setState({
//       [name]: value,
//       isValid: name === 'minimumBid' ? true : this.state.isValid
//     });
//   }

//   onDateChange (auctionEnd) {
//     this.setState({ auctionEnd });
//   }

//   createAuction (e) {
//     e.preventDefault();
//     this.props.onSubmit({
//       title: this.state.title,
//       description: this.state.description,
//       minimumBid: this.state.minimumBid,
//       auctionEnd: this.state.auctionEnd,
//       account: this.state.account,
//       listed: this.state.listed,
//       escrowEnabled: this.state.escrowEnabled
//     });
//   }

//   render () {
//     return (
//       <Fragment>
//         <Container>
//           <Row><Col><h3 className='title'>Create an auction!</h3></Col></Row>
//         </Container>
//         <Form onSubmit={this.createAuction} id='auctionForm' className='container'>
//           <Row><Col>
//             <FormInput showLabel name='title' label='Title' placeholder='Auction Title' onChange={this.onInputChange} value={this.state.title} />

//           </Col></Row>
//           <Row><Col>
//             <FormInput showLabel name='description' label='Description' placeholder={'Auction Description'} type='textarea' onChange={this.onInputChange} value={this.state.description} />
//           </Col></Row>
//           <Row><Col>
//             <FormDatePicker showLabel name='auctionEnd' label='Deadline' type='date' onChange={this.onDateChange} value={this.state.auctionEnd} />
//           </Col></Row>
//           <Row><Col>
//             <FormInput showLabel min={this.state.minimumBid} name='minimumBid' label='Minimum Bid' placeholder='0.01' append='ETH' type='eth' onChange={this.onInputChange} value={this.state.minimumBid} />
//           </Col></Row>
//           <Row><Col>
//             <FormInput showLabel name='account' label='Account' type='select' onChange={this.onInputChange} value={this.state.account}>
//               {this.state.accounts.map((account, index) => <option key={index}>{account}</option>)}
//             </FormInput>
//           </Col></Row>
//           <Row className='mt-2'>
//             <Col xs={6}>
//               <FormGroup check>
//                 <Label check>
//                   <Input onChange={this.onInputChange} checked={this.state.listed} name='listed' type='checkbox' />{' '}
//                   Listed
//                 </Label>
//               </FormGroup>
//             </Col>
//             <Col xs={6}>
//               <FormGroup check>
//                 <Label check>
//                   <Input onChange={this.onInputChange} checked={this.state.escrowEnabled} name='escrowEnabled' type='checkbox' />{' '}
//                   Enable escrow
//                 </Label>
//               </FormGroup>
//             </Col>
//           </Row>
//           <Row className='mt-3'><Col>
//             <FormGroup className='text-right'>
//               <Button disabled={!this.state.isValid} id='createAuctionBtn' color='primary'>Create Auction</Button>
//             </FormGroup>
//           </Col></Row>
//         </Form>
//       </Fragment>
//     );
//   }
// }
