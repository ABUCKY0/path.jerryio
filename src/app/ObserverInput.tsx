import { TextField, TextFieldProps } from "@mui/material";
import { action } from "mobx"
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";
import { NumberInUnit, UnitConverter, UnitOfLength } from "../math/Unit";

export function parseNumberInString(value: string, uol: UnitOfLength,
  min = new NumberInUnit(-Infinity, UnitOfLength.Centimeter),
  max = new NumberInUnit(-Infinity, UnitOfLength.Centimeter)): number {
  const minInUOL = new UnitConverter(min.unit, uol).fromAtoB(min.value);
  const maxInUOL = new UnitConverter(max.unit, uol).fromAtoB(max.value);

  const valueInUOL = parseFloat(value);

  return parseFloat(Math.min(Math.max(valueInUOL, minInUOL), maxInUOL).toFixed(3));
}

const ObserverInput = observer((props: TextFieldProps & {
  getValue: () => string
  setValue: (value: string) => void
  isValidIntermediate: (candidate: string) => boolean
  isValidValue: (candidate: string) => boolean
  numeric?: boolean // default false
  allowEmpty?: boolean // default true
}
) => {
  // rest is used to send props to TextField without custom attributes
  const { getValue, setValue, isValidIntermediate, isValidValue, numeric: isNumeric, allowEmpty, ...rest } = props;

  const memoInitialValue = useMemo(() => getValue(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const inputRef = useRef<HTMLInputElement>(null);
  const initialValue = useRef(memoInitialValue);
  const lastValidIntermediate = useRef(memoInitialValue);

  function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const element = (event.nativeEvent.target as HTMLInputElement);
    const candidate = element.value;

    if (!isValidIntermediate(candidate)) {
      event.preventDefault();

      element.value = lastValidIntermediate.current;
    } else {
      lastValidIntermediate.current = candidate;
    }
  }

  function onInputConfirm(event: React.KeyboardEvent<HTMLInputElement>) {
    const element = (event.nativeEvent.target as HTMLInputElement);

    if (event.code === "Enter" || event.code === "NumpadEnter") {
      event.preventDefault();
      element.blur();
      onConfirm(event);
    } else if (isNumeric && event.code === "ArrowDown") {
      onConfirm(event);
      element.value = (parseFloat(getValue()) - 1) + "";
      onConfirm(event);
    } else if (isNumeric && event.code === "ArrowUp") {
      onConfirm(event);
      element.value = (parseFloat(getValue()) + 1) + "";
      onConfirm(event);
    }
  }

  function onConfirm(event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement, Event>) {
    const element = (event.nativeEvent.target as HTMLInputElement);
    const candidate = element.value;
    let rtn: string;

    if (isValidValue(candidate) === false || (allowEmpty !== false && candidate === "")) {
      element.value = rtn = initialValue.current;
    } else {
      rtn = candidate;
    }

    setValue(rtn);
    inputRef.current!.value = initialValue.current = lastValidIntermediate.current = getValue();
  }

  const value = getValue();

  useEffect(() => {
    const value = getValue();
    if (value !== initialValue.current) {
      initialValue.current = value;
      lastValidIntermediate.current = value;
      inputRef.current!.value = value;
    }
  }, [value, getValue]);

  return (
    <TextField
      id="outlined-size-small"
      InputLabelProps={{ shrink: true }}
      inputRef={inputRef}
      size="small"
      defaultValue={memoInitialValue}
      onChange={onChange}
      onKeyDown={action(onInputConfirm)}
      onBlur={action(onConfirm)}
      {...rest}
    />
  );
});

export { ObserverInput };