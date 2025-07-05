import type { BinaryReader } from "../../core/utils/binary-reader-utils.js";

export type ServerCommandHandlerFunction = (binaryReader: BinaryReader) => void;
