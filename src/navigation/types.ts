export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  NfcScan: undefined;
  Matchmaking: undefined;
  MatchScreen: {
    matchId: string;
    opponent: { userId: string | number; username: string };
  };
};

export type MainTabParamList = {
  Inventory: undefined;
  Arena: undefined;
  Profile: undefined;
};