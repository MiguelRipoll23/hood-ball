import { GameController } from "../models/game-controller.js";
import { GamePlayer } from "../models/game-player.js";
import { MatchmakingService } from "./matchmaking-service.js";
import { ObjectOrchestrator } from "./object-orchestrator-service.js";
import { EventProcessorService } from "./event-processor-service.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { WebRTCService } from "./webrtc-service.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";

export class WebRTCPeerService implements WebRTCPeer {
  private matchmakingService: MatchmakingService;
  private webRTCService: WebRTCService;
  private objectOrchestrator: ObjectOrchestrator;
  private eventProcessorService: EventProcessorService;

  private peerConnection: RTCPeerConnection;
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];
  private dataChannels: Record<string, RTCDataChannel> = {};
  private connected = false;

  private messageQueue: Array<{
    channelKey: string;
    arrayBuffer: ArrayBuffer;
  }> = [];

  private host: boolean = false;
  private player: GamePlayer | null = null;
  private joined: boolean = false;

  private pingStartTime: number | null = null;
  private pingRoundTripTime: number = 0;

  private downloadBytesPerSecond: number = 0;
  private uploadBytesPerSecond: number = 0;

  constructor(private gameController: GameController, private token: string) {
    this.matchmakingService = this.gameController.getMatchmakingService();
    this.webRTCService = this.gameController.getWebRTCService();
    this.objectOrchestrator = this.gameController.getObjectOrchestrator();
    this.eventProcessorService = this.gameController.getEventProcessorService();

    this.host =
      this.gameController.getGameState().getMatch()?.isHost() ?? false;

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.gameController
        ?.getGameState()
        ?.getGameServer()
        ?.getServerRegistration()
        ?.getRTCIceServers(),
    });

    if (this.host === false) {
      this.initializeDataChannels();
    }

    this.addEventListeners();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getToken(): string {
    return this.token;
  }

  public getName(): string {
    return this.player?.getName() ?? this.token;
  }

  public getPlayer(): GamePlayer | null {
    return this.player;
  }

  public setPlayer(player: GamePlayer): void {
    this.player = player;
  }

  public hasJoined() {
    return this.joined;
  }

  public setJoined(joined: boolean) {
    this.joined = joined;
    if (joined) {
      this.sendQueuedMessages();
    }
  }

  public getDownloadBytes(): number {
    return this.downloadBytesPerSecond;
  }

  public getUploadBytes(): number {
    return this.uploadBytesPerSecond;
  }

  public resetNetworkStats(): void {
    this.downloadBytesPerSecond = 0;
    this.uploadBytesPerSecond = 0;
  }

  public addRemoteIceCandidate(iceCandidate: RTCIceCandidateInit): void {
    this.processIceCandidate(iceCandidate, false);
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async createAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async connect(answer: RTCSessionDescriptionInit): Promise<void> {
    console.info("Connecting to peer...", answer);

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    this.iceCandidatesQueue.forEach((candidate) =>
      this.processIceCandidate(candidate, true)
    );

    this.iceCandidatesQueue = [];

    this.iceCandidatesQueue.forEach((candidate) => {
      this.webRTCService.sendIceCandidate(this.token, candidate);
    });
  }

  public mustPing(): boolean {
    return this.pingStartTime === null;
  }

  public getPingTime(): number {
    // Calculate ping round trip time
    if (this.pingStartTime === null) {
      return this.pingRoundTripTime;
    }

    // Current ping round trip time
    return performance.now() - this.pingStartTime;
  }

  public disconnectGracefully(): void {
    this.connected = false;
    this.sendDisconnectMessage();
  }

  public disconnect(): void {
    this.peerConnection.close();
  }

  public sendReliableOrderedMessage(
    arrayBuffer: ArrayBuffer,
    skipQueue = false
  ): void {
    this.sendMessage("reliable-ordered", arrayBuffer, skipQueue);
  }

  public sendReliableUnorderedMessage(
    arrayBuffer: ArrayBuffer,
    skipQueue = false
  ): void {
    this.sendMessage("reliable-unordered", arrayBuffer, skipQueue);
  }

  public sendUnreliableOrderedMessage(arrayBuffer: ArrayBuffer): void {
    if (this.joined === false) {
      return;
    }

    this.sendMessage("unreliable-ordered", arrayBuffer, true);
  }

  public sendUnreliableUnorderedMessage(arrayBuffer: ArrayBuffer): void {
    if (this.joined === false) {
      return;
    }

    this.sendMessage("unreliable-unordered", arrayBuffer, true);
  }

  public sendPingRequest(): void {
    const arrayBuffer = new ArrayBuffer(1);
    const dataView = new DataView(arrayBuffer);
    dataView.setInt8(0, WebRTCType.PingRequest);

    this.pingStartTime = performance.now();
    this.sendReliableOrderedMessage(arrayBuffer);
  }

  private initializeDataChannels(): void {
    this.dataChannels = {
      "reliable-ordered": this.peerConnection.createDataChannel(
        "reliable-ordered",
        { ordered: true }
      ),
      "reliable-unordered": this.peerConnection.createDataChannel(
        "reliable-unordered",
        { ordered: false }
      ),
      "unreliable-ordered": this.peerConnection.createDataChannel(
        "unreliable-ordered",
        { ordered: true, maxRetransmits: 0 }
      ),
      "unreliable-unordered": this.peerConnection.createDataChannel(
        "unreliable-unordered",
        { ordered: false, maxRetransmits: 0 }
      ),
    };
  }

  private addEventListeners(): void {
    this.addConnectionListeners();
    this.addIceListeners();
    this.addDataChannelListeners();
  }

  private addConnectionListeners(): void {
    this.peerConnection.onconnectionstatechange = () =>
      this.handleConnectionStateChange();
  }

  private handleConnectionStateChange(): void {
    console.info("Peer connection state:", this.peerConnection.connectionState);

    switch (this.peerConnection.connectionState) {
      case "connected":
        this.handleConnection();
        break;
      case "disconnected":
      case "failed":
      case "closed":
        this.handleDisconnection();
        break;
    }
  }

  private handleConnection(): void {
    console.info("Peer connection established");
    this.connected = true;
  }

  private handleDisconnection(): void {
    console.info("Peer connection closed");
    this.gameController.getWebRTCService().removePeer(this.token);

    // If the peer was connected, notify the matchmaking service
    if (this.connected) {
      this.connected = false;
      this.matchmakingService.onPeerDisconnected(this);
    }
  }

  private addIceListeners(): void {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.queueOrProcessIceCandidate(event.candidate.toJSON());
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.info(
        "ICE connection state:",
        this.peerConnection.iceConnectionState
      );
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.info(
        "ICE gathering state:",
        this.peerConnection.iceGatheringState
      );
    };

    this.peerConnection.onicecandidateerror = (event) => {
      console.error("ICE candidate error", event);
    };
  }

  private addDataChannelListeners(): void {
    if (this.host) {
      // If the instance is not the host, listen for the data channels from the host
      this.peerConnection.ondatachannel = (event) => {
        const channel = event.channel;
        this.dataChannels[channel.label] = channel;
        this.setupDataChannelListeners(channel);
      };
    } else {
      // For the non-host, set up listeners for already created channels
      Object.values(this.dataChannels).forEach((channel) => {
        this.setupDataChannelListeners(channel);
      });
    }
  }

  private setupDataChannelListeners(channel: RTCDataChannel): void {
    channel.binaryType = "arraybuffer";

    channel.onopen = () => this.handleDataChannelOpen(channel.label);
    channel.onerror = (error) =>
      this.handleDataChannelError(channel.label, error);
    channel.onmessage = (event) =>
      this.handleMessage(channel.label, event.data);
  }

  private handleDataChannelOpen(label: string): void {
    console.info(`Data channel ${label} opened`);

    if (this.host === false && this.areAllDataChannelsOpen()) {
      this.matchmakingService.onPeerConnected(this);
    }
  }

  private areAllDataChannelsOpen(): boolean {
    return Object.values(this.dataChannels).every(
      (channel) => channel.readyState === "open"
    );
  }

  private handleDataChannelError(label: string, error: Event): void {
    console.error(`Data channel ${label} error`, error);
  }

  private queueOrProcessIceCandidate(iceCandidate: RTCIceCandidateInit): void {
    if (this.peerConnection.remoteDescription) {
      this.processIceCandidate(iceCandidate, true);
    } else {
      this.iceCandidatesQueue.push(iceCandidate);
      console.info("Queued ICE candidate", iceCandidate);
    }

    this.webRTCService.sendIceCandidate(this.token, iceCandidate);
  }

  private async processIceCandidate(
    iceCandidate: RTCIceCandidateInit,
    local: boolean
  ): Promise<void> {
    const type = local ? "local" : "remote";

    try {
      await this.peerConnection.addIceCandidate(iceCandidate);
      console.info(`Added ${type} ICE candidate`, iceCandidate);
    } catch (error) {
      console.error(`Error adding ${type} ICE candidate`, error);
    }
  }

  private sendMessage(
    channelKey: string,
    arrayBuffer: ArrayBuffer,
    skipQueue = false
  ): void {
    const shouldSendImmediately = this.joined || skipQueue;

    if (shouldSendImmediately === false) {
      this.queueMessage(channelKey, arrayBuffer);
      return;
    }

    const channel = this.dataChannels[channelKey];

    if (!this.isChannelAvailable(channel, channelKey)) {
      return;
    }

    try {
      channel.send(arrayBuffer);

      // Update upload stats
      this.uploadBytesPerSecond += arrayBuffer.byteLength;

      // Log the message if debugging and the channel is reliable
      const isReliableChannel = channel.label.startsWith("reliable");

      if (this.isLoggingEnabled() && isReliableChannel) {
        console.debug(
          `%cSent message to peer ${this.getName()}:\n` +
            BinaryWriter.preview(arrayBuffer),
          "color: purple;"
        );
      }
    } catch (error) {
      console.error(`Error sending ${channelKey} message to peer`, error);
    }
  }

  private queueMessage(channelKey: string, arrayBuffer: ArrayBuffer): void {
    this.messageQueue.push({ channelKey, arrayBuffer });

    if (channelKey.startsWith("reliable")) {
      console.debug("Queued message", channelKey, new Uint8Array(arrayBuffer));
    }
  }

  private isChannelAvailable(
    channel: RTCDataChannel | undefined,
    channelKey: string
  ): channel is RTCDataChannel {
    if (!channel) {
      console.warn(`Data channel not found for key: ${channelKey}`);
      return false;
    }

    if (channel.readyState !== "open") {
      return false;
    }

    return true;
  }

  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const { channelKey, arrayBuffer } = this.messageQueue.shift()!;
      this.sendMessage(channelKey, arrayBuffer, true);
    }
  }

  private handleMessage(channelLabel: string, arrayBuffer: ArrayBuffer): void {
    // Update download stats
    this.downloadBytesPerSecond += arrayBuffer.byteLength;

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const isReliableChannel = channelLabel.startsWith("reliable");

    if (this.isLoggingEnabled() && isReliableChannel) {
      console.debug(
        `%cReceived message from peer ${this.getName()}:\n` +
          binaryReader.preview(),
        "color: green;"
      );
    }

    const typeId = binaryReader.unsignedInt8();

    if (this.isInvalidStateForId(typeId)) {
      return console.warn("Invalid player state for message", typeId);
    }

    switch (typeId) {
      case WebRTCType.JoinRequest:
        this.matchmakingService.handleJoinRequest(this);
        break;

      case WebRTCType.JoinResponse:
        this.matchmakingService.handleJoinResponse(this, binaryReader);
        break;

      case WebRTCType.PlayerConnection:
        this.matchmakingService.handlePlayerConnection(this, binaryReader);
        break;

      case WebRTCType.SnapshotEnd:
        this.matchmakingService.handleSnapshotEnd(this);
        break;

      case WebRTCType.SnapshotACK:
        this.matchmakingService.handleSnapshotACK(this);
        break;

      case WebRTCType.ObjectData:
        this.objectOrchestrator.handleObjectData(this, binaryReader);
        break;

      case WebRTCType.EventData:
        this.eventProcessorService.handleEventData(this, binaryReader);
        break;

      case WebRTCType.GracefulDisconnect:
        this.handleGracefulDisconnect();
        break;

      case WebRTCType.PingRequest:
        this.handlePingRequest();
        break;

      case WebRTCType.PingResponse:
        this.handlePingResponse();
        break;

      case WebRTCType.PlayerPing:
        this.matchmakingService.handlePlayerPing(this.host, binaryReader);
        break;

      default: {
        console.warn("Unknown message type identifier", typeId);
      }
    }
  }

  private isInvalidStateForId(id: number): boolean {
    if (this.joined) {
      return false;
    }

    return id > WebRTCType.SnapshotACK;
  }

  private sendDisconnectMessage(): void {
    const arrayBuffer = new ArrayBuffer(1);

    const dataView = new DataView(arrayBuffer);
    dataView.setUint8(0, WebRTCType.GracefulDisconnect);

    this.sendReliableOrderedMessage(arrayBuffer);
    console.log("Disconnect message sent");
  }

  private handleGracefulDisconnect(): void {
    console.log("Received graceful disconnect message");
    this.connected = false;
    this.disconnect();
  }

  private handlePingRequest(): void {
    const arrayBuffer = new ArrayBuffer(1);
    const dataView = new DataView(arrayBuffer);
    dataView.setUint8(0, WebRTCType.PingResponse);

    this.sendReliableOrderedMessage(arrayBuffer);
  }

  private handlePingResponse(): void {
    if (this.pingStartTime === null) {
      return;
    }

    this.pingRoundTripTime = performance.now() - this.pingStartTime;
    this.pingStartTime = null;
  }

  private isLoggingEnabled(): boolean {
    return this.gameController.getDebugSettings().isWebRTCLoggingEnabled();
  }
}
