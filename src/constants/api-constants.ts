export const API_HOST = import.meta.env.VITE_API_HOST;
export const API_PATH = "/api";
export const API_VERSION = "/v1";

export const VERSION_ENDPOINT = "/game-version";
export const REGISTRATION_ENDPOINT = `/registration`;
export const REGISTRATION_OPTIONS_ENDPOINT = `${REGISTRATION_ENDPOINT}/options`;
export const VERIFY_REGISTRATION_RESPONSE_ENDPOINT = `${REGISTRATION_ENDPOINT}/response`;
export const AUTHENTICATION_ENDPOINT = `/authentication`;
export const AUTHENTICATION_OPTIONS_ENDPOINT = `${AUTHENTICATION_ENDPOINT}/options`;
export const VERIFY_AUTHENTICATION_RESPONSE_ENDPOINT = `${AUTHENTICATION_ENDPOINT}/response`;
export const CONFIGURATION_BLOB_ENDPOINT = "/game-configuration/encrypted";
export const WEBSOCKET_ENDPOINT = "/websocket";
export const MESSAGES_ENDPOINT = "/server-messages";
export const MATCHES_ENDPOINT = "/matches";
export const MATCHES_FIND_ENDPOINT = `${MATCHES_ENDPOINT}/find`;
export const MATCHES_ADVERTISE_ENDPOINT = `${MATCHES_ENDPOINT}/advertise`;
export const MATCHES_REMOVE_ENDPOINT = `${MATCHES_ENDPOINT}/owned`;
export const PLAYER_SCORES_PATH = "/player-scores";
