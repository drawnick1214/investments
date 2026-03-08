export interface BankOption {
  id: string;
  name: string;
}

export const COLOMBIAN_BANKS: BankOption[] = [
  { id: "bancolombia", name: "Bancolombia" },
  { id: "davivienda", name: "Davivienda" },
  { id: "bbva", name: "BBVA" },
  { id: "bogota", name: "Banco de Bogotá" },
  { id: "nequi", name: "Nequi" },
  { id: "nu", name: "Nu Colombia" },
  { id: "lulo", name: "Lulo Bank" },
  { id: "pibank", name: "Pibank" },
  { id: "scotiabank", name: "Scotiabank" },
  { id: "itau", name: "Itaú" },
  { id: "rappipay", name: "RappiPay" },
  { id: "popular", name: "Banco Popular" },
  { id: "occidente", name: "Banco de Occidente" },
  { id: "colpatria", name: "Scotiabank Colpatria" },
  { id: "falabella", name: "Banco Falabella" },
];

export interface ProductTypeOption {
  id: string;
  name_es: string;
  name_en: string;
}

export const SAVINGS_PRODUCT_TYPES: ProductTypeOption[] = [
  { id: "ahorro", name_es: "Cuenta de Ahorro", name_en: "Savings Account" },
  { id: "cdt", name_es: "CDT", name_en: "CDT (Term Deposit)" },
];
