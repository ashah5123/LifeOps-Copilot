/** Region option for signup: state/province + IANA timezone */

export interface RegionOption {
  value: string;
  label: string;
  tz: string;
}

export const US_STATES: RegionOption[] = [
  { value: "AL", label: "Alabama", tz: "America/Chicago" },
  { value: "AK", label: "Alaska", tz: "America/Anchorage" },
  { value: "AZ", label: "Arizona", tz: "America/Phoenix" },
  { value: "AR", label: "Arkansas", tz: "America/Chicago" },
  { value: "CA", label: "California", tz: "America/Los_Angeles" },
  { value: "CO", label: "Colorado", tz: "America/Denver" },
  { value: "CT", label: "Connecticut", tz: "America/New_York" },
  { value: "DE", label: "Delaware", tz: "America/New_York" },
  { value: "FL", label: "Florida", tz: "America/New_York" },
  { value: "GA", label: "Georgia", tz: "America/New_York" },
  { value: "HI", label: "Hawaii", tz: "Pacific/Honolulu" },
  { value: "ID", label: "Idaho", tz: "America/Boise" },
  { value: "IL", label: "Illinois", tz: "America/Chicago" },
  { value: "IN", label: "Indiana", tz: "America/Indiana/Indianapolis" },
  { value: "IA", label: "Iowa", tz: "America/Chicago" },
  { value: "KS", label: "Kansas", tz: "America/Chicago" },
  { value: "KY", label: "Kentucky", tz: "America/New_York" },
  { value: "LA", label: "Louisiana", tz: "America/Chicago" },
  { value: "ME", label: "Maine", tz: "America/New_York" },
  { value: "MD", label: "Maryland", tz: "America/New_York" },
  { value: "MA", label: "Massachusetts", tz: "America/New_York" },
  { value: "MI", label: "Michigan", tz: "America/Detroit" },
  { value: "MN", label: "Minnesota", tz: "America/Chicago" },
  { value: "MS", label: "Mississippi", tz: "America/Chicago" },
  { value: "MO", label: "Missouri", tz: "America/Chicago" },
  { value: "MT", label: "Montana", tz: "America/Denver" },
  { value: "NE", label: "Nebraska", tz: "America/Chicago" },
  { value: "NV", label: "Nevada", tz: "America/Los_Angeles" },
  { value: "NH", label: "New Hampshire", tz: "America/New_York" },
  { value: "NJ", label: "New Jersey", tz: "America/New_York" },
  { value: "NM", label: "New Mexico", tz: "America/Denver" },
  { value: "NY", label: "New York", tz: "America/New_York" },
  { value: "NC", label: "North Carolina", tz: "America/New_York" },
  { value: "ND", label: "North Dakota", tz: "America/Chicago" },
  { value: "OH", label: "Ohio", tz: "America/New_York" },
  { value: "OK", label: "Oklahoma", tz: "America/Chicago" },
  { value: "OR", label: "Oregon", tz: "America/Los_Angeles" },
  { value: "PA", label: "Pennsylvania", tz: "America/New_York" },
  { value: "RI", label: "Rhode Island", tz: "America/New_York" },
  { value: "SC", label: "South Carolina", tz: "America/New_York" },
  { value: "SD", label: "South Dakota", tz: "America/Chicago" },
  { value: "TN", label: "Tennessee", tz: "America/Chicago" },
  { value: "TX", label: "Texas", tz: "America/Chicago" },
  { value: "UT", label: "Utah", tz: "America/Denver" },
  { value: "VT", label: "Vermont", tz: "America/New_York" },
  { value: "VA", label: "Virginia", tz: "America/New_York" },
  { value: "WA", label: "Washington", tz: "America/Los_Angeles" },
  { value: "WV", label: "West Virginia", tz: "America/New_York" },
  { value: "WI", label: "Wisconsin", tz: "America/Chicago" },
  { value: "WY", label: "Wyoming", tz: "America/Denver" },
  { value: "DC", label: "Washington D.C.", tz: "America/New_York" },
];

const IN_KOL = "Asia/Kolkata";
export const INDIA_STATES: RegionOption[] = [
  ["AP", "Andhra Pradesh"],
  ["AR", "Arunachal Pradesh"],
  ["AS", "Assam"],
  ["BR", "Bihar"],
  ["CG", "Chhattisgarh"],
  ["GA", "Goa"],
  ["GJ", "Gujarat"],
  ["HR", "Haryana"],
  ["HP", "Himachal Pradesh"],
  ["JH", "Jharkhand"],
  ["KA", "Karnataka"],
  ["KL", "Kerala"],
  ["MP", "Madhya Pradesh"],
  ["MH", "Maharashtra"],
  ["MN", "Manipur"],
  ["ML", "Meghalaya"],
  ["MZ", "Mizoram"],
  ["NL", "Nagaland"],
  ["OR", "Odisha"],
  ["PB", "Punjab"],
  ["RJ", "Rajasthan"],
  ["SK", "Sikkim"],
  ["TN", "Tamil Nadu"],
  ["TS", "Telangana"],
  ["TR", "Tripura"],
  ["UP", "Uttar Pradesh"],
  ["UT", "Uttarakhand"],
  ["WB", "West Bengal"],
  ["AN", "Andaman and Nicobar Islands"],
  ["CH", "Chandigarh"],
  ["DH", "Dadra and Nagar Haveli and Daman and Diu"],
  ["DL", "Delhi"],
  ["JK", "Jammu and Kashmir"],
  ["LA", "Ladakh"],
  ["LD", "Lakshadweep"],
  ["PY", "Puducherry"],
].map(([value, label]) => ({ value, label, tz: IN_KOL }));

export const CANADA_PROVINCES: RegionOption[] = [
  { value: "AB", label: "Alberta", tz: "America/Edmonton" },
  { value: "BC", label: "British Columbia", tz: "America/Vancouver" },
  { value: "MB", label: "Manitoba", tz: "America/Winnipeg" },
  { value: "NB", label: "New Brunswick", tz: "America/Moncton" },
  { value: "NL", label: "Newfoundland and Labrador", tz: "America/St_Johns" },
  { value: "NS", label: "Nova Scotia", tz: "America/Halifax" },
  { value: "NT", label: "Northwest Territories", tz: "America/Yellowknife" },
  { value: "NU", label: "Nunavut", tz: "America/Iqaluit" },
  { value: "ON", label: "Ontario", tz: "America/Toronto" },
  { value: "PE", label: "Prince Edward Island", tz: "America/Halifax" },
  { value: "QC", label: "Quebec", tz: "America/Toronto" },
  { value: "SK", label: "Saskatchewan", tz: "America/Regina" },
  { value: "YT", label: "Yukon", tz: "America/Whitehorse" },
];

export const UK_REGIONS: RegionOption[] = [
  { value: "ENG", label: "England", tz: "Europe/London" },
  { value: "SCT", label: "Scotland", tz: "Europe/London" },
  { value: "WLS", label: "Wales", tz: "Europe/London" },
  { value: "NIR", label: "Northern Ireland", tz: "Europe/London" },
];

export const AUSTRALIA_STATES: RegionOption[] = [
  { value: "NSW", label: "New South Wales", tz: "Australia/Sydney" },
  { value: "VIC", label: "Victoria", tz: "Australia/Melbourne" },
  { value: "QLD", label: "Queensland", tz: "Australia/Brisbane" },
  { value: "WA", label: "Western Australia", tz: "Australia/Perth" },
  { value: "SA", label: "South Australia", tz: "Australia/Adelaide" },
  { value: "TAS", label: "Tasmania", tz: "Australia/Hobart" },
  { value: "ACT", label: "Australian Capital Territory", tz: "Australia/Sydney" },
  { value: "NT", label: "Northern Territory", tz: "Australia/Darwin" },
];

export const GERMANY_STATES: RegionOption[] = [
  { value: "BW", label: "Baden-Württemberg", tz: "Europe/Berlin" },
  { value: "BY", label: "Bavaria", tz: "Europe/Berlin" },
  { value: "BE", label: "Berlin", tz: "Europe/Berlin" },
  { value: "BB", label: "Brandenburg", tz: "Europe/Berlin" },
  { value: "HB", label: "Bremen", tz: "Europe/Berlin" },
  { value: "HH", label: "Hamburg", tz: "Europe/Berlin" },
  { value: "HE", label: "Hesse", tz: "Europe/Berlin" },
  { value: "MV", label: "Mecklenburg-Vorpommern", tz: "Europe/Berlin" },
  { value: "NI", label: "Lower Saxony", tz: "Europe/Berlin" },
  { value: "NW", label: "North Rhine-Westphalia", tz: "Europe/Berlin" },
  { value: "RP", label: "Rhineland-Palatinate", tz: "Europe/Berlin" },
  { value: "SL", label: "Saarland", tz: "Europe/Berlin" },
  { value: "SN", label: "Saxony", tz: "Europe/Berlin" },
  { value: "ST", label: "Saxony-Anhalt", tz: "Europe/Berlin" },
  { value: "SH", label: "Schleswig-Holstein", tz: "Europe/Berlin" },
  { value: "TH", label: "Thuringia", tz: "Europe/Berlin" },
];

/** Fallback when country has no subdivisions in our dataset */
export const OTHER_REGION: RegionOption[] = [
  { value: "XX", label: "Not listed / Other", tz: "UTC" },
];

export const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "IN", label: "India" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "OTHER", label: "Other" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function getRegionsForCountry(countryCode: string): RegionOption[] {
  switch (countryCode) {
    case "US":
      return US_STATES;
    case "IN":
      return INDIA_STATES;
    case "CA":
      return CANADA_PROVINCES;
    case "GB":
      return UK_REGIONS;
    case "AU":
      return AUSTRALIA_STATES;
    case "DE":
      return GERMANY_STATES;
    case "OTHER":
      return OTHER_REGION;
    default:
      return [];
  }
}
