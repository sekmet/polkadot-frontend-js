import React, { useEffect, useState } from 'react';
import { Table, Grid, Label } from 'semantic-ui-react';
import { useSubstrate } from './substrate-lib';

export default function Main (props) {
  const { api } = useSubstrate();
  const [blocks, setBlocks] = useState([]);

  const getBlocks = api.derive.chain.subscribeNewHeads;

  useEffect(() => {
    let unsubscribeAll = null;

    getBlocks(async header => {
      // Retrieve the chain name
      const chain = await api.rpc.system.chain();
      // console.log(`[ ${chain} ] : last block #${header.number} has hash ${header.hash}`);
      if (header.number) {
        setBlocks(prevState => ([
          ...prevState,
          {
            chain: `${chain}`,
            number: `${header.number}`,
            hash: `${header.hash}`
          }
        ]));
      }
    })
      .then(unsub => {
        unsubscribeAll = unsub;
      })
      .catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, getBlocks]);

  return (
    <Grid.Column>
      <h1>Latest Blocks</h1>
      <Table celled striped size='small'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Chain</Table.HeaderCell>
            <Table.HeaderCell>Block Number</Table.HeaderCell>
            <Table.HeaderCell>Block Hash</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{blocks.map((block, idx) =>
          <Table.Row key={idx}>
            <Table.Cell width={3} textAlign='left'>
              <Label ribbon style={{ color: 'red', fontWeight: 'bold', textTransform: 'uppercase' }}>{block.chain}</Label>
            </Table.Cell>
            <Table.Cell width={2}>
              <span style={{ display: 'inline-block', minWidth: '21em', fontWeight: 'bold' }}>
                #{block.number}
              </span>
            </Table.Cell>
            <Table.Cell width={11} style={{ color: 'green', fontWeight: 'bold' }}>{block.hash}</Table.Cell>
          </Table.Row>
        )}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}
