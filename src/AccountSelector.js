import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import {
  Menu,
  Button,
  Dropdown,
  Container,
  Icon,
  Image,
  Label
} from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';

function Main (props) {
  const { keyring } = useSubstrate();
  const { setAccountAddress } = props;
  const [accountSelected, setAccountSelected] = useState('');
  const [chainSelected, setChainSelected] = useState('');

  // Get the list of accounts we possess the private key for
  const chainOptions = [{
    key: 'polkadot',
    value: 'wss://rpc.polkadot.io',
    text: 'Parity Polkadot',
    icon: 'chain'
  }, {
    key: 'kusama',
    value: 'wss://kusama-rpc.polkadot.io',
    text: 'Kusama',
    icon: 'chain'
  }, {
    key: 'substrate',
    value: 'wss://dev-node.substrate.dev',
    text: 'Substrate',
    icon: 'code'
  }, {
    key: 'localnode',
    value: 'ws://127.0.0.1:9944',
    text: 'Local Node',
    icon: 'code'
  }];

  const initialChain =
    chainOptions.length > 0 ? chainOptions[0].value : '';

  const setCurrentChain = (chain) => {
    localStorage.setItem('currentChain', chain);
  };

  const getCurrentChain = () => {
    return localStorage.getItem('currentChain');
  };

  // Get the list of accounts we possess the private key for
  const keyringOptions = keyring.getPairs().map(account => ({
    key: account.address,
    value: account.address,
    text: account.meta.name.toUpperCase(),
    icon: 'user'
  }));

  const initialAddress =
    keyringOptions.length > 0 ? keyringOptions[0].value : '';

  // Set the initial address
  useEffect(() => {
    setAccountAddress(initialAddress);
    setAccountSelected(initialAddress);
    if (!getCurrentChain) {
      setChainSelected(initialChain);
    } else {
      setChainSelected(getCurrentChain);
    }
  }, [setAccountAddress, initialAddress, initialChain]);

  const onChange = address => {
    // Update state with new account address
    setAccountAddress(address);
    setAccountSelected(address);
  };

  const onChangeChain = chainurl => {
    // Update state with new connected chain
    setChainSelected(chainurl);
    setCurrentChain(chainurl);
    window.location.assign(`?rpc=${chainurl}`);
  };

  return (
    <Menu
      attached='top'
      tabular
      style={{
        backgroundColor: '#fff',
        borderColor: '#fff',
        paddingTop: '1em',
        paddingBottom: '1em'
      }}
    >
      <Container>
        <Menu.Menu>
          <Image src={`${process.env.PUBLIC_URL}/assets/substrate-logo.png`} size='mini' />
        </Menu.Menu>
        <Menu.Menu position='left' style={{ alignItems: 'center', marginLeft: '6px' }}>
          <Dropdown
            search
            selection
            clearable
            placeholder='Select an chain'
            options={chainOptions}
            onChange={(_, dropdown) => {
              onChangeChain(dropdown.value);
            }}
            value={chainSelected}
          />
        </Menu.Menu>
        <Menu.Menu position='right' style={{ alignItems: 'center' }}>
          { !accountSelected
            ? <span>
              Add your account with the{' '}
              <a
                target='_blank'
                rel='noopener noreferrer'
                href='https://github.com/polkadot-js/extension'
              >
                Polkadot JS Extension
              </a>
            </span>
            : null }
          <CopyToClipboard text={accountSelected}>
            <Button
              basic
              circular
              size='large'
              icon='user'
              color={accountSelected ? 'green' : 'red'}
            />
          </CopyToClipboard>
          <Dropdown
            search
            selection
            clearable
            placeholder='Select an account'
            options={keyringOptions}
            onChange={(_, dropdown) => {
              onChange(dropdown.value);
            }}
            value={accountSelected}
          />
          <BalanceAnnotation accountSelected={accountSelected} />
        </Menu.Menu>
      </Container>
    </Menu>
  );
}

function BalanceAnnotation (props) {
  const { accountSelected } = props;
  const { api } = useSubstrate();
  const [accountBalance, setAccountBalance] = useState(0);

  // When account address changes, update subscriptions
  useEffect(() => {
    let unsubscribe;

    // If the user has selected an address, create a new subscription
    accountSelected &&
      api.query.system.account(accountSelected, balance => {
        setAccountBalance(balance.data.free.toHuman());
      })
        .then(unsub => {
          unsubscribe = unsub;
        })
        .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }, [api, accountSelected]);

  return accountSelected ? (
    <Label pointing='left'>
      <Icon name='money' color='green' />
      {accountBalance}
    </Label>
  ) : null;
}

export default function AccountSelector (props) {
  const { api, keyring } = useSubstrate();
  return keyring.getPairs && api.query ? <Main {...props} /> : null;
}
