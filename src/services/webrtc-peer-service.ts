import { GamePlayer } from "../models/game-player.js";
import type { PeerConnectionDelegate } from "../interfaces/peer-connection-delegate.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import type { IWebRTCService } from "../interfaces/services/webrtc-service-interface.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import { ServiceLocator } from "./service-locator.js";
import { GameState } from "../models/game-state.js";

export class WebRTCPeerService implements WebRTCPeer {
  private SEQUENCE_MAXIMUM = 65535;
  private SEQUENCE_PAST_WINDOW = (this.SEQUENCE_MAXIMUM + 1) / 2;
  private SEQUENCE_FUTURE_WINDOW = 32;

  private delegate: PeerConnectionDelegate;
  private webrtcDelegate: IWebRTCService;
  private peerConnection: RTCPeerConnection;
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];
  private dataChannels: Record<string, RTCDataChannel> = {};
  private connected = false;

  private incomingReliableSequence = this.SEQUENCE_MAXIMUM;
  private incomingUnreliableSequence = this.SEQUENCE_MAXIMUM;
  private outgoingReliableSequence = 0;
  private outgoingUnreliableSequence = 0;

  private host: boolean = false;
  private player: GamePlayer | null = null;
  private joined: boolean = false;

  private pingRequestTime: number | null = null;
  private pingTime: number | null = null;

  private downloadBytesPerSecond: number = 0;
  private uploadBytesPerSecond: number = 0;

  private messageQueue: Array<{
    channelKey: string;
    arrayBuffer: ArrayBuffer;
  }> = [];

  constructor(
    private token: string,
    webrtcDelegate: IWebRTCService,
    delegate: PeerConnectionDelegate,
    private gameState = ServiceLocator.get(GameState)
  ) {
    this.delegate = delegate;
    this.webrtcDelegate = webrtcDelegate;

    this.host = gameState.getMatch()?.isHost() ?? false;

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.gameState
        ?.getGameServer()
        ?.getServerRegistration()
        ?.getRTCIceServers(),
    });

    if (this.host === false) {
      this.initializeDataChannels();
    }

    this.addEventListeners();
  }

  public getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState;
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

  public getPingRequestTime(): number | null {
    return this.pingRequestTime;
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

    this.iceCandidatesQueue.forEach((candidate) => {
      this.processIceCandidate(candidate, true);
      this.webrtcDelegate.sendIceCandidate(this.token, candidate);
    });

    this.iceCandidatesQueue = [];
  }

  public getPingTime(): number | null {
    return this.pingTime;
  }

  public setPingTime(pingTime: number | null): void {
    this.pingTime = pingTime;
    this.player?.setPingTime(pingTime);
  }

  public disconnectGracefully(): void {
    this.connected = false;
    this.sendDisconnectMessage();
  }

  public disconnect(graceful = false): void {
    if (graceful) {
      this.connected = false;
    }

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
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(WebRTCType.PingRequest)
      .toArrayBuffer();

    this.sendUnreliableUnorderedMessage(arrayBuffer);
    this.pingRequestTime = performance.now();
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
    this.webrtcDelegate.removePeer(this.token);

    // If the peer was connected, notify the matchmaking service
    if (this.connected) {
      this.connected = false;
      this.delegate.onPeerDisconnected(this);
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
      this.delegate.onPeerConnected(this);
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

    this.webrtcDelegate.sendIceCandidate(this.token, iceCandidate);
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
    // Queue message if the peer has not joined, unless skipQueue is true
    const mustQueueMessage = !this.joined && !skipQueue;

    if (channelKey.startsWith("reliable") && mustQueueMessage) {
      this.queueMessage(channelKey, arrayBuffer);
      return;
    }

    const channel = this.dataChannels[channelKey];

    if (!this.isChannelAvailable(channel, channelKey)) {
      return;
    }

    // For unordered channels, prepend the sequence number
    if (channel.label.endsWith("unordered")) {
      arrayBuffer = this.insertSequenceToMessageHeader(
        channel.label,
        arrayBuffer
      );
    }

    try {
      channel.send(arrayBuffer);
    } catch (error) {
      console.error(`Error sending ${channelKey} message to peer`, error);
      return;
    }

    // Update upload stats
    this.uploadBytesPerSecond += arrayBuffer.byteLength;

    // Increment the outgoing sequence number if the channel is unordered
    this.incrementOutgoingSequenceIfUnordered(channel.label);

    // Log the message if debugging and the channel is reliable
    const isReliableChannel = channel.label.startsWith("reliable");

    if (isReliableChannel) {
      this.logOutgoingReliableMessage(channel.label, arrayBuffer);
    }
  }

  private queueMessage(channelKey: string, arrayBuffer: ArrayBuffer): void {
    this.messageQueue.push({ channelKey, arrayBuffer });
    this.logOutgoingQueuedReliableMessage(channelKey, arrayBuffer);
  }

  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const { channelKey, arrayBuffer } = this.messageQueue.shift()!;
      this.sendMessage(channelKey, arrayBuffer, true);
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

  private insertSequenceToMessageHeader(
    channelKey: string,
    arrayBuffer: ArrayBuffer
  ): ArrayBuffer {
    const sequence = channelKey.startsWith("reliable")
      ? this.outgoingReliableSequence
      : this.outgoingUnreliableSequence;

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const commandId = binaryReader.unsignedInt8();

    return BinaryWriter.build(arrayBuffer.byteLength + 2)
      .unsignedInt8(commandId)
      .unsignedInt16(sequence) // sequence number
      .bytes(binaryReader.bytesAsUint8Array()) // rest of the message
      .toArrayBuffer();
  }

  private logOutgoingQueuedReliableMessage(
    channelKey: string,
    arrayBuffer: ArrayBuffer
  ): void {
    if (this.isLoggingEnabled()) {
      console.debug(
        `%cQueued ${channelKey} message for peer ${this.getName()}:\n` +
          BinaryWriter.preview(arrayBuffer),
        "color: orange;"
      );
    }
  }

  private logOutgoingReliableMessage(
    channelKey: string,
    arrayBuffer: ArrayBuffer
  ): void {
    if (this.isLoggingEnabled()) {
      console.debug(
        `%cSent ${channelKey} message to peer ${this.getName()}:\n` +
          BinaryWriter.preview(arrayBuffer),
        "color: purple;"
      );
    }
  }

  private incrementOutgoingSequenceIfUnordered(channelLabel: string) {
    if (channelLabel === "reliable-unordered") {
      this.outgoingReliableSequence =
        (this.outgoingReliableSequence + 1) & this.SEQUENCE_MAXIMUM;
    } else if (channelLabel === "unreliable-unordered") {
      this.outgoingUnreliableSequence =
        (this.outgoingUnreliableSequence + 1) & this.SEQUENCE_MAXIMUM;
    }
  }

  private handleMessage(channelLabel: string, arrayBuffer: ArrayBuffer): void {
    // Update download stats
    this.downloadBytesPerSecond += arrayBuffer.byteLength;

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    if (channelLabel.startsWith("reliable")) {
      this.logIncomingReliableMessage(channelLabel, arrayBuffer);
    }

    const commandId = binaryReader.unsignedInt8();

    if (
      this.isInvalidStateForCommandId(commandId) ||
      this.isInvalidSequence(channelLabel, binaryReader)
    ) {
      return;
    }

    try {
      this.webrtcDelegate.dispatchCommand(commandId, this, binaryReader);
    } catch (error) {
      console.error(
        `Error executing command handler for ID ${commandId} from peer ${this.getName()}:`,
        error
      );
    }
  }

  private logIncomingReliableMessage(
    channelLabel: string,
    arrayBuffer: ArrayBuffer
  ): void {
    if (this.isLoggingEnabled()) {
      console.debug(
        `%cReceived ${channelLabel} message from peer ${this.getName()}:\n` +
          BinaryWriter.preview(arrayBuffer),
        "color: green;"
      );
    }
  }

  private isInvalidSequence(
    channelLabel: string,
    binaryReader: BinaryReader
  ): boolean {
    if (channelLabel.endsWith("-ordered")) {
      return false;
    }

    const sequenceNumber = binaryReader.unsignedInt16();
    const isReliable = channelLabel.startsWith("reliable");

    const currentSequence = isReliable
      ? this.incomingReliableSequence
      : this.incomingUnreliableSequence;

    const maxFuture =
      (currentSequence + this.SEQUENCE_FUTURE_WINDOW) & this.SEQUENCE_MAXIMUM;

    const inFuture =
      this.sequenceGreaterThan(sequenceNumber, currentSequence) &&
      this.sequenceGreaterThan(maxFuture, sequenceNumber);

    if (sequenceNumber === currentSequence) {
      // Duplicate
      console.warn(`Duplicate ${channelLabel} message: ${sequenceNumber}`);
      return true;
    }

    if (inFuture) {
      // Accept and update sequence
      if (isReliable) {
        this.incomingReliableSequence = sequenceNumber;
      } else {
        this.incomingUnreliableSequence = sequenceNumber;
      }
      return false;
    }

    // Old or too far in the future
    console.warn(
      `Out-of-order ${channelLabel} message: ${sequenceNumber} (current: ${currentSequence})`
    );
    return true;
  }

  private isInvalidStateForCommandId(id: number): boolean {
    if (this.joined) {
      return false;
    }

    return id > WebRTCType.SnapshotACK;
  }

  private sequenceGreaterThan(a: number, b: number): boolean {
    return (
      (a > b && a - b < this.SEQUENCE_PAST_WINDOW) ||
      (a < b && b - a > this.SEQUENCE_PAST_WINDOW)
    );
  }

  private sendDisconnectMessage(): void {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(WebRTCType.GracefulDisconnect)
      .toArrayBuffer();

    this.sendReliableOrderedMessage(arrayBuffer);
    console.log("Disconnect message sent");
  }

  private isLoggingEnabled(): boolean {
    return this.gameState.getDebugSettings().isWebRTCLoggingEnabled();
  }
}
