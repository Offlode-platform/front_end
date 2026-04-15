declare module "qrcode" {
  export function toDataURL(
    text: string,
    options?: {
      width?: number;
      margin?: number;
      errorCorrectionLevel?: "L" | "M" | "Q" | "H" | string;
      color?: { dark?: string; light?: string };
    }
  ): Promise<string>;
}

