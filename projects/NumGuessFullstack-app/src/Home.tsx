// Home.tsx

import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useWallet } from '@txnlab/use-wallet';
import ConnectWallet from './components/ConnectWallet';
import AppCalls from './components/AppCalls';
import AlgorandService from './utils/AlgorandService';
import algosdk from 'algosdk';
import { Transaction, encodeUnsignedTransaction } from 'algosdk';

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false);
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false);
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false);
  const { activeAddress, signer, signTransactions, sendTransactions } = useWallet();
  const { enqueueSnackbar } = useSnackbar();

  const secretGuess = async (uplata: Transaction, guess: number): Promise<string> => {
    console.log('usao ovde')
    const encodedTransaction = algosdk.encodeUnsignedTransaction(uplata)
    const signedTransactions = await signTransactions([encodedTransaction])
    const waitRoundsToConfirm = 4
    enqueueSnackbar('Sending transaction...', { variant: 'info' })
    const { id } = await sendTransactions(signedTransactions, waitRoundsToConfirm)
    enqueueSnackbar(`Transaction sent: ${id}`, { variant: 'success' })
    console.log('a da li je ovde?')


    const response = await AlgorandService.pogodi(id, guess);
    console.log('ili ovde?')

    return response;
  };

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal);
  const toggleDemoModal = () => setOpenDemoModal(!openDemoModal);
  const toggleAppCallsModal = () => setAppCallsDemoModal(!appCallsDemoModal);

  const handleDeployClick = async () => {
    try {
      const deployParams = {
        onSchemaBreak: 'append',
        onUpdate: 'append',
      }
      const response = await AlgorandService.deployContract(deployParams, activeAddress || "", signer)

      enqueueSnackbar(`Message: ${response}`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(`Deployment failed: ${((error)as Error).message}`, { variant: 'error' })
    }

  };

  const getAppState = async () => {
    console.log('Fetching App State...');
  };

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <h2 className="text-4xl">Welcome to Number Guessing Game</h2>
        <div>Please connect your wallet and place your bid :)</div>
        <div className="grid">
          <div className="divider" />
          <button className="btn m-2" onClick={toggleWalletModal}>Wallet Connection</button>
          {/* {activeAddress && <button className="btn m-2" onClick={toggleDemoModal}>Transactions Demo</button>} */}
          {activeAddress && <button className="btn m-2" onClick={toggleAppCallsModal}>Let's play!</button>}
        </div>
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        {/* <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} /> */}
        <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} onDeployClick={handleDeployClick} secretGuess={secretGuess} getAppState={getAppState} />
      </div>
    </div>
  );
};

export default Home;
