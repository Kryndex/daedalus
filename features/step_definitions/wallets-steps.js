import { expect } from 'chai';
import {
  fillOutWalletSendForm,
  getWalletByName,
} from './lib/wallets-helpers';
import {
  waitUntilUrlEquals,
} from './lib/route-helpers'
import path from 'path';

const defaultWalletKeyFilePath = path.resolve(__dirname, '../support/default-wallet.key');

export default function () {

  this.Given(/^I have a wallet with funds$/, async function () {
    const result = await this.client.executeAsync(function(filePath, done) {
      // This assumes that we always have a default wallet on the backend!
      daedalus.api.importWalletFromKey({ filePath }).then((wallet) => {
        daedalus.stores.wallets.refreshWalletsData().then(() => done(wallet))
      });
    }, defaultWalletKeyFilePath);
    this.wallet = result.value;
    this.wallets = [this.wallet];
  });

  this.Given(/^I have the following wallets:$/, async function (table) {
    const result = await this.client.executeAsync(function(wallets, done) {
      window.Promise.all(wallets.map((wallet) => {
        return daedalus.api.createWallet({
          name: wallet.name,
          mnemonic: daedalus.api.generateMnemonic().join(' ')
        });
      }))
      .then(() => {
        daedalus.stores.wallets.walletsRequest.invalidate().execute().then(done);
      })
      .catch((error) => done(error.stack));
    }, table.hashes());
    // Add or set the wallets for this scenario
    if (this.wallets != null) {
      this.wallets.push(...result.value);
    } else {
      this.wallets = result.value;
    }
  });

  this.Given(/^I am on the "([^"]*)" wallet "([^"]*)" screen$/, async function (walletName, screen) {
    const wallet = getWalletByName.call(this, walletName);
    await this.navigateTo(`/wallets/${wallet.id}/${screen}`);
  });

  this.Given(/^I see the add wallet dialog$/, function () {
    return this.client.waitForVisible('.WalletAddDialog');
  });

  this.Given(/^I see the create wallet dialog$/, function () {
    return this.client.waitForVisible('.WalletCreateDialog');
  });

  this.Given(/^I dont see the create wallet dialog(?: anymore)?$/, function () {
    return this.client.waitForVisible('.WalletCreateDialog', null, true);
  });

  this.Given(/^the active wallet is "([^"]*)"$/, function (walletName) {
    const wallet = getWalletByName.call(this, walletName);
    this.client.execute(walletId => {
      daedalus.actions.setActiveWallet.trigger({ walletId });
    }, wallet.id);
  });

  this.When(/^I click on the create wallet button in add wallet dialog$/, function () {
    return this.waitAndClick('.WalletAddDialog .createWalletButton');
  });

  this.When(/^I click the wallet (.*) button$/, async function (buttonName) {
    const buttonSelector = `.WalletNavButton_component.${buttonName}`;
    await this.client.waitForVisible(buttonSelector);
    await this.client.click(buttonSelector);
  });

  this.When(/^I fill out the wallet send form with:$/, function (table) {
    return fillOutWalletSendForm.call(this, table.hashes()[0]);
  });

  this.When(/^I fill out the send form with a transaction to "([^"]*)" wallet:$/, function (walletName, table) {
    const values = table.hashes()[0];
    values.address = this.wallets.find((w) => w.name === walletName).address;
    return fillOutWalletSendForm.call(this, values);
  });

  this.When(/^I submit the wallet send form$/, async function () {
    const submitButton = '.WalletSendForm_submitButton';
    await this.client.waitForVisible(submitButton);
    return this.client.click(submitButton);
  });

  this.When(/^I submit the create wallet dialog with the following inputs:$/, async function (table) {
    const fields = table.hashes()[0];
    await this.client.setValue('.WalletCreateDialog .walletName input', fields.walletName);
    return this.client.click('.WalletCreateDialog .dialog_button');
  });

  this.When(/^I see the create wallet privacy dialog$/, function () {
    return this.client.waitForVisible('.WalletBackupPrivacyWarningDialog');
  });

  this.When(/^I click on "Please make sure nobody looks your screen" checkbox$/, function () {
    return this.waitAndClick('.WalletBackupPrivacyWarningDialog .CheckboxWithLongLabel_checkbox');
  });

  this.When(/^I submit the create wallet privacy dialog$/, function () {
    return this.waitAndClick('.WalletBackupPrivacyWarningDialog .dialog_button');
  });

  this.When(/^I see the create wallet recovery phrase display dialog$/, function () {
    return this.client.waitForVisible('.WalletRecoveryPhraseDisplayDialog');
  });

  this.When(/^I note down the recovery phrase$/, async function () {
    const recoveryPhrase = await this.client.getText('.WalletRecoveryPhraseMnemonic_component');
    this.recoveryPhrase = recoveryPhrase.split(' ');
  });

  this.When(/^I submit the create wallet recovery phrase display dialog$/, function () {
    return this.waitAndClick('.WalletRecoveryPhraseDisplayDialog .dialog_button');
  });

  this.When(/^I see the create wallet recovery phrase entry dialog$/, function () {
    return this.client.waitForVisible('.WalletRecoveryPhraseEntryDialog');
  });

  this.When(/^I click on recovery phrase mnemonics in correct order$/, async function () {
    for (let i = 0; i < this.recoveryPhrase.length; i++) {
      const recoveryPhraseMnemonic = this.recoveryPhrase[i];
      await this.waitAndClick(`//button[contains(text(), "${recoveryPhraseMnemonic}") and @class="MnemonicWord_component MnemonicWord_active"]`);
    }
  });

  this.When(/^I click on the "Accept terms" checkboxes$/, async function () {
    const termsCheckboxes = await this.client.elements('.CheckboxWithLongLabel_checkbox');
    for (let i = 0; i < termsCheckboxes.value.length; i++) {
      const termsCheckbox = termsCheckboxes.value[i].ELEMENT;
      await this.client.elementIdClick(termsCheckbox);
    }
  });

  this.When(/^I submit the create wallet recovery phrase entry dialog$/, function () {
    return this.waitAndClick('.WalletRecoveryPhraseEntryDialog .dialog_button');
  });

  this.Then(/^I should not see the create wallet recovery phrase entry dialog anymore$/, function () {
    return this.client.waitForVisible('.WalletRecoveryPhraseEntryDialog', null, true);
  });

  this.Then(/^I should have newly created "Test" wallet loaded$/, async function () {
    const result = await this.client.executeAsync(function(done) {
      daedalus.stores.wallets.walletsRequest.invalidate().execute().then(done);
    });
    // Add or set the wallets for this scenario
    if (this.wallets != null) {
      this.wallets.push(...result.value);
    } else {
      this.wallets = result.value;
    }
  });

  this.Then(/^I should be on some wallet page$/, async function () {
    return this.client.waitForVisible('.WalletNavigation_component');
  });

  this.Then(/^I should be on the "([^"]*)" wallet "([^"]*)" screen$/, async function (walletName, screenName) {
    const wallet = getWalletByName.call(this, walletName);
    return waitUntilUrlEquals.call(this, `/wallets/${wallet.id}/${screenName}`);
  });

  this.Then(/^I should see the following error messages on the wallet send form:$/, async function (data) {
    await this.client.waitForText('.WalletSendForm_component .input_error');
    let errorsOnScreen = await this.client.getText('.WalletSendForm_component .input_error');
    if (typeof errorsOnScreen === 'string') errorsOnScreen = [errorsOnScreen];
    const errors = data.hashes();
    for (let i = 0; i < errors.length; i++) {
      const expectedError = await this.intl(errors[i].message);
      expect(errorsOnScreen[i]).to.equal(expectedError);
    }
  });

  this.Then(/^the latest transaction should show:$/, async function (table) {
    const expectedData = table.hashes()[0];
    await this.client.waitForVisible('.Transaction_title');
    let transactionTitles = await this.client.getText('.Transaction_title');
    transactionTitles = [].concat(transactionTitles);
    const expectedTransactionTitle = await this.intl(expectedData.title);
    expect(expectedTransactionTitle).to.equal(transactionTitles[0]);
    let transactionAmounts = await this.client.getText('.Transaction_amount');
    transactionAmounts = [].concat(transactionAmounts);
    expect(expectedData.amount).to.include(transactionAmounts[0]);
  });

};
