export interface SerializedPropertyValue {
  value: string;
  valueJson: string;
}

/**
 * Send both the typed representation used by current bridges and the legacy
 * string representation understood by bridges before typed values existed.
 */
export function encodeSerializedPropertyValue(value: unknown): SerializedPropertyValue {
  if (value === undefined) {
    throw new Error("Component property value is required");
  }

  const valueJson = JSON.stringify(value);
  if (valueJson === undefined) {
    throw new Error("Component property value is not JSON serializable");
  }

  return {
    value: typeof value === "string" ? value : valueJson,
    valueJson,
  };
}
