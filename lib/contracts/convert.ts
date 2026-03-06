import contract from "@/contracts/convert_contract.json";

const EXPECTED_REQUEST_FIELDS = [
  "fileKey",
  "originalFilename",
  "sizeBytes",
  "mimeType",
  "idempotencyKey",
] as const;

const EXPECTED_RESPONSE_FIELDS = [
  "markdown",
  "inputFormat",
  "detectedFormat",
  "warnings",
  "timings",
  "errorCode",
] as const;

const EXPECTED_ERROR_CODES = [
  "unsupported_format",
  "missing_dependency",
  "payload_too_large",
  "conversion_failed",
  "storage_read_failed",
  "timeout",
  "rate_limited",
  "invalid_file",
] as const;

export type ConvertRequestField = (typeof EXPECTED_REQUEST_FIELDS)[number];
export type ConvertResponseField = (typeof EXPECTED_RESPONSE_FIELDS)[number];
export type ConvertErrorCode = (typeof EXPECTED_ERROR_CODES)[number];

export type ConvertRequest = {
  fileKey: string;
  originalFilename: string;
  sizeBytes: number;
  mimeType: string;
  idempotencyKey: string;
};

export type ConvertResponse = {
  markdown: string;
  inputFormat: string;
  detectedFormat: string;
  warnings: string[];
  timings: Record<string, number>;
  errorCode: ConvertErrorCode | null;
};

function assertContractAlignment(): void {
  const sameFields = (left: readonly string[], right: readonly string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

  if (!sameFields(EXPECTED_REQUEST_FIELDS, contract.request.requiredFields)) {
    throw new Error("convert_contract.json request fields are out of sync");
  }

  if (!sameFields(EXPECTED_RESPONSE_FIELDS, contract.response.requiredFields)) {
    throw new Error("convert_contract.json response fields are out of sync");
  }

  if (!sameFields(EXPECTED_ERROR_CODES, contract.errorCodes)) {
    throw new Error("convert_contract.json error codes are out of sync");
  }
}

assertContractAlignment();

export const convertContract = contract;
export const CONVERT_REQUEST_FIELDS = EXPECTED_REQUEST_FIELDS;
export const CONVERT_RESPONSE_FIELDS = EXPECTED_RESPONSE_FIELDS;
export const CONVERT_ERROR_CODES = EXPECTED_ERROR_CODES;
