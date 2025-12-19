// src/utils/safeConversion.ts

import { APIException } from "./exceptions";

/**
 * Converts a value to a float, checks the provided range,
 * and throws an APIException if the conversion fails or the value is out of range.
 *
 * @param value - The input value to convert.
 * @param paramName - The name of the parameter (for error messages).
 * @param minValue - Optional minimum allowed value.
 * @param maxValue - Optional maximum allowed value.
 * @returns The converted float value.
 * @throws APIException if the value cannot be converted to a number or is out of range.
 */
export const safeFloat = (
  value: any,
  paramName: string,
  minValue?: number | null,
  maxValue?: number | null
): number => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new APIException(
      `Invalid value for '${paramName}': Expected a float, got '${value}'.`,
      400,
      "INVALID_PARAMETER_TYPE"
    );
  }
  if (
    (minValue !== undefined && minValue !== null && num < minValue) ||
    (maxValue !== undefined && maxValue !== null && num > maxValue)
  ) {
    throw new APIException(
      `Parameter '${paramName}' out of range. Expected ${minValue} to ${maxValue}, got ${num}.`,
      400,
      "OUT_OF_RANGE"
    );
  }
  return num;
};

/**
 * Converts a value to an integer, checks the provided range,
 * and throws an APIException if the conversion fails or the value is out of range.
 *
 * @param value - The input value to convert.
 * @param paramName - The name of the parameter (for error messages).
 * @param minValue - Optional minimum allowed value.
 * @param maxValue - Optional maximum allowed value.
 * @returns The converted integer value.
 * @throws APIException if the value cannot be converted to an integer or is out of range.
 */
export const safeInt = (
  value: any,
  paramName: string,
  minValue?: number | null,
  maxValue?: number | null
): number => {
  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num)) {
    throw new APIException(
      `Invalid value for '${paramName}': Expected an integer, got '${value}'.`,
      400,
      "INVALID_PARAMETER_TYPE"
    );
  }
  if (
    (minValue !== undefined && minValue !== null && num < minValue) ||
    (maxValue !== undefined && maxValue !== null && num > maxValue)
  ) {
    throw new APIException(
      `Parameter '${paramName}' out of range. Expected ${minValue} to ${maxValue}, got ${num}.`,
      400,
      "OUT_OF_RANGE"
    );
  }
  return num;
};
