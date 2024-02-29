import * as algokit from '@algorandfoundation/algokit-utils'
import { AppDetails } from '@algorandfoundation/algokit-utils/types/app-client'
import {Algodv2, Indexer, Transaction} from 'algosdk'
import { PogadjanjeClient } from '../contracts/Pogadjanje'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from './network/getAlgoClientConfigs'
import PaymentTransaction from 'algosdk/dist/types/types/transactions/payment'

export interface PogadjanjeGameState{
  skriveniBroj: number,
  rezultat: number,
  brojac: number
}

interface DeployParams {
  onSchemaBreak: string
  onUpdate: string
}

interface GlobalStateSchema{
  key: string,
  value: {
    type: number,
    bytes?: string,
    uint?: number
  }
}

interface ApplicationInfoResponse {
  params: {
    'global-state'?: GlobalStateSchema[]
  }
}

class AlgorandService {
  private algodClient: Algodv2
  private indexer: Indexer
  private appClient: PogadjanjeClient | null = null
  private appId: number = 0

  constructor() {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    this.algodClient = algokit.getAlgoClient({
      server: algodConfig.server,
      port: algodConfig.port,
      token: algodConfig.token
    }) as Algodv2
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    this.indexer = algokit.getAlgoIndexerClient({
      server: indexerConfig.server,
      port: indexerConfig.port,
      token: indexerConfig.token
    }) as Indexer
  }

  public async initializeAppClient(activeAdress: string, signer: any): Promise<void>{

    const appDetails: AppDetails = {
      resolveBy: 'creatorAndName',
      name: this.generateUniqueName('Pogadjanje'),
      sender: {signer, addr: activeAdress},
      creatorAddress: activeAdress,
      findExistingUsing: this.indexer
    }
    this.appClient = new PogadjanjeClient(appDetails, this.algodClient)

    console.log('New client')

  }

  private generateUniqueName(baseName: string): string {
    const timestamp = Date.now()
    return `${baseName}_${timestamp}`
  }

  public async deployContract(deployParams: DeployParams, activeAddress: string, signer: any): Promise<string> {
    //if (!this.appClient) {
    this.initializeAppClient(activeAddress, signer)
    // }
    //throw new Error('appClient is not initialized')
    try {
      console.log(deployParams)
      await this.appClient.deploy(deployParams).then((response) => {
        this.appId = Number(response.appId)
        console.log(`Contract deployed successfully with appId:${this.appId}`)
        return `Contract deployed successfully with appId:${this.appId}`
      })
    } catch (error) {
      throw new Error(`Error deploying the contract: ${error.message}`)
    }

    return 'Error occured while deploying!'
  }

  public async pogodi(uplata: Transaction, broj: number): Promise<any> {
    if(!this.appClient) throw new Error('appClient not initialized')
    try {
      const response = await this.appClient.pogodi({uplata: uplata, broj: broj})
      return response.return
    } catch(error){
      throw new Error(`Error calling the contract" ${error.message}`)
    }
  }

  public async getApplicationState(): Promise<PogadjanjeGameState> {
    if (this.appId === 0) {
      throw new Error('App is not deployed yet!')
    }

    try {
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do()
      const stateData: Partial<PogadjanjeGameState> = {} // Use Partial<> since we'll be populating it dynamically

      appInfo.params['global-state'].forEach((state) => {
        const key = decodeBase64(state.key)
        const value = state.value.type === 2 ? state.value.uint : decodeBase64(state.value.bytes)

        console.log(`${key}: ${value}`)

        switch (key) {
          case 'rezultat':
            stateData.rezultat = value as number
            break
          case 'skriveni_broj':
            stateData.skriveniBroj = value as number
            break

        }
      })
      //vidi ima li ovo smisla
      appInfo.params['local-state'].forEach((state) => {
        const key = decodeBase64(state.key)
        const value = state.value.type === 2 ? state.value.uint : decodeBase64(state.value.bytes)

        console.log(`${key}: ${value}`)

        switch (key) {
          case 'brojac':
            stateData.brojac = value as number
            break

        }
      })

      console.log(stateData)
      return stateData as PogadjanjeGameState // Cast to PogadjanjeGameState since we know all fields should be populated
    } catch (e: unknown) {
      console.error('Error retrieving application state:', e.message)
      throw e
    }
  }
}

function decodeBase64(base64String: string): string {
  if (typeof Buffer !== 'undefined') {
    // For Node.js
    return Buffer.from(base64String, 'base64').toString()
  } else {
    // For browsers
    return atob(base64String)
  }
}

export default new AlgorandService()







