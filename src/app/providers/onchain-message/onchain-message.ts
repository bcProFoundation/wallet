import { PrivateKey, PublicKey } from '@abcpros/bitcore-lib-xpi';
import BCHJS from '@abcpros/xpi-js';
import { Injectable } from '@angular/core';
import { currency } from 'src/app/constants';
import { Logger } from '../logger/logger';
import * as forge from 'node-forge';

import { BitcoreLib } from '@abcpros/crypto-wallet-core';
import { ChronikClient, TxHistoryPage } from 'chronik-client';

@Injectable({
  providedIn: 'root'
})
export class OnchainMessageProvider {
  bchjs;
  Bitcore = BitcoreLib;
  PrivateKey = this.Bitcore.PrivateKey;
  PublicKey = this.Bitcore.PublicKey;
  crypto2 = this.Bitcore.crypto;

  constructor(private logger: Logger) {
    this.logger.debug('TokenProvider initialized');
    this.bchjs = new BCHJS({ restURL: '' });
  }

  ngOnInit() {}

  async getPrivateWifKey(wallet, mnemonic) {
    const rootSeedBuffer = await this.bchjs.Mnemonic.toSeed(mnemonic);
    let masterHDNode;
    masterHDNode = this.bchjs.HDNode.fromSeed(rootSeedBuffer);
    const rootPath = wallet.getRootPath()
      ? wallet.getRootPath()
      : "m/44'/1899'/0'";
    const node = this.bchjs.HDNode.derivePath(masterHDNode, rootPath);
    const change = this.bchjs.HDNode.derivePath(node, '0/0');
    return this.bchjs.HDNode.toWIF(change);
  }

  parseOpReturn(hexStr) {
    if (
      !hexStr ||
      typeof hexStr !== 'string' ||
      hexStr.substring(0, 2) !== currency.opReturn.opReturnPrefixHex
    ) {
      return false;
    }

    hexStr = hexStr.slice(2); // remove the first byte i.e. 6a

    /*
     * @Return: resultArray is structured as follows:
     *  resultArray[0] is the transaction type i.e. eToken prefix, cashtab prefix, external message itself if unrecognized prefix
     *  resultArray[1] is the actual cashtab message or the 2nd part of an external message
     *  resultArray[2 - n] are the additional messages for future protcols
     */
    let resultArray = [];
    let message = '';
    let hexStrLength = hexStr.length;

    for (let i = 0; hexStrLength !== 0; i++) {
      // part 1: check the preceding byte value for the subsequent message
      let byteValue = hexStr.substring(0, 2);
      let msgByteSize = 0;
      if (byteValue === currency.opReturn.opPushDataOne) {
        // if this byte is 4c then the next byte is the message byte size - retrieve the message byte size only
        msgByteSize = parseInt(hexStr.substring(2, 4), 16); // hex base 16 to decimal base 10
        hexStr = hexStr.slice(4); // strip the 4c + message byte size info
      } else {
        // take the byte as the message byte size
        msgByteSize = parseInt(hexStr.substring(0, 2), 16); // hex base 16 to decimal base 10
        hexStr = hexStr.slice(2); // strip the message byte size info
      }

      // part 2: parse the subsequent message based on bytesize
      const msgCharLength = 2 * msgByteSize;
      message = hexStr.substring(0, msgCharLength);
      if (i === 0 && message === currency.opReturn.appPrefixesHex.eToken) {
        // add the extracted eToken prefix to array then exit loop
        resultArray[i] = currency.opReturn.appPrefixesHex.eToken;
        break;
      }
      else {
        // this is either an external message or a subsequent cashtab message loop to extract the message
        resultArray[i] = message;
      }

      // strip out the parsed message
      hexStr = hexStr.slice(msgCharLength);
      hexStrLength = hexStr.length;
    }
    return resultArray;
  }

  async getRecipientPublicKey(
    XPI,
    chronik: ChronikClient,
    recipientAddress: string
  ): Promise<string | false> {
    let recipientAddressHash160: string;
    try {
      recipientAddressHash160 = XPI.Address.toHash160(recipientAddress);
    } catch (err) {
      console.log(
        `Error determining XPI.Address.toHash160(${recipientAddress} in getRecipientPublicKey())`,
        err
      );
    }

    let chronikTxHistoryAtAddress: TxHistoryPage;
    try {
      // Get 20 txs. If no outgoing txs in those 20 txs, just don't send the tx
      chronikTxHistoryAtAddress = await chronik
        .script('p2pkh', recipientAddressHash160)
        .history(/*page=*/ 0, /*page_size=*/ 20);
    } catch (err) {
      console.log(
        `Error getting await chronik.script('p2pkh', ${recipientAddressHash160}).history();`,
        err
      );
      throw new Error('Error fetching tx history to parse for public key');
    }

    let recipientPubKeyChronik;

    // Iterate over tx history to find an outgoing tx
    for (let i = 0; i < chronikTxHistoryAtAddress.txs.length; i += 1) {
      const { inputs } = chronikTxHistoryAtAddress.txs[i];
      for (let j = 0; j < inputs.length; j += 1) {
        const thisInput = inputs[j];
        const thisInputSendingHash160 = thisInput.outputScript;
        if (thisInputSendingHash160.includes(recipientAddressHash160)) {
          // Then this is an outgoing tx, you can get the public key from this tx
          // Get the public key
          try {
            recipientPubKeyChronik =
              chronikTxHistoryAtAddress.txs[i].inputs[j].inputScript.slice(-66);
          } catch (err) {
            throw new Error(
              'Cannot send an encrypted message to a wallet with no outgoing transactions'
            );
          }
          return recipientPubKeyChronik;
        }
      }
    }
    // You get here if you find no outgoing txs in the chronik tx history
    throw new Error(
      'Cannot send an encrypted message to a wallet with no outgoing transactions in the last 20 txs'
    );
  }

  async processDecryptMessageOnchain(
    outputScript,
    wallet,
    mnemonic,
    addressRecepient
  ): Promise<string> {
    const privateKeyWIF = await this.getPrivateWifKey(wallet, mnemonic);
    let chronikClient = null;
    if (wallet.coin === 'xpi') {
      chronikClient = new ChronikClient('https://chronik.be.cash/xpi');
    } else {
      chronikClient = new ChronikClient('https://chronik.be.cash/xec');
    }
    const pubKeyHex = await this.getRecipientPublicKey(
      this.bchjs,
      chronikClient,
      addressRecepient
    );
    const messageDecrypted = this.decryptMessageOnchain(
      outputScript,
      privateKeyWIF,
      pubKeyHex
    );
    return messageDecrypted;
  }

  async processEncryptMessageOnchain(
    plainText,
    wallet,
    mnemonic,
    addressRecepient
  ) {
    const privateKeyWIF = await this.getPrivateWifKey(wallet, mnemonic);
    let chronikClient = null;
    if (wallet.coin === 'xpi') {
      chronikClient = new ChronikClient('https://chronik.be.cash/xpi');
    } else {
      chronikClient = new ChronikClient('https://chronik.be.cash/xec');
    }
    let pubKeyHex = await this.getRecipientPublicKey(
      this.bchjs,
      chronikClient,
      addressRecepient
    );
    if (!pubKeyHex) {
      pubKeyHex = '';
    }
    const encryptedMessage = this.encryptMessageOnchain(
      privateKeyWIF,
      pubKeyHex,
      plainText
    );
    return encryptedMessage;
  }

  encryptMessageOnchain = (
    privateKeyWIF: string,
    recipientPubKeyHex: string,
    plainTextMsg: string
  ): Uint8Array => {
    let encryptedMsg;
    try {
      const sharedKey = this.createSharedKey(privateKeyWIF, recipientPubKeyHex);
      encryptedMsg = this.encrypt(sharedKey, Buffer.from(plainTextMsg));
    } catch (error) {
      console.log('ENCRYPTION ERROR', error);
      throw error;
    }

    return encryptedMsg;
  };

  decryptMessageOnchain(opReturnOutput, privateKeyWIF, publicKeyHex) {
    let attachedMsg = null;
    const opReturn = this.parseOpReturn(opReturnOutput);
    switch (opReturn[0]) {
      // unencrypted LotusChat
      case currency.opReturn.appPrefixesHex.lotusChat:
        attachedMsg = Buffer.from(opReturn[1], 'hex');
        break;
      case currency.opReturn.appPrefixesHex.lotusChatEncrypted:
        // attachedMsg = 'Not yet implemented chat encrypted';
        const sharedKey = this.createSharedKey(privateKeyWIF, publicKeyHex);
        const decryptedMessage = this.decrypt(
          sharedKey,
          Uint8Array.from(Buffer.from(opReturn[1], 'hex'))
        );
        attachedMsg = Buffer.from(decryptedMessage).toString('utf8');
        break;
      default:
        break;
    }
    return attachedMsg ? attachedMsg.toString() : null;
  }

  decrypt = (sharedKey: Buffer, cipherText: Uint8Array) => {
    // Split shared key
    const iv = forge.util.createBuffer(sharedKey.slice(0, 16));
    const key = forge.util.createBuffer(sharedKey.slice(16));

    // Encrypt entries
    const cipher = forge.cipher.createDecipher('AES-CBC', key);
    cipher.start({ iv });
    const rawBuffer = forge.util.createBuffer(cipherText);
    cipher.update(rawBuffer);
    cipher.finish();
    const plainText = Uint8Array.from(
      Buffer.from(cipher.output.toHex(), 'hex')
    );
    return plainText;
  };

  encrypt = (sharedKey: Buffer, plainText: Uint8Array) => {
    // Split shared key
    const iv = forge.util.createBuffer(sharedKey.slice(0, 16));
    const key = forge.util.createBuffer(sharedKey.slice(16));

    // Encrypt entries
    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv });
    const rawBuffer = forge.util.createBuffer(plainText);
    cipher.update(rawBuffer);
    cipher.finish();
    const cipherText = Uint8Array.from(
      Buffer.from(cipher.output.toHex(), 'hex')
    );

    return cipherText;
  };

  createSharedKey = (privateKeyWIF: string, publicKeyHex: string): Buffer => {
    const publicKeyObj = PublicKey.fromBuffer(Buffer.from(publicKeyHex, 'hex'));
    const privateKeyObj = PrivateKey.fromWIF(privateKeyWIF);

    const mergedKey = this.constructMergedKey(privateKeyObj, publicKeyObj);
    // const rawMergedKey = mergedKey.toBuffer(); // this function throws assertion error sometimes
    const rawMergedKey = this.publicKeyToBuffer(mergedKey);
    const sharedKey = this.crypto2.Hash.sha256(rawMergedKey);
    return sharedKey;
  };

  constructMergedKey = (privateKey, publicKey) => {
    return PublicKey.fromPoint(publicKey.point.mul(privateKey.toBigNumber()));
  };

  publicKeyToBuffer = pubKey => {
    const { x, y, compressed } = pubKey.toObject();
    let xBuf = Buffer.from(x, 'hex');
    let yBuf = Buffer.from(y, 'hex');
    let prefix;
    let buf;
    if (!compressed) {
      prefix = Buffer.from([0x04]);
      buf = Buffer.concat([prefix, xBuf, yBuf]);
    } else {
      let odd = yBuf[yBuf.length - 1] % 2;
      if (odd) {
        prefix = Buffer.from([0x03]);
      } else {
        prefix = Buffer.from([0x02]);
      }
      buf = Buffer.concat([prefix, xBuf]);
    }

    return buf;
  };
}
