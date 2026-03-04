export interface Region {
  region_id: string;
  display_name: string;
}

export const REGIONS: Region[] = [
  { region_id: "tel-aviv-yafo", display_name: "Tel Aviv-Yafo" },
  { region_id: "jerusalem", display_name: "Jerusalem" },
  { region_id: "herzliya", display_name: "Herzliya" },
  { region_id: "raanana", display_name: "Raanana" },
  { region_id: "kfar-saba", display_name: "Kfar Saba" },
  { region_id: "holon", display_name: "Holon" },
  { region_id: "ramat-gan", display_name: "Ramat Gan" },
  { region_id: "givatayim", display_name: "Givatayim" },
  { region_id: "petah-tikva", display_name: "Petah Tikva" },
  { region_id: "netanya", display_name: "Netanya" },
  { region_id: "ashdod", display_name: "Ashdod" },
  { region_id: "ashkelon", display_name: "Ashkelon" },
  { region_id: "haifa", display_name: "Haifa" },
  { region_id: "beer-sheva", display_name: "Be'er Sheva" }
];

export const getRegions = (): Region[] => REGIONS;

export const isSupportedRegionId = (regionId: string): boolean =>
  REGIONS.some((region) => region.region_id === regionId);

