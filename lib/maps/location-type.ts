export interface LocationSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    place_id: number;
    address?: {
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export interface GeocodeResult {
    lat: number;
    lon: number;
    address: string;
}
