// AppCalls.tsx

import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useWallet } from '@txnlab/use-wallet';
import algosdk, { Transaction } from 'algosdk';
import AlgorandService from '../utils/AlgorandService';

interface AppCallsProps {
  openModal: boolean;
  setModalState: (value: boolean) => void;
  onDeployClick: () => Promise<void>;
  secretGuess: (uplata: Transaction, guess: number) => Promise<string>;
  getAppState: () => Promise<void>;
}

const AppCalls: React.FC<AppCallsProps> = ({ openModal, setModalState, onDeployClick, secretGuess, getAppState }) => {
  const [contractInput, setContractInput] = useState<number>(0);
  const [receiverAddress, setReceiverAddress] = useState<string>('')
  const { enqueueSnackbar } = useSnackbar();
  const { activeAddress, signTransactions } = useWallet();

  // const handleDeployClick = async () => {
  //   try {
  //     const response = await onDeployClick();
  //     enqueueSnackbar(`Message: ${response}`, { variant: 'success' });
  //   } catch (error) {
  //     enqueueSnackbar(`Deployment failed: ${error.message}`, { variant: 'error' });
  //   }
  // };

  const handlePlayerMove = async () => {
    onDeployClick()
    if (!activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' });
      return;
    }

    try {
      const suggestedParams = await AlgorandService.algodClient.getTransactionParams().do();
      const transaction = algosdk.makePaymentTxnWithSuggestedParams(activeAddress, receiverAddress, 1000000, undefined, undefined, suggestedParams);
      const response = await secretGuess(transaction, contractInput);
      enqueueSnackbar(`Response from the contract: ${response}`, { variant: 'success' });
      getAppState();
    } catch (error) {
      enqueueSnackbar(`Error calling the contract: ${((error) as Error).message}`, { variant: 'error' });
    }
  };

  return (
    <dialog className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form className="modal-box">
        <h3 className="font-bold text-lg">Can YOU guess the hidden number?</h3>
        <input type="number" placeholder="Guess a number 1-10" className="input input-bordered w-full mt-4" value={contractInput.toString()} onChange={(e) => setContractInput(parseInt(e.target.value))} />
        <input type="text" placeholder="App Address:" className="input input-bordered w-full mt-4" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => setModalState(false)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePlayerMove}>Try your luck!</button>
        </div>
      </form>
    </dialog>
  );
};

export default AppCalls;
