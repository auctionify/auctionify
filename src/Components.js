import React, { Component, Fragment, useState, useRef } from 'react';
import {
  Row,
  Input,
  Label,
  InputGroup,
  InputGroupAddon,
  Col,
  Container,
  UncontrolledTooltip,
} from 'reactstrap';
import moment from 'moment';
import { BigNumber, toWei, fromWei, WEI_STEP } from './utils';
import ClickOutside from 'react-click-outside';
import InputMoment from 'input-moment';
export function Section(props) {
  let type = 'unstyled';

  if (props.top) type = 'top';
  if (props.bottom) type = 'bottom';
  if (props.middle) type = 'middle';

  return (
    <Row className="m-0 section">
      <Col className={`w-100 rounded-section ${type}`}>
        <Container className="p-0">
          <Row>{props.children}</Row>
        </Container>
      </Col>
    </Row>
  );
}

export const Fa = props => {
  const variants = ['s', 'r', 'l', 'b'];
  let className = props.className || '';
  className += ' icon fa';
  for (const v of variants) {
    if (!props[v]) continue;
    className += v;
    break;
  }
  className += ` fa-${props.icon}`;
  return <i className={className} id={props.id} />;
};

export const Inp = allProps => {
  const { invalid, ...props } = allProps;

  const [focused, setFocused] = useState(false);
  const ref = useRef();

  const onFocus = e => {
    setFocused(true);
    props.onFocus && props.onFocus(e);
  };

  const onBlur = e => {
    setFocused(false);
    props.onBlur && props.onBlur(e);
  };

  const focus = e => {
    ref.current.focus();
  };

  const upClass = focused || props.value ? 'up' : '';
  const validityClass = invalid === true ? 'is-invalid' : '';
  const focusedClass = focused ? 'focused' : '';
  const append = props.append ? (
    <InputGroupAddon addonType="append">
      <span className="input-group-text">{props.append}</span>
    </InputGroupAddon>
  ) : (
    ''
  );
  return (
    <div
      className={`input-container ${upClass} ${focusedClass} ${validityClass}`}>
      <Label className="inp-label" htmlFor={props.id || props.name}>
        {props.label}
      </Label>
      <InputGroup onClick={focus}>
        <Input
          {...props}
          id={props.id || props.name}
          innerRef={ref}
          onFocus={onFocus}
          onBlur={onBlur}>
          {props.children}
        </Input>
        {append}
      </InputGroup>
    </div>
  );
};

export const EthInp = allProps => {
  const { initialValue, onChange, min, ...props } = allProps;

  const [value, setValue] = useState(fromWei(initialValue || WEI_STEP));
  const [invalid, setInvalid] = useState(false);

  const handleWithError = e => {
    setInvalid(true);
    onChange({
      target: {
        name: e.target.name,
        value: e.target.value,
        invalid: true,
      },
    });
  };
  const onInputChange = e => {
    const value = e.target.value.trim();
    setValue(value);

    if (isNaN(value) || value === '') return handleWithError(e);

    let valueWei;
    try {
      valueWei = new BigNumber(toWei(value));
      if (min && valueWei.lt(min)) return handleWithError(e);
    } catch (_e) {
      return handleWithError(e);
    }
    setInvalid(false);
    onChange({
      target: {
        name: props.name,
        value: valueWei,
        invalid: false,
      },
    });
  };
  const onInputKeyDown = e => {
    if (invalid) return;
    const diff = WEI_STEP.clone();
    if (e.keyCode === 38) {
      // do nothing
    } else if (e.keyCode === 40) {
      diff.negative = 1;
    } else {
      return;
    }

    let valueWei = new BigNumber(toWei(value)).add(diff);
    if (min && valueWei.lt(min)) valueWei = min.clone();

    setValue(fromWei(valueWei));
    setInvalid(false);
    onChange({
      target: {
        name: props.name,
        value: valueWei,
        invalid: false,
      },
    });
  };
  return (
    <Inp
      autoComplete="off"
      append="Ξ"
      {...props}
      value={value}
      onChange={onInputChange}
      onKeyDown={onInputKeyDown}
      invalid={invalid}
    />
  );
};

export const Check = props => {
  return (
    <Fragment>
      <Input
        onChange={props.onChange}
        checked={props.checked}
        id={props.id || props.name}
        name={props.name}
        type="checkbox"
      />
      <label htmlFor={props.id || props.name}>
        <div className="switch">
          <Fa r icon="check" />
        </div>
      </label>
    </Fragment>
  );
};

export const HelpTip = props => {
  return (
    <Fragment>
      <Fa s icon="question-circle" id={props.id} className="tip" />
      <UncontrolledTooltip placement="top" target={props.id}>
        {props.children}
      </UncontrolledTooltip>
    </Fragment>
  );
};

export const DateInp = props => {
  const [date, setDate] = useState(props.initialValue || moment());
  const [pickerVisible, setPickedVisible] = useState(false);

  // this.inputElement = null;

  const onChange = moment => {
    if (props.onChange)
      props.onChange({
        target: {
          name: props.name,
          value: moment,
        },
      });
    setDate(moment);
    // this.inputElement.setState({
    //   value: this.value(),
    // });
  };

  const handleSave = () => {
    setPickedVisible(false);
  };

  const showPicker = e => {
    setPickedVisible(true);
  };

  const hidePicker = e => {
    setPickedVisible(false);
  };

  // ref={el => (this.inputElement = el)}
  return (
    <Fragment>
      <ClickOutside onClickOutside={handleSave}>
        <Inp
          onChange={props.onChange}
          value={date.format('lll')}
          name={props.name}
          id={props.id || props.name}
          placeholder={props.placeholder}
          onFocus={showPicker}
          label={props.label}
          append={props.append}
        />
        <div id="date-picker-container">
          <InputMoment
            moment={date}
            onChange={onChange}
            minStep={1}
            onSave={handleSave}
            id="datepicker"
            className={pickerVisible ? 'visible' : ''}
            prevMonthIcon="fa fa-angle-double-left"
            nextMonthIcon="fa fa-angle-double-right"
          />
        </div>
      </ClickOutside>
    </Fragment>
  );
};
