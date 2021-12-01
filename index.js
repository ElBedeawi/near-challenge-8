// Import stylesheets
import './assets/style.css';
import * as nearAPI from 'near-api-js';
import Big from 'big.js';

const { connect, keyStores, WalletConnection, Contract } = nearAPI;
const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 13)
  .toFixed();

export const CONTRACT_NAME = 'cha7.bedeawi.testnet';
(async () => {
  const config = {
    networkId: 'testnet',
    keyStore: new keyStores.BrowserLocalStorageKeyStore(),
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    contractName: CONTRACT_NAME,
  };

  // connect to NEAR
  const near = await connect(config);

  // create wallet connection
  const wallet = new WalletConnection(near);

  var contract = await new Contract(wallet.account(), config.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['get_candidate', 'get_stats'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['add_candidate', 'add_vote'],
    sender: wallet.account(), // account object to initialize and sign transactions.
  });

  async function signIn(cb) {
    await wallet.requestSignIn(
      //{ contractId: 'account-with-deploy-contract.near' }
      config.contractName, // contract requesting access
      'Example App', // optional
      'https://js-kjwbk6.stackblitz.io/success', // optional
      'https://js-kjwbk6.stackblitz.io/failure' // optional
    );
  }

  const loginBtn = document.getElementById('SignInWithNear');
  loginBtn.addEventListener('click', signIn);
  const sendBtn = document.getElementById('SendWithNear');
  sendBtn.addEventListener('click', AddCandidate);

  if (window.location.pathname.endsWith('success')) {
    const walletAccountObj = wallet.account();
    console.log(walletAccountObj);
    console.log(wallet.getAccountId());
  }

  async function AddCandidate() {
    console.log('Called Add new');
    $('#add-candidate-container').hide();
    $('#add-candidate-spinner').show();
    console.log('Called Add new');
    contract
      .add_candidate(
        {
          name: document.getElementById('candidateName').value,
        },
        BOATLOAD_OF_GAS,
        Big('0')
          .times(10 ** 24)
          .toFixed()
      )
      .then((res) => {
        $('#add-candidate-container').show();
        $('#add-candidate-spinner').hide();
        $('#add-toast').toast('show');
        $('#add-toast .toast-body').text(res);
        $('#candidateName').value = '';
        console.log(res);
        GetCandidates();
        GetStats();
      });
  }

  async function AddVote(candidateName) {
    console.log('Called Add Vote');

    contract
      .add_vote(
        {
          name: candidateName,
        },
        BOATLOAD_OF_GAS,
        Big('0')
          .times(10 ** 24)
          .toFixed()
      )
      .then((res) => {
        $('#add-toast').toast('show');
        $('#add-toast .toast-body').text(res);
        console.log(res);
        GetStats();
      });
  }

  async function GetCandidates() {
    console.log('Called GetCandidates');
    $('#candidates').hide();
    $('#candidates-spinner').show();
    contract.get_candidate().then((res) => {
      $('#candidates').show();
      $('#candidates-spinner').hide();
      console.log(res);
      displayCandidates(res.filter((x) => x !== ''));
    });
  }

  async function GetStats() {
    console.log('Called GetCandidates');
    $('#candidates').hide();
    $('#candidates-spinner').show();
    contract.get_stats().then((res) => {
      $('#candidates').show();
      $('#candidates-spinner').hide();
      console.log(res);
      displayStats(res.filter((x) => x[0] !== ''));
    });
  }

  function displayStats(stats) {
    var dynamicColors = function () {
      var r = Math.floor(Math.random() * 255);
      var g = Math.floor(Math.random() * 255);
      var b = Math.floor(Math.random() * 255);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    };

    const ctx = $('#myChart');
    const data = {
      labels: stats.map((x) => x[0]),
      datasets: [
        {
          label: 'Elite Voting',
          data: stats.map((x) => x[1]),
          backgroundColor: stats.map((x) => dynamicColors()),
          hoverOffset: 4,
        },
      ],
    };
    const config = {
      type: 'pie',
      data: data,
    };

    if (window.myChartX === undefined) {
      window.myChartX = new Chart(ctx, config);
    } else {
      window.myChartX.data = data;
      window.myChartX.update();
    }
  }

  $(function () {
    GetCandidates().then((res) => {
      console.log(res);
    });

    GetStats().then((res) => console.log(res));
  });

  function displayCandidates(candidates) {
    $('#candidates .row').html('');
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      $('#candidates .row').append(`<div class="col-3 mt-2">
      <div class="card">
        <div
          class="card-body d-flex align-items-center flex-column"
        >
          <h5 class="card-title">${candidate}</h5>
          <a href="#" data-name="${candidate}" class="vote btn btn-primary">Vote <span style="font-size:1.8rem;"> &#${Math.floor(
        Math.random() * (128567 - 128512 + 1) + 128512
      )};</span></a>
        </div>
      </div>
    </div>`);
    }

    $('a.vote.btn.btn-primary').click((e) => {
      e.preventDefault();
      console.log('clicked');
      console.log($(e.target).attr('data-name'));
      AddVote($(e.target).attr('data-name'));
    });
  }

  async function sendNear() {
    // sends NEAR tokens
    const near = await connect(config);
    const account = await near.account('bedeawi.testnet');
    await account.sendMoney(
      'eslamx7.testnet', // receiver account
      '1000000000000000000000000' // amount in yoctoNEAR
    );
  }
})();
