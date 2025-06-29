export interface ScreenManager<TScreen> {
  getCurrentScreen(): TScreen | null;
  getNextScreen(): TScreen | null;
  setCurrentScreen(screen: TScreen): void;
  setNextScreen(screen: TScreen | null): void;
}
