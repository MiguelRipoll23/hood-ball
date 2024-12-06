export const API_HTTP_PROTOCOL = "https://";
export const API_WS_PROTOCOL = "wss://";
export const API_HOSTNAME = "gameserver.deno.dev";
export const API_PATH = "/api";
export const API_VERSION = "/v1";

export const API_BASE_URL =
  API_HTTP_PROTOCOL + API_HOSTNAME + API_PATH + API_VERSION;

export const WEBSOCKET_BASE_URL =
  API_WS_PROTOCOL + API_HOSTNAME + API_PATH + API_VERSION;

export const VERSION_ENDPOINT = "/version";
export const CREDENTIAL_ENDPOINT = "/credential";
export const REGISTRATION_OPTIONS_ENDPOINT = `${CREDENTIAL_ENDPOINT}/registration-options`;
export const VERIFY_REGISTRATION_RESPONSE_ENDPOINT = `${CREDENTIAL_ENDPOINT}/registration-response/verify`;
export const AUTHENTICATION_OPTIONS_ENDPOINT = `${CREDENTIAL_ENDPOINT}/authentication-options`;
export const VERIFY_AUTHENTICATION_RESPONSE_ENDPOINT = `${CREDENTIAL_ENDPOINT}/authentication-response/verify`;
export const REGISTER_ENDPOINT = "/register";
export const CONFIGURATION_ENDPOINT = "/configuration";
export const WEBSOCKET_ENDPOINT = "/websocket";
export const MESSAGES_ENDPOINT = "/messages";
export const MATCHES_ENDPOINT = "/matches";
export const MATCHES_FIND_ENDPOINT = `${MATCHES_ENDPOINT}/find`;
export const MATCHES_ADVERTISE_ENDPOINT = `${MATCHES_ENDPOINT}/advertise`;
export const MATCHES_REMOVE_ENDPOINT = `${MATCHES_ENDPOINT}/remove`;
export const SCOREBOARD_PATH = "/scoreboard";
export const SCOREBOARD_SAVE_SCORE_PATH = `${SCOREBOARD_PATH}/saveScore`;
export const SCOREBOARD_GET_RANKING_PATH = `${SCOREBOARD_PATH}/getRanking`;
