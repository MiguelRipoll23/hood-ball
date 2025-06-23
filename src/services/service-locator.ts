const serviceRegistry = new Map<Function, any>();

export class ServiceLocator {
  public static register<T>(type: new (...args: any[]) => T, instance: T) {
    serviceRegistry.set(type, instance);
  }

  public static get<T>(type: new (...args: any[]) => T): T {
    const instance = serviceRegistry.get(type);

    if (instance === undefined) {
      throw new Error(`Service of type ${type.name} is not registered`);
    }

    return instance;
  }
}
