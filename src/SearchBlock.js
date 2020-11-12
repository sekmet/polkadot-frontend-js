import React, { useEffect, useState } from 'react';
import { Grid, Modal, Button, Card, Form, Input } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';

function Main (props) {
  const { api } = useSubstrate();
  const [status, setStatus] = useState(null);
  const [metadata, setMetadata] = useState({ data: null, version: null });
  const [foundblock, setFoundblock] = useState(null);
  const [searchType, setSearchType] = useState('BLOCKNUMBER');
  const [searchParam, setSearchParam] = useState([]);
  const [paramFields, setParamFields] = useState([]);

  useEffect(() => {
    const getMetadata = async () => {
      try {
        const data = await api.rpc.state.getMetadata();
        setMetadata({ data, version: data.version });
      } catch (e) {
        console.error(e);
      }
    };
    getMetadata();
  }, [api.rpc.state]);

  const searchByNumber = async (blockNumber) => {
    const chain = await api.rpc.system.chain();
    await api.rpc.chain.getBlockHash(blockNumber).then(async blockHash => {
      await api.rpc.chain.getHeader(blockHash).then(async foundBlockHeader => {
        // console.log('\r');
        // console.log(`[ ${chain} ] : found block #${foundBlockHeader.number} has hash ${foundBlockHeader.hash}`);
        // console.log('\r');
        setStatus(`[ ${chain} ] : found block #${foundBlockHeader.number} has hash ${foundBlockHeader.hash}`);
        const signedBlock = await api.rpc.chain.getBlock(foundBlockHeader.hash);
        const allRecords = await api.query.system.events();
        signedBlock.block.extrinsics.forEach(({ isSigned, meta, method: { args, method, section } }, index) => {
          // filter the specific events based on the phase and then the
          // index of our extrinsic in the block
          const events = allRecords
            .filter(({ phase }) =>
              phase.isApplyExtrinsic &&
            phase.asApplyExtrinsic.eq(index)
            )
            .map(({ event }) => `${event.section}.${event.method}`);
          let blockResult = '\r';
          // console.log(`${section}.${method}:: ${events.join(', ') || 'no events'}`);
          blockResult += `${section}.${method}:: ${events.join(', ') || 'no events'}`;
          // console.log('\r');
          blockResult += '\r';
          // explicit display of name, args & documentation
          // console.log(`${section}.${method}(${args.map((a) => a.toString()).join(', ')})`);
          blockResult += `${section}.${method}(${args.map((a) => a.toString()).join(', ')})`;
          // console.log('\r');
          blockResult += '\r';
          // console.log(meta.documentation.map((d) => d.toString()).join('\n'));
          blockResult += meta.documentation.map((d) => d.toString()).join('\n');
          setFoundblock(blockResult);
          setSearchParam([]);
        });
      });
    }).catch((e) => {
      console.log('ERROR: ', e.message);
      setStatus(`ERROR: ${e.message}`);
    });
  };

  const searchByHash = async (blockHash) => {
    const chain = await api.rpc.system.chain();
    await api.rpc.chain.getBlock(blockHash).then(async foundBlock => {
      const blockHeader = foundBlock.get('block').get('header');
      setStatus(`[ ${chain} ] : found block #${blockHeader.number} has hash ${blockHeader.hash}`);
      // console.log(`[ ${chain} ] : found block #${blockHeader.number} has hash ${blockHeader.hash}`);
      // console.log('\r');
      const signedBlock = await api.rpc.chain.getBlock(blockHeader.hash);
      const allRecords = await api.query.system.events();
      signedBlock.block.extrinsics.forEach(({ isSigned, meta, method: { args, method, section } }, index) => {
        // filter the specific events based on the phase and then the
        // index of our extrinsic in the block
        const events = allRecords
          .filter(({ phase }) =>
            phase.isApplyExtrinsic &&
          phase.asApplyExtrinsic.eq(index)
          )
          .map(({ event }) => `${event.section}.${event.method}`);
        let blockResult = '\r';
        blockResult += `${section}.${method}:: ${events.join(', ') || 'no events'}`;
        // console.log(`${section}.${method}:: ${events.join(', ') || 'no events'}`);
        // console.log('\r');
        // explicit display of name, args & documentation
        blockResult += `${section}.${method}(${args.map((a) => a.toString()).join(', ')})`;
        // console.log(`${section}.${method}(${args.map((a) => a.toString()).join(', ')})`);
        // console.log('\r');
        blockResult += '\r';
        blockResult += meta.documentation.map((d) => d.toString()).join('\n');
        // console.log(meta.documentation.map((d) => d.toString()).join('\n'));
        setFoundblock(blockResult);
        setSearchParam([]);
      });
    }).catch((e) => {
      console.log('ERROR: ', e.message);
      setStatus(`ERROR: ${e.message}`);
    });
  };

  const onSearchTypeChange = (ev, data) => {
    setSearchType(data.value);
    setSearchParam([]);
    // clear the formState
    //  setFormState(initFormState);
  };

  const onSearchParamChange = (ev, data) => {
    setSearchParam(data.value);
    // clear the formState
    //  setFormState(initFormState);
  };

  const paramField = [{
    name: 'findblock',
    type: '# Block Number',
    optional: false
  }, {
    name: 'findblock',
    type: 'Block Hash #',
    optional: false
  }];

  return (
    <Grid.Column width={16}>
      <Form>
        <h1>Search Blocks by number (height) or hash</h1>
        <Card style={{ width: '100%' }}>
          <Card.Content>
            <Card.Meta>
              <Form.Group style={{ overflowX: 'auto' }} inline>
                <label>Search</label>
                <Form.Radio
                  label='by Block Number'
                  name='searchType'
                  value='BLOCKNUMBER'
                  checked={searchType === 'BLOCKNUMBER'}
                  onChange={onSearchTypeChange}
                />
                <Form.Radio
                  label='by Block Hash'
                  name='searchType'
                  value='BLOCKHASH'
                  checked={searchType === 'BLOCKHASH'}
                  onChange={onSearchTypeChange}
                />
              </Form.Group>
              <Form.Group>
                {searchType === 'BLOCKNUMBER'
                  ? <Form.Field key={`${paramField[0].name}-${paramField[0].type}`}>
                    <Input
                      style={{ minWidth: '269px' }}
                      placeholder={paramField[0].type}
                      fluid
                      type='text'
                      onChange={onSearchParamChange}
                      state='searchParam'
                      value={searchParam}
                    />
                  </Form.Field>
                  : <Form.Field key={`${paramField[1].name}-${paramField[1].type}`}>
                    <Input
                      style={{ minWidth: '669px' }}
                      placeholder={paramField[1].type}
                      fluid
                      type='text'
                      onChange={onSearchParamChange}
                      state='searchParam'
                      value={searchParam}
                    />
                  </Form.Field>
                }
              </Form.Group>
            </Card.Meta>
          </Card.Content>
          <Card.Content extra>
            <Modal trigger={<Button disabled={searchParam.length <= 0} onClick={ () => searchType === 'BLOCKNUMBER' ? searchByNumber(searchParam) : searchByHash(searchParam) }>Search Block</Button>}>
              <Modal.Header>Block Information<br/><small>{status}</small></Modal.Header>
              <Modal.Content scrolling>
                <Modal.Description>
                  <pre>
                    <code style={{ overflowWrap: 'break-word' }}>{foundblock}</code>
                  </pre>
                </Modal.Description>
              </Modal.Content>
            </Modal>
          </Card.Content>
        </Card>
        <div style={{ overflowWrap: 'break-word' }}>{status}</div>
      </Form>
    </Grid.Column>
  );
}

export default function Searchblock (props) {
  const { api } = useSubstrate();
  return api.rpc && api.query ? (
    <Main {...props} />
  ) : null;
}
