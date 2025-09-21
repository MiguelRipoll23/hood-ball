import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export type ServerCommandHandlerFunction = (binaryReader: BinaryReader) => void;
