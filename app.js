// https://docs.ethers.org/v6/getting-started/
let signer = null;
let provider = null;
let wallet = null;
let contract = null;
let claim_amount = 0;

// ref address
let params = location.search ? Object.assign(...location.search.substr(1).split('&').map(r => r.split('=')).map(r => ({ [r[0]]: r[1] }))) : {};
let ref_addr = params.ref || DEFAULT_REF;
$('.ref-text').html(`REF:${ref_addr}`);

// connect wallet
$('.btn-connect').click(async e => {
  if ($(e.target).hasClass('is-disabled')) return;

  // connect metamask
  provider = new ethers.BrowserProvider(window.ethereum)
  signer = await provider.getSigner();

  // recheck arbitrum one network
  const { chainId } = await provider.getNetwork();
  if (chainId != BigInt(ARB_CHAIN_ID)) {
    alert('Switch Metamask Network to [Arbitrum One]');
    return;
  }

  // load contract
  contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);

  // show wallet address
  wallet = signer.address;
  $('.address').removeClass('d-none');
  $('.address').html(wallet.substr(0, 5) + '...' + wallet.slice(-4));

  // hide connect button
  $('.btn-connect').addClass('d-none');

  // show claim, sign-out buttons
  $('.btn-claim').removeClass('d-none');
  $('.sign-out').removeClass('d-none');

  // query claim amount
  let claimed = await contract.getFunction('claimedUser').staticCall(wallet);
  if (claimed) {
    $('.btn-claim').text('Already claimed');
  }
  else {
    let a = await contract.getFunction('claimable').staticCall()
    claim_amount = parseInt(a)/1_000_000_000; //9
    $('.btn-claim').text(`Claim ${claim_amount/1_000_000}M $LSDOGE`);
    $('.btn-claim').removeClass('is-disabled');
  }
});

// claim
$('.btn-claim').click(e => {
  let target = e.target;
  if ($(target).hasClass('is-disabled')) return;
  if (claim_amount <= 0) return;
  $(target).addClass('is-disabled');
  contract.getFunction('claim').send(MERKLE_PROOF, ref_addr)
    .then(_ => {
      alert('Claim Success! Check your txn.')
    })
    .catch(e => {
      alert(e);
      console.log(e);
      $(target).removeClass('is-disabled');
    })
});

// sign out
$('.sign-out').click(_ => {
  $('.address').addClass('d-none');
  $('.btn-connect').removeClass('d-none');
  $('.btn-claim').addClass('d-none');
  $('.sign-out').addClass('d-none');
});

// metamask events
window.ethereum.on('accountsChanged', function (accounts) {
  $('.sign-out').click();
  $('.btn-connect').click();
})
window.ethereum.on('chainChanged', function (networkId) {
  $('.sign-out').click();
  $('.btn-connect').click();
})
