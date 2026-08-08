/**
 * EntityType — Opaque type for entity type identifiers.
 *
 * The engine treats entity types as opaque numbers. The game layer defines
 * the actual entity type values (e.g., via EntityRegistryType enum).
 *
 * Since TypeScript enums compile to numbers, any numeric enum from the
 * game layer is assignable to this type.
 */

export type EntityType = number;
