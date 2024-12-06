export interface AuthenticationResponse {
  authentication_token: string;
  session_key: string;
  user_id: string;
  display_name: string;
  public_ip: string;
  ice_servers: RTCIceServer[];
}
