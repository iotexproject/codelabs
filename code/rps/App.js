import React from 'react';
import './App.css';
import { Modal, Spinner } from "react-bootstrap";
import abi from "./abi";
import Antenna from "iotex-antenna";
import { Contract } from "iotex-antenna/lib/contract/contract";
import { WsSignerPlugin } from 'iotex-antenna/lib/plugin/ws';
import { toRau } from 'iotex-antenna/lib/account/utils';
import sleep from 'sleep-promise';

class App extends React.Component {
  contract;
  antenna;

  constructor(props) {
    super(props)
    this.antenna = new Antenna('http://api.iotex.one:80', {
      signer: new WsSignerPlugin('wss://local.get-scatter.com:64102/'),
    });
    this.contract = new Contract(
      abi,
      "io188rcvluys2n2c5jnys8ry6jyen6qyq4hr8pymq",
      {
        provider: this.antenna.iotx,
        signer: this.antenna.iotx.signer
      }
    );
    this.state = {
      balance: 0,
      games: 0,
      result: "Waiting for next block",
      showResult: false,
      loading: true
    }
  }

  componentDidMount() {
    this.updateState();
    setInterval(this.updateState.bind(this), 10e3)
  }

  async updateState() {
    let balance = await this.contract.methods.balance(
      {
        account: { address: "io13gy4fnm4yl3aqgs42huw589u2zx70pk5yt58h5" },
        gasLimit: "300000",
        gasPrice: "1000000000000"
      }
    );
    let games = await this.contract.methods.gamesPlayed(
      {
        account: { address: "io13gy4fnm4yl3aqgs42huw589u2zx70pk5yt58h5" },
        gasLimit: "300000",
        gasPrice: "1000000000000"
      }
    );
    this.setState({
      balance: balance,
      games: games
    });
  }

  async betHand(hand) {
    let blockHeight = (await this.antenna.iotx.getChainMeta()).chainMeta.height;
    while (true) {
      let newBlockHeight = (await this.antenna.iotx.getChainMeta()).chainMeta.height;
      if (newBlockHeight > blockHeight) {
        break;
      }
      await sleep(1000);
    }
    this.setState({
      result: "Please approve transaction"
    });
    await this.contract.methods.bet(hand,
      {
        amount: toRau(1, "IOTX"),
        account: { address: "io13gy4fnm4yl3aqgs42huw589u2zx70pk5yt58h5" },
        gasLimit: "300000",
        gasPrice: "1000000000000"
      });
    let result = await this.contract.methods.lastResult(
      {
        account: { address: "io13gy4fnm4yl3aqgs42huw589u2zx70pk5yt58h5" },
        gasLimit: "300000",
        gasPrice: "1000000000000"
      }
    );
    this.setState({
      result: result,
      loading: false
    })
    this.updateState();
  }

  showModal() {
    this.setState({ showResult: true });
  }

  closeModal() {
    this.setState({ showResult: false });
  }

  clearResult() {
    this.setState({ result: "Waiting for next block", loading: true });
  }

  render() {
    return (
      <div className="main-container" >
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossOrigin="anonymous"
        />
        <div id="title">
          rock paper scissors
          </div>
        <div id="data">
          <span>*Allow up to 10 seconds to receive your IOTX</span>

          <p>
            Bot balance: {this.state.balance.toString()} RAU <br></br>
            Games played: {this.state.games.toString()}<br></br>Bet: 1 IOTX<br></br>
          </p>
        </div>
        <div id="choose">Choose your hand</div>
        <ul>
          <button className="rpsButton" onClick={() => { this.showModal(); this.betHand(0); }}>Rock</button>
          <button className="rpsButton" onClick={() => { this.showModal(); this.betHand(1); }}>Paper</button>
          <button className="rpsButton" onClick={() => { this.showModal(); this.betHand(2); }}>Scissors</button>
        </ul>
        <Modal
          size="larW"
          aria-labelledby="contained-modal-title-vcenter"
          centered show={this.state.showResult} onHide={() => { this.closeModal(); this.clearResult() }}>
          <Modal.Header closeButton>
            <Modal.Title>Result</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.result + " "}
            {(() => {
              if (this.state.loading) {
                console.log("show spin");
                return <Spinner animation="border" variant="primary" size="sm" />
              }
            })()}
          </Modal.Body>
        </Modal>
      </div >
    )
  }
}

export default App;
