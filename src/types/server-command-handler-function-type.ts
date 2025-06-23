import type { BinaryReader } from "../utils/binary-reader-utils";

export type ServerCommandHandlerFunction = (binaryReader: BinaryReader) => void;
