// @flow
import React, { Component, PropTypes } from 'react';
import { observer } from 'mobx-react';
import { intlShape } from 'react-intl';
import Input from 'react-toolbox/lib/input/Input';
import globalMessages from '../../../i18n/global-messages';
import styles from './ReadOnlyInput.scss';

@observer
export default class ReadOnlyInput extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
  };

  render() {
    const {
      label,
      value,
      onClick,
    } = this.props;
    const { intl } = this.context;
    return (
      <div className={styles.component}>

        <Input
          className={styles.input}
          type="text"
          label={label}
          value={value}
          disabled
        />

        <button
          className={styles.button}
          onClick={onClick}
        >
          {intl.formatMessage(globalMessages.change)}
        </button>

      </div>
    );
  }

}
