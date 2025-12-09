import type { BinaryReader } from "../../engine/utils/binary-reader-utils.ts";

export type ServerCommandHandlerFunction = (binaryReader: BinaryReader) => void;
